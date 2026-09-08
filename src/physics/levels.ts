import { LevelData } from '../types';

export const LEVELS: LevelData[] = [
  {
    id: 1,
    title: 'Level 1: First Dispatch',
    subtitle: 'Learn the controls: Drive, Crane Aim, Magnetic Grab, and Load Cargo',
    robotSpawn: { x: 200, y: 520 },
    truck: {
      x: 950,
      y: 520,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      { id: 'c1', x: 500, y: 520, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      // Floor
      { x: 600, y: 580, width: 1200, height: 40, type: 'ground' },
      // Left boundary wall
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      // Right boundary wall
      { x: 1180, y: 350, width: 40, height: 500, type: 'steel' },
      // Low training ramp
      { x: 400, y: 540, width: 100, height: 16, angle: 0.15, type: 'steel' },
      // Upper inspection beam with star
      { x: 650, y: 380, width: 180, height: 18, type: 'steel' },
    ],
    stars: [
      { id: 's1', x: 400, y: 460 },
      { id: 's2', x: 650, y: 340 },
      { id: 's3', x: 920, y: 440 },
    ],
    starTimeTargetSec: 30,
    hint: 'Drive with A/D or Arrow keys. Aim crane with Mouse and Click (or Space) to magnetize the box. Drop it into the truck cargo bay!',
  },
  {
    id: 2,
    title: 'Level 2: Double Stack',
    subtitle: 'Stack 2 cargo crates neatly in the delivery truck',
    robotSpawn: { x: 180, y: 520 },
    truck: {
      x: 1000,
      y: 520,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
        { xOffset: 30, yOffset: -80, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      { id: 'c1', x: 420, y: 520, width: 44, height: 44, type: 'wood', isCargo: true },
      { id: 'c2', x: 680, y: 380, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      // Floor
      { x: 650, y: 580, width: 1300, height: 40, type: 'ground' },
      // Left & Right boundary
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      { x: 1220, y: 350, width: 40, height: 500, type: 'steel' },
      // High mezzanine with second crate
      { x: 680, y: 430, width: 220, height: 20, type: 'steel' },
      // Stepping ledge
      { x: 500, y: 480, width: 80, height: 16, type: 'steel' },
    ],
    stars: [
      { id: 's1', x: 500, y: 430 },
      { id: 's2', x: 700, y: 320 },
      { id: 's3', x: 880, y: 420 },
    ],
    starTimeTargetSec: 35,
    hint: 'Lift the first crate into the truck floor, then carefully stack the second crate on top of it!',
  },
  {
    id: 3,
    title: 'Level 3: Hydraulic Elevator',
    subtitle: 'Use the warehouse pressure switch to operate the freight elevator',
    robotSpawn: { x: 180, y: 520 },
    truck: {
      x: 1060,
      y: 520,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      { id: 'c1', x: 640, y: 220, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      // Lower Floor
      { x: 400, y: 580, width: 800, height: 40, type: 'ground' },
      { x: 1000, y: 580, width: 400, height: 40, type: 'ground' },
      // Upper Gallery Floor
      { x: 700, y: 270, width: 340, height: 20, type: 'steel' },
      // Left & Right walls
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      { x: 1220, y: 350, width: 40, height: 500, type: 'steel' },
    ],
    elevators: [
      {
        id: 'elev1',
        x: 440,
        y: 540,
        width: 110,
        height: 16,
        startY: 540,
        targetY: 270,
        speed: 2.2,
      },
    ],
    switches: [
      {
        id: 'sw1',
        x: 280,
        y: 554,
        width: 50,
        height: 12,
        targetId: 'elev1',
        type: 'pressure',
        color: '#eab308',
      },
    ],
    stars: [
      { id: 's1', x: 300, y: 440 },
      { id: 's2', x: 440, y: 200 },
      { id: 's3', x: 800, y: 210 },
    ],
    starTimeTargetSec: 40,
    hint: 'Drive onto the yellow floor switch to elevate the hydraulic platform up to the upper deck!',
  },
  {
    id: 4,
    title: 'Level 4: Heavy Steel Weight',
    subtitle: 'A heavy metal crate is required to weigh down the gate switch',
    robotSpawn: { x: 180, y: 520 },
    truck: {
      x: 1080,
      y: 520,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      // Heavy crate for switch
      { id: 'c_heavy', x: 450, y: 510, width: 44, height: 44, type: 'metal', isCargo: false },
      // Cargo crate behind security door
      { id: 'c_cargo', x: 860, y: 520, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      { x: 650, y: 580, width: 1300, height: 40, type: 'ground' },
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      { x: 1240, y: 350, width: 40, height: 500, type: 'steel' },
      // Overhead security barrier
      { x: 720, y: 300, width: 30, height: 300, type: 'steel' },
    ],
    doors: [
      {
        id: 'door1',
        x: 720,
        y: 500,
        width: 24,
        height: 130,
        openYOffset: -120,
        color: '#f97316',
      },
    ],
    switches: [
      {
        id: 'sw_heavy',
        x: 580,
        y: 554,
        width: 56,
        height: 14,
        targetId: 'door1',
        type: 'pressure',
        color: '#f97316',
      },
    ],
    stars: [
      { id: 's1', x: 450, y: 440 },
      { id: 's2', x: 720, y: 340 },
      { id: 's3', x: 950, y: 460 },
    ],
    starTimeTargetSec: 45,
    hint: 'Pick up the heavy steel block and place it on the orange switch to keep the heavy blast door open permanently!',
  },
  {
    id: 5,
    title: 'Level 5: Conveyor Express',
    subtitle: 'Ride conveyor belts and catch moving cargo over an open gap',
    robotSpawn: { x: 180, y: 520 },
    truck: {
      x: 1100,
      y: 520,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
        { xOffset: 30, yOffset: -80, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      { id: 'c1', x: 380, y: 280, width: 44, height: 44, type: 'wood', isCargo: true },
      { id: 'c2', x: 500, y: 520, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      // Left floor
      { x: 280, y: 580, width: 560, height: 40, type: 'ground' },
      // Right floor
      { x: 1000, y: 580, width: 480, height: 40, type: 'ground' },
      // High gantry with first crate
      { x: 420, y: 330, width: 260, height: 18, type: 'steel' },
      // Boundary
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      { x: 1260, y: 350, width: 40, height: 500, type: 'steel' },
    ],
    conveyors: [
      {
        id: 'conv1',
        x: 680,
        y: 550,
        width: 240,
        height: 20,
        direction: 1,
        speed: 2.8,
      },
    ],
    stars: [
      { id: 's1', x: 420, y: 250 },
      { id: 's2', x: 680, y: 490 },
      { id: 's3', x: 920, y: 450 },
    ],
    starTimeTargetSec: 45,
    hint: 'Use the motorized conveyor bridge to transport crates across the open pit to the loading dock!',
  },
  {
    id: 6,
    title: 'Level 6: Demolition TNT',
    subtitle: 'Detonate the TNT crate to demolish the sealed brick barrier',
    robotSpawn: { x: 180, y: 520 },
    truck: {
      x: 1080,
      y: 520,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      // Explosive crate
      { id: 'c_tnt', x: 380, y: 520, width: 44, height: 44, type: 'tnt', isCargo: false },
      // Protected cargo
      { id: 'c_wood', x: 850, y: 520, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      { x: 650, y: 580, width: 1300, height: 40, type: 'ground' },
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      { x: 1240, y: 350, width: 40, height: 500, type: 'steel' },
      // Upper ceiling beam
      { x: 620, y: 280, width: 24, height: 320, type: 'steel' },
    ],
    destructibleWalls: [
      {
        id: 'wall1',
        x: 620,
        y: 490,
        width: 32,
        height: 140,
        material: 'cracked_brick',
      },
    ],
    stars: [
      { id: 's1', x: 380, y: 440 },
      { id: 's2', x: 620, y: 360 },
      { id: 's3', x: 960, y: 450 },
    ],
    starTimeTargetSec: 40,
    hint: 'Grab the red TNT crate with your crane and hurl it or drop it against the cracked brick wall to blow it wide open!',
  },
  {
    id: 7,
    title: 'Level 7: The Bouncy Launch',
    subtitle: 'Deploy bouncy rubber crates to scale towering obstacles',
    robotSpawn: { x: 180, y: 520 },
    truck: {
      x: 1100,
      y: 280,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      // Bouncy crate
      { id: 'c_bounce', x: 380, y: 520, width: 44, height: 44, type: 'bouncy', isCargo: false },
      // Wood cargo
      { id: 'c_wood', x: 580, y: 520, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      // Ground floor
      { x: 450, y: 580, width: 900, height: 40, type: 'ground' },
      // High loading platform where truck is parked
      { x: 1050, y: 340, width: 400, height: 30, type: 'steel' },
      // Middle jump step
      { x: 780, y: 420, width: 90, height: 18, type: 'steel' },
      // Boundaries
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      { x: 1260, y: 350, width: 40, height: 500, type: 'steel' },
    ],
    stars: [
      { id: 's1', x: 380, y: 430 },
      { id: 's2', x: 780, y: 340 },
      { id: 's3', x: 980, y: 220 },
    ],
    starTimeTargetSec: 45,
    hint: 'The high truck dock is out of reach! Position the green bouncy crate and jump on it for a super high bounce!',
  },
  {
    id: 8,
    title: 'Level 8: Master Warehouse Logistics',
    subtitle: 'The Ultimate Challenge: Elevators, Blast Demolition, Heavy Switches & Multi-Cargo Stacking',
    robotSpawn: { x: 180, y: 520 },
    truck: {
      x: 1120,
      y: 520,
      slots: [
        { xOffset: 30, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
        { xOffset: 30, yOffset: -80, width: 44, height: 44, requiredType: 'wood' },
        { xOffset: 85, yOffset: -30, width: 44, height: 44, requiredType: 'wood' },
      ],
    },
    crates: [
      { id: 'c_tnt', x: 340, y: 520, width: 44, height: 44, type: 'tnt', isCargo: false },
      { id: 'c1', x: 620, y: 180, width: 44, height: 44, type: 'wood', isCargo: true },
      { id: 'c2', x: 880, y: 520, width: 44, height: 44, type: 'wood', isCargo: true },
      { id: 'c3', x: 180, y: 320, width: 44, height: 44, type: 'wood', isCargo: true },
    ],
    platforms: [
      // Ground
      { x: 650, y: 580, width: 1300, height: 40, type: 'ground' },
      // High left floor
      { x: 220, y: 370, width: 260, height: 20, type: 'steel' },
      // High middle platform
      { x: 640, y: 240, width: 220, height: 20, type: 'steel' },
      // Overhead partition
      { x: 500, y: 250, width: 20, height: 220, type: 'steel' },
      // Boundaries
      { x: 20, y: 350, width: 40, height: 500, type: 'steel' },
      { x: 1260, y: 350, width: 40, height: 500, type: 'steel' },
    ],
    destructibleWalls: [
      {
        id: 'wall_final',
        x: 760,
        y: 500,
        width: 32,
        height: 120,
        material: 'cracked_brick',
      },
    ],
    elevators: [
      {
        id: 'elev_master',
        x: 440,
        y: 530,
        width: 100,
        height: 16,
        startY: 530,
        targetY: 240,
        speed: 2.5,
      },
    ],
    switches: [
      {
        id: 'sw_master',
        x: 220,
        y: 354,
        width: 48,
        height: 12,
        targetId: 'elev_master',
        type: 'pressure',
        color: '#10b981',
      },
    ],
    stars: [
      { id: 's1', x: 220, y: 290 },
      { id: 's2', x: 640, y: 140 },
      { id: 's3', x: 840, y: 440 },
    ],
    starTimeTargetSec: 75,
    hint: 'Blow through the brick wall with TNT, use the elevator to access high cargo, and load all 3 wooden crates into the heavy transport truck!',
  },
];
