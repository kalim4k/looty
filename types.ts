export enum GameState {
  IDLE = 'idle',
  INFLATING = 'inflating',
  CRASHED = 'crashed',
  CASHED = 'cashed',
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
}
