import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { DESSERT_TYPES, PHYSICS, CATEGORIES, ItemType } from '../constants';
import { audioManager } from '../utils/audio';

interface GameCanvasProps {
  onScoreUpdate: (points: number) => void;
  onNextItemChange: (item: ItemType) => void;
  onGameOver: () => void;
  isGameOver: boolean;
  gameStarted: boolean;
  restartTrigger: number;
}

// Animation easing function for "pop" effect
function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onScoreUpdate,
  onNextItemChange,
  onGameOver,
  isGameOver,
  gameStarted,
  restartTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderLoopRef = useRef<number | null>(null);
  
  // Game State Refs
  const nextItemIdRef = useRef<number>(0);
  const isAimingRef = useRef<boolean>(false);
  const aimAngleRef = useRef<number>(-Math.PI / 2);
  const aimPowerRef = useRef<number>(0.5); // 0.0 to 1.0
  const canShootRef = useRef<boolean>(true);
  
  const getRandomSmallItemId = () => Math.floor(Math.random() * 3);

  // --- Initialization ---
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // Use physics settings from constants (now with negative gravity for tilt)
    const engine = Matter.Engine.create({
      enableSleeping: true,
      gravity: { x: 0, y: PHYSICS.GRAVITY_Y }, 
      positionIterations: 8, // Increase precision for collisions
      velocityIterations: 8,
    });
    engineRef.current = engine;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Walls & Ground
    const wallOptions = {
      isStatic: true,
      render: { visible: false },
      friction: 0.1,
      restitution: 0.6, // Bouncy walls
      collisionFilter: {
        category: CATEGORIES.WALL,
        mask: CATEGORIES.ITEM,
      }
    };

    // Top Wall
    const topWallY = PHYSICS.TOP_BOUNDARY_OFFSET - (PHYSICS.WALL_THICKNESS / 2);
    const topWall = Matter.Bodies.rectangle(width / 2, topWallY, width, PHYSICS.WALL_THICKNESS, { 
        ...wallOptions, 
        label: 'top_wall' 
    });
    
    // Bottom Wall
    const bottomWall = Matter.Bodies.rectangle(width / 2, height + PHYSICS.WALL_THICKNESS / 2 + 100, width, PHYSICS.WALL_THICKNESS, wallOptions);

    const leftWall = Matter.Bodies.rectangle(0 - PHYSICS.WALL_THICKNESS / 2, height / 2, PHYSICS.WALL_THICKNESS, height * 3, wallOptions);
    const rightWall = Matter.Bodies.rectangle(width + PHYSICS.WALL_THICKNESS / 2, height / 2, PHYSICS.WALL_THICKNESS, height * 3, wallOptions);

    Matter.World.add(engine.world, [topWall, bottomWall, leftWall, rightWall]);

    // Collision Logic
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      for (const pair of pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if (bodyA.label === bodyB.label && bodyA.label.startsWith('item_') && bodyA.id < bodyB.id) {
            const typeId = parseInt(bodyA.label.split('_')[1]);
            
            if (typeId < DESSERT_TYPES.length - 1) {
                const newTypeId = typeId + 1;
                const newType = DESSERT_TYPES[newTypeId];
                
                const midX = (bodyA.position.x + bodyB.position.x) / 2;
                const midY = (bodyA.position.y + bodyB.position.y) / 2;

                Matter.World.remove(engine.world, [bodyA, bodyB]);

                // Create new body with animation timestamp
                const newBody = createItemBody(midX, midY, newTypeId, false, true);
                Matter.World.add(engine.world, newBody);

                // Apply gentle upward force/velocity to the new item
                Matter.Body.setVelocity(newBody, { 
                    x: (Math.random() - 0.5) * 1.5, // Slight horizontal jitter to prevent stacking
                    y: -4 // Stronger upward push to complement gravity
                });

                audioManager.play('merge');
                
                onScoreUpdate(newType.score);
                audioManager.play('coin', 0.4);
            }
        } else if (bodyA.label.startsWith('item_') && bodyB.label.startsWith('item_')) {
            const speed = Math.abs(bodyA.speed - bodyB.speed);
            if (speed > 1.0) {
                audioManager.play('clink', Math.min(speed / 10, 0.8));
            }
        } else if ((bodyA.label === 'top_wall' || bodyB.label === 'top_wall')) {
             const item = bodyA.label === 'top_wall' ? bodyB : bodyA;
             if(item.speed > 1) {
                audioManager.play('clink', 0.3);
             }
        }
      }
    });

    nextItemIdRef.current = getRandomSmallItemId();
    onNextItemChange(DESSERT_TYPES[nextItemIdRef.current]);

    return () => {
        Matter.Engine.clear(engine);
        engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartTrigger]);

  const createItemBody = (x: number, y: number, typeId: number, isSensor = false, animate = false) => {
    const type = DESSERT_TYPES[typeId];
    return Matter.Bodies.circle(x, y, type.radius, {
      label: `item_${typeId}`,
      restitution: type.restitution,
      density: 0.001 * type.mass,
      friction: PHYSICS.FRICTION,
      frictionAir: PHYSICS.FRICTION_AIR,
      isSensor: isSensor,
      collisionFilter: {
        category: CATEGORIES.ITEM,
        mask: CATEGORIES.WALL | CATEGORIES.ITEM,
      },
      render: {
          visible: true,
          // Custom property to track creation time for animation
          // Using `any` casting to bypass Matter types which don't include custom render props
          timestamp: animate ? Date.now() : 0 
      } as any
    });
  };

  const drawTableBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const limitY = height - 160; 
    
    ctx.beginPath();
    ctx.moveTo(20, limitY);
    ctx.lineTo(width - 20, limitY);
    ctx.setLineDash([15, 15]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; 
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.textAlign = 'right';
    ctx.fillText('FULL LINE', width - 25, limitY - 8);
  };

  const drawItemVisual = (ctx: CanvasRenderingContext2D, type: ItemType) => {
     // 1. Outer Glass Shell (Transparent) - Thinner rim
    ctx.beginPath();
    ctx.arc(0, 0, type.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // More transparent body
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; // Glass rim
    ctx.stroke();

    // 2. Inner Liquid/Color (Much fuller now: 0.95 instead of 0.85)
    ctx.beginPath();
    ctx.arc(0, 0, type.radius * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = type.color; 
    ctx.fill();
    
    // 3. Center Detail / Float (Secondary color) - Larger too
    ctx.beginPath();
    ctx.arc(0, 0, type.radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = type.colorCenter; 
    ctx.fill();
    
    // 4. Glossy Highlight - Sharper
    ctx.beginPath();
    ctx.arc(-type.radius * 0.35, -type.radius * 0.35, type.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    // 5. Icon - Slightly Larger
    ctx.font = `${type.radius * 1.1}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(type.icon, 0, 0);
  };

  const updateLoop = useCallback(() => {
    if (!engineRef.current || !canvasRef.current || !containerRef.current) return;

    const engine = engineRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    Matter.Engine.update(engine, 1000 / 60);

    ctx.clearRect(0, 0, width, height); // Clear canvas
    drawTableBackground(ctx, width, height);

    // Render Bodies
    const bodies = Matter.Composite.allBodies(engine.world);
    const limitY = height - 160; // Must match drawing
    const now = Date.now();

    bodies.forEach(body => {
      if (body.label.startsWith('item_')) {
        const typeId = parseInt(body.label.split('_')[1]);
        const type = DESSERT_TYPES[typeId];
        const { x, y } = body.position;
        const angle = body.angle;

        // Calculate Scale Animation
        let scale = 1;
        const creationTime = (body.render as any).timestamp || 0;
        if (creationTime > 0) {
            const age = now - creationTime;
            const duration = 500; // Animation duration in ms
            if (age < duration) {
                // Pop effect: Start small, overshoot, settle
                scale = 0.5 + 0.5 * easeOutElastic(age / duration);
            }
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale); 

        drawItemVisual(ctx, type);

        ctx.restore();

        // Check for Game Over 
        if (!isGameOver && gameStarted && canShootRef.current) { 
             // speed < 0.1 means stopped.
             if (y > limitY && body.speed < 0.1) {
                onGameOver();
             }
        }
      }
    });

    // Render Launcher / Aim Line
    if (!isGameOver && gameStarted) {
        const cx = width / 2;
        const cy = height - 60; // Launcher Position
        
        // Aim Line
        if (isAimingRef.current) {
            // Visual Length based on Power
            const minLen = 50;
            const maxLen = 350;
            const currentLen = minLen + (maxLen - minLen) * aimPowerRef.current;

            const lx = cx + Math.cos(aimAngleRef.current) * currentLen;
            const ly = cy + Math.sin(aimAngleRef.current) * currentLen;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(lx, ly);
            
            // Dashed line changes with power, but COLOR IS WHITE AGAIN
            ctx.setLineDash([8 + (aimPowerRef.current * 10), 8]);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + aimPowerRef.current * 0.3})`; // White, opacity varies
            ctx.lineWidth = 3 + (aimPowerRef.current * 2); // Gets thicker
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw Target Dot
            ctx.beginPath();
            ctx.arc(lx, ly, 6 + aimPowerRef.current * 4, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
            ctx.fill();
        }

        // Current Item (Ready to fire)
        if (canShootRef.current) {
            const currentType = DESSERT_TYPES[nextItemIdRef.current];
            
            ctx.save();
            ctx.translate(cx, cy);
            
            drawItemVisual(ctx, currentType);

            ctx.restore();
        }
    }

    renderLoopRef.current = requestAnimationFrame(updateLoop);
  }, [gameStarted, isGameOver, onGameOver]);

  useEffect(() => {
    renderLoopRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current);
    };
  }, [updateLoop]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isGameOver || !gameStarted || !canShootRef.current) return;
    isAimingRef.current = true;
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isAimingRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height - 60;
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const dx = clientX - cx;
    const dy = clientY - cy;

    // 1. Calculate Angle
    let angle = Math.atan2(dy, dx);
    
    // Constrain aiming to upward cone
    // -PI is left, -PI/2 is up, 0 is right.
    const minAngle = -Math.PI + 0.1;
    const maxAngle = -0.1;
    
    if (angle > 0) angle = Math.max(-Math.PI/2, angle - Math.PI*2); 
    if (angle < minAngle) angle = minAngle;
    if (angle > maxAngle) angle = maxAngle;

    aimAngleRef.current = angle;

    // 2. Calculate Power based on Distance
    // Distance from launcher center
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = 300; // Max drag distance for full power
    
    // Normalize power between 0 and 1
    // You have to drag at least 50px to start increasing power
    let power = Math.min(dist, maxDist) / maxDist;
    // Curve the power so it feels responsive (linear is fine too)
    aimPowerRef.current = power;
  };

  const handlePointerUp = () => {
    if (!isAimingRef.current || !canShootRef.current || !engineRef.current || !containerRef.current) return;
    isAimingRef.current = false;
    shootItem();
  };

  const shootItem = () => {
    canShootRef.current = false;
    const engine = engineRef.current!;
    const width = containerRef.current!.clientWidth;
    const height = containerRef.current!.clientHeight;
    
    const startX = width / 2;
    const startY = height - 60; 

    const typeId = nextItemIdRef.current;
    // Don't animate the shooter projectile pop to avoid visual glitch during fast movement
    const body = createItemBody(startX, startY, typeId, false, false); 
    
    Matter.World.add(engine.world, body);

    // Calculate speed based on screen width AND drag power
    let baseSpeed = PHYSICS.SHOOT_SPEED;
    if (width > 500) {
        baseSpeed *= 1.2;
    }

    // Power mapping:
    // Min power (close to ball) -> 0.6x speed
    // Max power (far from ball) -> 1.5x speed
    const powerMultiplier = 0.6 + (aimPowerRef.current * 0.9);
    
    const finalSpeed = baseSpeed * powerMultiplier;

    const velocityX = Math.cos(aimAngleRef.current) * finalSpeed;
    const velocityY = Math.sin(aimAngleRef.current) * finalSpeed;

    Matter.Body.setVelocity(body, { x: velocityX, y: velocityY });

    audioManager.play('shoot');

    setTimeout(() => {
        nextItemIdRef.current = getRandomSmallItemId();
        onNextItemChange(DESSERT_TYPES[nextItemIdRef.current]);
        canShootRef.current = true;
    }, 500);
  };

  return (
    <div 
        ref={containerRef} 
        className="relative w-full h-full touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => isAimingRef.current = false}
    >
        <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
