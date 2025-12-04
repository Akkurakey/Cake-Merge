export interface ItemType {
  id: number;
  name: string;
  radius: number;
  color: string;
  colorCenter: string; // Used for frosting/detail
  icon: string;
  score: number;
  mass: number;
  restitution: number;
}

export const DESSERT_TYPES: ItemType[] = [
  { id: 0, name: "Berry Macaron", radius: 22, color: "#fbcfe8", colorCenter: "#ec4899", icon: "🍬", score: 10, mass: 1, restitution: 0.6 },
  { id: 1, name: "Choco Cookie", radius: 30, color: "#d4a373", colorCenter: "#78350f", icon: "🍪", score: 20, mass: 1.5, restitution: 0.5 },
  { id: 2, name: "Glazed Donut", radius: 40, color: "#fca5a5", colorCenter: "#fee2e2", icon: "🍩", score: 40, mass: 2, restitution: 0.5 },
  { id: 3, name: "Vanilla Cupcake", radius: 50, color: "#60a5fa", colorCenter: "#e0f2fe", icon: "🧁", score: 80, mass: 2.5, restitution: 0.4 },
  { id: 4, name: "Caramel Pudding", radius: 62, color: "#fde047", colorCenter: "#854d0e", icon: "🍮", score: 150, mass: 3, restitution: 0.4 },
  { id: 5, name: "Strawberry Slice", radius: 74, color: "#ffe4e6", colorCenter: "#f43f5e", icon: "🍰", score: 300, mass: 4, restitution: 0.3 },
  { id: 6, name: "Fluffy Pancakes", radius: 88, color: "#fbbf24", colorCenter: "#fef3c7", icon: "🥞", score: 500, mass: 5, restitution: 0.3 },
  { id: 7, name: "Birthday Cake", radius: 102, color: "#f87171", colorCenter: "#fef2f2", icon: "🎂", score: 800, mass: 6, restitution: 0.2 },
  { id: 8, name: "Fruit Tart", radius: 118, color: "#fdba74", colorCenter: "#fff7ed", icon: "🥧", score: 1500, mass: 8, restitution: 0.2 },
  { id: 9, name: "Wedding Tier", radius: 140, color: "#c084fc", colorCenter: "#f3e8ff", icon: "💒", score: 3000, mass: 10, restitution: 0.1 },
];

export const PHYSICS = {
  GRAVITY_Y: -0.25, // Negative gravity makes items gently drift towards the top (tilted table)
  SHOOT_SPEED: 10, // Lowered from 12 to 10 to reduce initial force on larger screens
  WALL_THICKNESS: 1000, // Greatly increased thickness to prevent tunneling
  TOP_BOUNDARY_OFFSET: 40, // Height of the visual top border overlay
  FRICTION: 0.1, // Surface friction on collision
  FRICTION_AIR: 0.02, // Lower drag for smoother sliding that eventually stops
  GAME_WIDTH: 450,
  GAME_HEIGHT: 750,
};

export const CATEGORIES = {
  DEFAULT: 0x0001,
  ITEM: 0x0002,
  WALL: 0x0004,
  SENSOR: 0x0008,
};
