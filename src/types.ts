export type BoxType = 'wood' | 'metal' | 'tnt' | 'bouncy';

export interface LevelStarRequirement {
  collectAllStars: boolean;
  timeLimitSec: number;
}

export interface CrateDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BoxType;
  isCargo?: boolean; // Must this box be loaded into truck?
}

export interface TruckSlotDef {
  xOffset: number; // offset relative to truck cargo bay
  yOffset: number;
  width: number;
  height: number;
  requiredType?: BoxType;
  filled?: boolean;
}

export interface TruckDef {
  x: number;
  y: number;
  slots: TruckSlotDef[];
}

export interface SwitchDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetId: string; // id of door, elevator, or conveyor to trigger
  type: 'pressure' | 'toggle';
  color?: string;
}

export interface DoorDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  openYOffset: number; // how far it slides when open
  color?: string;
}

export interface ElevatorDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startY: number;
  targetY: number;
  speed: number;
  autoLoop?: boolean;
}

export interface ConveyorDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 1 | -1; // 1 = right, -1 = left
  speed: number;
}

export interface DestructibleWallDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  material: 'cracked_brick' | 'wood_plank';
}

export interface StarCollectibleDef {
  id: string;
  x: number;
  y: number;
  collected?: boolean;
}

export interface PlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  type?: 'ground' | 'steel' | 'hazard' | 'slope';
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  robotSpawn: { x: number; y: number };
  truck: TruckDef;
  crates: CrateDef[];
  platforms: PlatformDef[];
  switches?: SwitchDef[];
  doors?: DoorDef[];
  elevators?: ElevatorDef[];
  conveyors?: ConveyorDef[];
  destructibleWalls?: DestructibleWallDef[];
  stars?: StarCollectibleDef[];
  starTimeTargetSec: number;
  hint?: string;
}

export interface LevelProgress {
  stars: number; // 0-3
  completed: boolean;
  bestTimeSec?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'smoke' | 'spark' | 'debris' | 'star' | 'dust' | 'fire';
}
