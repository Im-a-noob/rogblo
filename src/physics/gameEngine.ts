import Matter from 'matter-js';
import { BoxType, CrateDef, DestructibleWallDef, LevelData, Particle, TruckSlotDef } from '../types';
import { sounds } from '../audio/soundEffects';

const { Engine, World, Bodies, Body, Constraint, Vector } = Matter;

export interface GameEngineCallbacks {
  onLevelComplete: (timeSec: number, starsEarned: number, allStarsFound: boolean) => void;
  onStarCollected: (count: number, total: number) => void;
  onSlotFilled: (filledCount: number, totalCount: number) => void;
}

export class GameEngine {
  public engine: Matter.Engine;
  public world: Matter.World;
  public level: LevelData;
  public callbacks: GameEngineCallbacks;

  // Robot elements
  public robotChassis!: Matter.Body;
  public robotWheelLeft!: Matter.Body;
  public robotWheelRight!: Matter.Body;
  public robotArmBase!: Matter.Body; // kinematic / constraint pivot
  public craneTipPos: { x: number; y: number } = { x: 0, y: 0 };
  public craneTipVel: { x: number; y: number } = { x: 0, y: 0 };
  public armAngle: number = -Math.PI / 4;
  public armExtension: number = 70; // min 40, max 140
  public isMagnetActive: boolean = false;
  public heldCrate: { body: Matter.Body; crateDef: CrateDef; constraint: Matter.Constraint } | null = null;
  public isGrounded: boolean = false;
  public lastGroundedTime: number = 0;
  public lastJumpTime: number = 0;
  public robotFacing: 1 | -1 = 1;

  // Level bodies
  public crateBodies: Map<number, { body: Matter.Body; def: CrateDef; tntArmed?: boolean; fuseTimer?: number }> = new Map();
  public platforms: Matter.Body[] = [];
  public doors: Map<string, { body: Matter.Body; startY: number; targetY: number; currentOpen: number }> = new Map();
  public elevators: Map<string, { body: Matter.Body; startY: number; targetY: number; currentY: number; speed: number; direction: number }> = new Map();
  public switches: Map<string, { body: Matter.Body; targetId: string; pressed: boolean; baseHeight: number }> = new Map();
  public conveyors: Map<string, { body: Matter.Body; direction: 1 | -1; speed: number }> = new Map();
  public destructibleWalls: Map<string, { body: Matter.Body; def: DestructibleWallDef }> = new Map();

  // Truck
  public truckSlots: (TruckSlotDef & { isFilled: boolean })[] = [];
  public truckBody!: Matter.Body;
  public truckCompleted: boolean = false;
  public truckCompleteTimer: number = 0;
  public truckDriveOffX: number = 0;

  // Stars & collectibles
  public stars: { id: string; x: number; y: number; collected: boolean; animOffset: number }[] = [];
  public collectedStarsCount: number = 0;

  // Visuals & Camera
  public particles: Particle[] = [];
  public camera = { x: 0, y: 0, targetX: 0, targetY: 0, shake: 0 };
  public mousePos = { x: 400, y: 300 }; // world coordinates
  public aimOffset = { x: 85, y: -45 }; // offset from robot shoulder pivot
  public hasManualAim: boolean = false;
  public input = { left: false, right: false, jump: false, magnetToggle: false };

  public levelTimeSec: number = 0;
  public isRunning: boolean = false;
  private animFrameId: number | null = null;
  private lastTimestamp: number = 0;

  constructor(level: LevelData, callbacks: GameEngineCallbacks) {
    this.level = level;
    this.callbacks = callbacks;
    this.engine = Engine.create({
      gravity: { x: 0, y: 1.3, scale: 0.001 },
    });
    this.world = this.engine.world;
    this.initLevel();
  }

  public initLevel() {
    World.clear(this.world, false);
    Engine.clear(this.engine);
    this.crateBodies.clear();
    this.doors.clear();
    this.elevators.clear();
    this.switches.clear();
    this.conveyors.clear();
    this.destructibleWalls.clear();
    this.particles = [];
    this.heldCrate = null;
    this.truckCompleted = false;
    this.truckCompleteTimer = 0;
    this.truckDriveOffX = 0;
    this.levelTimeSec = 0;
    this.collectedStarsCount = 0;

    // Build Robot Forklift
    this.createRobot(this.level.robotSpawn.x, this.level.robotSpawn.y);

    // Build Platforms & Static Walls
    this.level.platforms.forEach((p) => {
      const plat = Bodies.rectangle(p.x, p.y, p.width, p.height, {
        isStatic: true,
        angle: p.angle || 0,
        friction: 0.9,
        restitution: 0.05,
        render: { fillStyle: p.type === 'ground' ? '#334155' : '#475569' },
      });
      this.platforms.push(plat);
      World.add(this.world, plat);
    });

    // Build Crates
    this.level.crates.forEach((c) => {
      this.spawnCrate(c);
    });

    // Build Truck
    this.buildTruck();

    // Build Switches
    if (this.level.switches) {
      this.level.switches.forEach((sw) => {
        const swBody = Bodies.rectangle(sw.x, sw.y, sw.width, sw.height, {
          isStatic: true,
          isSensor: false,
          label: 'switch',
        });
        this.switches.set(sw.id, {
          body: swBody,
          targetId: sw.targetId,
          pressed: false,
          baseHeight: sw.height,
        });
        World.add(this.world, swBody);
      });
    }

    // Build Doors
    if (this.level.doors) {
      this.level.doors.forEach((d) => {
        const doorBody = Bodies.rectangle(d.x, d.y, d.width, d.height, {
          isStatic: true,
          label: 'door',
        });
        this.doors.set(d.id, {
          body: doorBody,
          startY: d.y,
          targetY: d.y + d.openYOffset,
          currentOpen: 0,
        });
        World.add(this.world, doorBody);
      });
    }

    // Build Elevators
    if (this.level.elevators) {
      this.level.elevators.forEach((e) => {
        const elevBody = Bodies.rectangle(e.x, e.y, e.width, e.height, {
          isStatic: true,
          label: 'elevator',
          friction: 1,
        });
        this.elevators.set(e.id, {
          body: elevBody,
          startY: e.startY,
          targetY: e.targetY,
          currentY: e.y,
          speed: e.speed,
          direction: 1,
        });
        World.add(this.world, elevBody);
      });
    }

    // Build Conveyors
    if (this.level.conveyors) {
      this.level.conveyors.forEach((cv) => {
        const convBody = Bodies.rectangle(cv.x, cv.y, cv.width, cv.height, {
          isStatic: true,
          friction: 0.9,
          label: 'conveyor',
        });
        this.conveyors.set(cv.id, {
          body: convBody,
          direction: cv.direction,
          speed: cv.speed,
        });
        World.add(this.world, convBody);
      });
    }

    // Build Destructible Walls
    if (this.level.destructibleWalls) {
      this.level.destructibleWalls.forEach((dw) => {
        const dwBody = Bodies.rectangle(dw.x, dw.y, dw.width, dw.height, {
          isStatic: true,
          label: 'destructible',
        });
        this.destructibleWalls.set(dw.id, {
          body: dwBody,
          def: dw,
        });
        World.add(this.world, dwBody);
      });
    }

    // Stars
    this.stars = (this.level.stars || []).map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      collected: false,
      animOffset: Math.random() * Math.PI * 2,
    }));

    // Center camera on robot
    this.camera.x = this.level.robotSpawn.x;
    this.camera.y = this.level.robotSpawn.y - 60;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;

    this.aimOffset = { x: 85, y: -45 };
    this.hasManualAim = false;
    this.mousePos.x = this.level.robotSpawn.x + 85;
    this.mousePos.y = this.level.robotSpawn.y - 60;

    // Setup Collision Events
    this.setupCollisionHandlers();
  }

  private createRobot(spawnX: number, spawnY: number) {
    const chassisW = 66;
    const chassisH = 34;
    const wheelR = 16;
    const wheelSpacing = 24;

    // Chassis body
    this.robotChassis = Bodies.rectangle(spawnX, spawnY, chassisW, chassisH, {
      friction: 0.5,
      frictionAir: 0.015,
      restitution: 0.05,
      density: 0.005,
      label: 'robot_chassis',
      collisionFilter: { group: -1 },
    });

    // Wheels
    this.robotWheelLeft = Bodies.circle(spawnX - wheelSpacing, spawnY + 20, wheelR, {
      friction: 0.95,
      frictionAir: 0.015,
      restitution: 0.02,
      density: 0.006,
      label: 'robot_wheel',
      collisionFilter: { group: -1 },
    });

    this.robotWheelRight = Bodies.circle(spawnX + wheelSpacing, spawnY + 20, wheelR, {
      friction: 0.95,
      frictionAir: 0.015,
      restitution: 0.02,
      density: 0.006,
      label: 'robot_wheel',
      collisionFilter: { group: -1 },
    });

    // Suspension constraints
    const springLeft = Constraint.create({
      bodyA: this.robotChassis,
      pointA: { x: -wheelSpacing, y: 14 },
      bodyB: this.robotWheelLeft,
      stiffness: 0.92,
      damping: 0.55,
      length: 8,
    });

    const springRight = Constraint.create({
      bodyA: this.robotChassis,
      pointA: { x: wheelSpacing, y: 14 },
      bodyB: this.robotWheelRight,
      stiffness: 0.92,
      damping: 0.55,
      length: 8,
    });

    World.add(this.world, [
      this.robotChassis,
      this.robotWheelLeft,
      this.robotWheelRight,
      springLeft,
      springRight,
    ]);
  }

  public spawnCrate(c: CrateDef): Matter.Body {
    const isMetal = c.type === 'metal';
    const isBouncy = c.type === 'bouncy';
    const isTnt = c.type === 'tnt';

    const crateBody = Bodies.rectangle(c.x, c.y, c.width, c.height, {
      density: isMetal ? 0.01 : 0.0025,
      friction: 0.8,
      frictionAir: 0.015,
      restitution: isBouncy ? 0.95 : 0.1,
      chamfer: { radius: 3 },
      label: `crate_${c.type}`,
    });

    this.crateBodies.set(crateBody.id, {
      body: crateBody,
      def: c,
      tntArmed: false,
    });
    World.add(this.world, crateBody);
    return crateBody;
  }

  private buildTruck() {
    const t = this.level.truck;
    this.truckSlots = t.slots.map((s) => ({
      ...s,
      isFilled: false,
    }));

    // Static body for truck flatbed base and front cabin
    const bedWidth = 140;
    const bedHeight = 16;
    const bedBody = Bodies.rectangle(t.x + 50, t.y + 14, bedWidth, bedHeight, {
      isStatic: true,
      friction: 0.9,
      label: 'truck_bed',
    });

    // Front cabin bumper/wall so cargo doesn't slide forward
    const cabinWall = Bodies.rectangle(t.x + 125, t.y - 20, 20, 60, {
      isStatic: true,
      label: 'truck_cabin',
    });

    this.truckBody = bedBody;
    World.add(this.world, [bedBody, cabinWall]);
  }

  private setupCollisionHandlers() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Ground check for robot jumping
        if (
          (bodyA === this.robotWheelLeft || bodyA === this.robotWheelRight) ||
          (bodyB === this.robotWheelLeft || bodyB === this.robotWheelRight)
        ) {
          this.isGrounded = true;
          this.lastGroundedTime = Date.now();
        }

        // Crate Impact Sound & TNT Trigger
        const crateA = this.crateBodies.get(bodyA.id);
        const crateB = this.crateBodies.get(bodyB.id);
        const crateEntry = crateA || crateB;

        if (crateEntry) {
          const speed = Math.sqrt(
            Math.pow(crateEntry.body.velocity.x, 2) + Math.pow(crateEntry.body.velocity.y, 2)
          );
          if (speed > 3) {
            sounds.playImpact(speed / 5, crateEntry.def.type);
            this.addDebrisParticles(crateEntry.body.position.x, crateEntry.body.position.y, 4, '#ca8a04');

            // High impact TNT explosion
            if (crateEntry.def.type === 'tnt' && speed > 5.5) {
              this.detonateTNT(crateEntry.body);
            }
          }
        }
      });
    });

    Matter.Events.on(this.engine, 'collisionActive', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        if (
          (bodyA === this.robotWheelLeft || bodyA === this.robotWheelRight) ||
          (bodyB === this.robotWheelLeft || bodyB === this.robotWheelRight)
        ) {
          this.isGrounded = true;
          this.lastGroundedTime = Date.now();
        }
      });
    });
  }

  public setAimOffset(offsetX: number, offsetY: number) {
    this.aimOffset.x = offsetX;
    this.aimOffset.y = offsetY;
    this.hasManualAim = true;
    if (this.robotChassis) {
      const pivotX = this.robotChassis.position.x - this.robotFacing * 6;
      const pivotY = this.robotChassis.position.y - 12;
      this.mousePos.x = pivotX + offsetX;
      this.mousePos.y = pivotY + offsetY;
    }
  }

  public setAimWorldPosition(worldX: number, worldY: number) {
    this.mousePos.x = worldX;
    this.mousePos.y = worldY;
    if (this.robotChassis) {
      const pivotX = this.robotChassis.position.x - this.robotFacing * 6;
      const pivotY = this.robotChassis.position.y - 12;
      this.aimOffset.x = worldX - pivotX;
      this.aimOffset.y = worldY - pivotY;
      this.hasManualAim = true;
    }
  }

  public resetRobotPosition() {
    if (this.heldCrate) {
      this.releaseCrate();
    }
    const spawnX = this.level.robotSpawn.x;
    const spawnY = this.level.robotSpawn.y;
    Body.setPosition(this.robotChassis, { x: spawnX, y: spawnY });
    Body.setVelocity(this.robotChassis, { x: 0, y: 0 });
    Body.setAngularVelocity(this.robotChassis, 0);
    Body.setAngle(this.robotChassis, 0);

    Body.setPosition(this.robotWheelLeft, { x: spawnX - 24, y: spawnY + 20 });
    Body.setVelocity(this.robotWheelLeft, { x: 0, y: 0 });
    Body.setAngularVelocity(this.robotWheelLeft, 0);

    Body.setPosition(this.robotWheelRight, { x: spawnX + 24, y: spawnY + 20 });
    Body.setVelocity(this.robotWheelRight, { x: 0, y: 0 });
    Body.setAngularVelocity(this.robotWheelRight, 0);

    this.camera.x = spawnX;
    this.camera.y = spawnY - 40;
    this.camera.targetX = spawnX;
    this.camera.targetY = spawnY - 40;
  }

  public setMousePosition(canvasX: number, canvasY: number, canvasWidth: number, canvasHeight: number) {
    // Transform screen coords to world coords via camera
    const worldX = canvasX - canvasWidth / 2 + this.camera.x;
    const worldY = canvasY - canvasHeight / 2 + this.camera.y;
    this.mousePos.x = worldX;
    this.mousePos.y = worldY;
  }

  public triggerJump() {
    const now = Date.now();
    // Generous coyote-time window (140ms) and debounce (220ms)
    const canJump = (this.isGrounded || now - this.lastGroundedTime < 140) && (now - this.lastJumpTime > 220);

    if (canJump) {
      this.lastJumpTime = now;
      this.lastGroundedTime = 0;
      this.isGrounded = false;

      // High-performance hydraulic jump velocity (yields ~125px vertical clearance!)
      const jumpVelY = -9.8;

      // Ensure robust horizontal leap distance when driving left or right
      let currentVx = this.robotChassis.velocity.x;
      if (this.input.left) {
        currentVx = Math.min(currentVx, -5.8);
      } else if (this.input.right) {
        currentVx = Math.max(currentVx, 5.8);
      }

      // Impart clean, uniform impulse to chassis and both wheels
      Body.setVelocity(this.robotChassis, { x: currentVx, y: jumpVelY });
      Body.setVelocity(this.robotWheelLeft, { x: currentVx, y: jumpVelY });
      Body.setVelocity(this.robotWheelRight, { x: currentVx, y: jumpVelY });

      // Synchronize held cargo so heavy crates do not drag down the jump arc
      if (this.heldCrate) {
        Body.setVelocity(this.heldCrate.body, {
          x: currentVx,
          y: Math.min(this.heldCrate.body.velocity.y, jumpVelY * 0.95),
        });
      }

      sounds.playJump();
      this.addDustParticles(this.robotChassis.position.x, this.robotChassis.position.y + 24, 8);
    }
  }

  public toggleMagnet(forceState?: boolean) {
    const newState = forceState !== undefined ? forceState : !this.isMagnetActive;
    this.isMagnetActive = newState;

    if (this.isMagnetActive) {
      // Try to attach nearest crate
      this.tryGrabCrate();
      sounds.playMagnet(true);
    } else {
      // Release currently held crate
      this.releaseCrate();
      sounds.playMagnet(false);
    }
  }

  private tryGrabCrate() {
    if (this.heldCrate) return;

    let closestDist = 95; // pickup range
    let bestCrate: { body: Matter.Body; crateDef: CrateDef } | null = null;

    this.crateBodies.forEach((entry) => {
      const dist = Vector.magnitude(Vector.sub(entry.body.position, this.craneTipPos));
      if (dist < closestDist) {
        closestDist = dist;
        bestCrate = { body: entry.body, crateDef: entry.def };
      }
    });

    if (bestCrate) {
      const { body, crateDef } = bestCrate;

      // Soften crate velocity on grab to avoid jarring snap
      Body.setVelocity(body, {
        x: body.velocity.x * 0.15,
        y: body.velocity.y * 0.15,
      });
      Body.setAngularVelocity(body, 0);

      // Temporarily set collisionFilter to avoid collisions with robot chassis & wheels
      body.collisionFilter.group = -1;

      // Position target at the grabber head along arm angle
      const gripOffset = 16;
      const targetX = this.craneTipPos.x + Math.cos(this.armAngle) * gripOffset;
      const targetY = this.craneTipPos.y + Math.sin(this.armAngle) * gripOffset;

      // Attach with world-anchored spring constraint (no bodyA, so robot chassis never gets pulled or glitched)
      const constraint = Constraint.create({
        pointA: { x: targetX, y: targetY },
        bodyB: body,
        stiffness: 0.75,
        damping: 0.3,
        length: 0,
      });

      World.add(this.world, constraint);
      this.heldCrate = { body, crateDef, constraint };

      // Spark particles
      this.addSparks(this.craneTipPos.x, this.craneTipPos.y, 8);
    }
  }

  private releaseCrate() {
    if (!this.heldCrate) return;

    // Restore standard collision group
    this.heldCrate.body.collisionFilter.group = 0;

    // Inherit crane tip momentum for throwing!
    const throwSpeed = Math.sqrt(this.craneTipVel.x * this.craneTipVel.x + this.craneTipVel.y * this.craneTipVel.y);
    const clampedThrowSpeed = Math.min(14, throwSpeed * 1.15);
    const throwAngle = Math.atan2(this.craneTipVel.y, this.craneTipVel.x);

    let addVx = 0;
    let addVy = 0;
    if (throwSpeed > 0.4) {
      addVx = Math.cos(throwAngle) * clampedThrowSpeed;
      addVy = Math.sin(throwAngle) * clampedThrowSpeed;
    }

    Body.setVelocity(this.heldCrate.body, {
      x: this.heldCrate.body.velocity.x * 0.4 + addVx,
      y: this.heldCrate.body.velocity.y * 0.4 + addVy,
    });

    World.remove(this.world, this.heldCrate.constraint);
    this.heldCrate = null;
  }

  public detonateTNT(tntBody: Matter.Body) {
    const entry = this.crateBodies.get(tntBody.id);
    if (!entry) return;

    const blastPos = { ...tntBody.position };
    const blastRadius = 180;

    // If held, release
    if (this.heldCrate && this.heldCrate.body === tntBody) {
      this.releaseCrate();
    }

    // Remove TNT crate
    World.remove(this.world, tntBody);
    this.crateBodies.delete(tntBody.id);

    sounds.playExplosion();
    this.camera.shake = 18;

    // Particle blast
    this.addExplosionParticles(blastPos.x, blastPos.y);

    // Blast force on all nearby dynamic bodies
    this.crateBodies.forEach((c) => {
      const diff = Vector.sub(c.body.position, blastPos);
      const dist = Vector.magnitude(diff);
      if (dist < blastRadius && dist > 1) {
        const forceMag = ((blastRadius - dist) / blastRadius) * 0.25;
        const norm = Vector.normalise(diff);
        Body.applyForce(c.body, c.body.position, Vector.mult(norm, forceMag));
      }
    });

    // Blast force on robot
    const robotDiff = Vector.sub(this.robotChassis.position, blastPos);
    const robotDist = Vector.magnitude(robotDiff);
    if (robotDist < blastRadius) {
      const f = ((blastRadius - robotDist) / blastRadius) * 0.28;
      Body.applyForce(this.robotChassis, this.robotChassis.position, Vector.mult(Vector.normalise(robotDiff), f));
    }

    // Shatter any destructible walls in range
    this.destructibleWalls.forEach((dw, id) => {
      const dist = Vector.magnitude(Vector.sub(dw.body.position, blastPos));
      if (dist < blastRadius + 40) {
        this.shatterWall(id, dw);
      }
    });
  }

  private shatterWall(id: string, dw: { body: Matter.Body; def: DestructibleWallDef }) {
    World.remove(this.world, dw.body);
    this.destructibleWalls.delete(id);

    // Spawn tumbling rubble debris
    const pos = dw.body.position;
    for (let i = 0; i < 6; i++) {
      const rubble = Bodies.rectangle(
        pos.x + (Math.random() - 0.5) * dw.def.width,
        pos.y + (Math.random() - 0.5) * dw.def.height,
        14,
        14,
        {
          density: 0.002,
          friction: 0.9,
          restitution: 0.1,
          render: { fillStyle: '#78716c' },
        }
      );
      Body.setVelocity(rubble, {
        x: (Math.random() - 0.5) * 8,
        y: -Math.random() * 6 - 2,
      });
      World.add(this.world, rubble);

      // Clean up rubble after 4 seconds
      setTimeout(() => {
        try {
          World.remove(this.world, rubble);
        } catch {
          // ignore
        }
      }, 4000);
    }

    this.addDebrisParticles(pos.x, pos.y, 16, '#78716c');
  }

  public update(deltaMs: number) {
    if (!this.isRunning) return;
    const deltaSec = Math.min(deltaMs / 1000, 0.05);
    this.levelTimeSec += deltaSec;

    // Check if grounded status has expired (e.g. falling off a ledge)
    if (Date.now() - this.lastGroundedTime > 120) {
      this.isGrounded = false;
    }

    // Step physics
    Engine.update(this.engine, deltaMs);

    // Drive Robot
    this.updateRobotMovement();

    // Crane Arm Kinematics & Magnet Aim
    this.updateCraneArm();

    // Update Puzzle Elements (Switches, Doors, Elevators, Conveyors)
    this.updatePuzzleElements();

    // Check Stars
    this.updateStars();

    // Check Truck Cargo Loading
    this.updateTruckCargo();

    // Update Particles
    this.updateParticles(deltaSec);

    // Update Camera
    this.updateCamera();

    // Boundary safety: if robot falls off the world, reset it back safely
    if (this.robotChassis.position.y > 880 || this.robotChassis.position.y < -400) {
      this.resetRobotPosition();
    }
  }

  private updateRobotMovement() {
    const moveForce = 0.016;
    const maxSpeed = 7.0;

    if (this.input.left) {
      this.robotFacing = -1;
      if (this.robotChassis.velocity.x > -maxSpeed) {
        Body.applyForce(this.robotChassis, this.robotChassis.position, { x: -moveForce, y: 0 });
      }
      this.robotWheelLeft.torque = -0.06;
      this.robotWheelRight.torque = -0.06;

      // Roll wheels smoothly without causing ground friction kickback
      if (this.isGrounded) {
        const targetOmega = -maxSpeed / 16;
        Body.setAngularVelocity(this.robotWheelLeft, this.robotWheelLeft.angularVelocity * 0.8 + targetOmega * 0.2);
        Body.setAngularVelocity(this.robotWheelRight, this.robotWheelRight.angularVelocity * 0.8 + targetOmega * 0.2);
      } else {
        // Airborne steering: ensure responsive horizontal leap distance
        if (this.robotChassis.velocity.x > -maxSpeed) {
          Body.applyForce(this.robotChassis, this.robotChassis.position, { x: -0.024, y: 0 });
        }
      }

      if (!this.hasManualAim) {
        const targetAimX = -85;
        this.aimOffset.x += (targetAimX - this.aimOffset.x) * 0.12;
      }
      if (Math.random() < 0.25) {
        this.addDustParticles(this.robotWheelRight.position.x, this.robotWheelRight.position.y + 14, 1);
      }
    } else if (this.input.right) {
      this.robotFacing = 1;
      if (this.robotChassis.velocity.x < maxSpeed) {
        Body.applyForce(this.robotChassis, this.robotChassis.position, { x: moveForce, y: 0 });
      }
      this.robotWheelLeft.torque = 0.06;
      this.robotWheelRight.torque = 0.06;

      if (this.isGrounded) {
        const targetOmega = maxSpeed / 16;
        Body.setAngularVelocity(this.robotWheelLeft, this.robotWheelLeft.angularVelocity * 0.8 + targetOmega * 0.2);
        Body.setAngularVelocity(this.robotWheelRight, this.robotWheelRight.angularVelocity * 0.8 + targetOmega * 0.2);
      } else {
        // Airborne steering: ensure responsive horizontal leap distance
        if (this.robotChassis.velocity.x < maxSpeed) {
          Body.applyForce(this.robotChassis, this.robotChassis.position, { x: 0.024, y: 0 });
        }
      }

      if (!this.hasManualAim) {
        const targetAimX = 85;
        this.aimOffset.x += (targetAimX - this.aimOffset.x) * 0.12;
      }
      if (Math.random() < 0.25) {
        this.addDustParticles(this.robotWheelLeft.position.x, this.robotWheelLeft.position.y + 14, 1);
      }
    } else {
      // Gentle braking when no movement keys are pressed
      if (this.isGrounded) {
        Body.setVelocity(this.robotChassis, {
          x: this.robotChassis.velocity.x * 0.88,
          y: this.robotChassis.velocity.y,
        });
        Body.setAngularVelocity(this.robotWheelLeft, this.robotWheelLeft.angularVelocity * 0.85);
        Body.setAngularVelocity(this.robotWheelRight, this.robotWheelRight.angularVelocity * 0.85);
      }
    }

    // Cap tilt angle so robot never flips onto its back
    const maxTilt = 0.4;
    if (this.robotChassis.angle > maxTilt) {
      Body.setAngle(this.robotChassis, maxTilt);
      Body.setAngularVelocity(this.robotChassis, 0);
    } else if (this.robotChassis.angle < -maxTilt) {
      Body.setAngle(this.robotChassis, -maxTilt);
      Body.setAngularVelocity(this.robotChassis, 0);
    }

    // Upright stabilization torque with derivative damping
    const uprightTorque = -this.robotChassis.angle * 1.5 - this.robotChassis.angularVelocity * 0.4;
    this.robotChassis.torque = uprightTorque;
    Body.setAngularVelocity(this.robotChassis, this.robotChassis.angularVelocity * 0.92);

    // Exhaust smoke from forklift pipe
    if (Math.random() < 0.2) {
      const pipeX = this.robotChassis.position.x - this.robotFacing * 22;
      const pipeY = this.robotChassis.position.y - 20;
      this.particles.push({
        x: pipeX,
        y: pipeY,
        vx: -this.robotFacing * 0.5 + (Math.random() - 0.5) * 0.4,
        vy: -1.2 - Math.random() * 0.8,
        life: 0,
        maxLife: 0.6,
        size: 4 + Math.random() * 4,
        color: '#94a3b8',
        type: 'smoke',
      });
    }
  }

  private updateCraneArm() {
    // Shoulder pivot centered on chassis to avoid 12px jump glitches on direction change
    const pivotX = this.robotChassis.position.x;
    const pivotY = this.robotChassis.position.y - 12;

    // Anchor mousePos dynamically to the robot's current shoulder pivot position
    this.mousePos.x = pivotX + this.aimOffset.x;
    this.mousePos.y = pivotY + this.aimOffset.y;

    // Calculate angle towards aim target relative to current robot position
    const dx = this.aimOffset.x;
    const dy = this.aimOffset.y;
    const targetAngle = Math.atan2(dy, dx);

    // Smooth angle tracking
    let angleDiff = targetAngle - this.armAngle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.armAngle += angleDiff * 0.24;

    // Calculate target reach extension
    const targetDist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.max(45, Math.min(135, targetDist));
    this.armExtension += (clampedDist - this.armExtension) * 0.25;

    // Compute previous tip pos to calculate throw velocity
    const prevTipX = this.craneTipPos.x;
    const prevTipY = this.craneTipPos.y;

    this.craneTipPos.x = pivotX + Math.cos(this.armAngle) * this.armExtension;
    this.craneTipPos.y = pivotY + Math.sin(this.armAngle) * this.armExtension;

    // Clamp tip velocity to prevent physics spikes
    const rawTipVx = this.craneTipPos.x - prevTipX;
    const rawTipVy = this.craneTipPos.y - prevTipY;
    const tipSpeed = Math.hypot(rawTipVx, rawTipVy);
    const maxTipVel = 12;
    if (tipSpeed > maxTipVel) {
      this.craneTipVel.x = (rawTipVx / tipSpeed) * maxTipVel * 0.8;
      this.craneTipVel.y = (rawTipVy / tipSpeed) * maxTipVel * 0.8;
    } else {
      this.craneTipVel.x = rawTipVx * 0.8;
      this.craneTipVel.y = rawTipVy * 0.8;
    }

    // If held crate, update constraint target point in world coordinates
    if (this.heldCrate) {
      const gripOffset = 16;
      const targetX = this.craneTipPos.x + Math.cos(this.armAngle) * gripOffset;
      const targetY = this.craneTipPos.y + Math.sin(this.armAngle) * gripOffset;

      this.heldCrate.constraint.pointA = {
        x: targetX,
        y: targetY,
      };

      // Stabilize held crate rotation so it stays level and doesn't spin uncontrollably
      const currentAngle = this.heldCrate.body.angle;
      let angleDelta = Math.atan2(Math.sin(-currentAngle), Math.cos(-currentAngle));
      Body.setAngularVelocity(this.heldCrate.body, this.heldCrate.body.angularVelocity * 0.7 + angleDelta * 0.05);

      // Clamp max velocity of held crate to prevent physics instability
      const vel = this.heldCrate.body.velocity;
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      if (speed > 16) {
        const scale = 16 / speed;
        Body.setVelocity(this.heldCrate.body, { x: vel.x * scale, y: vel.y * scale });
      }

      // Safety disconnect: if crate is blocked by terrain and stretches too far, release grip cleanly
      const distToTip = Vector.magnitude(Vector.sub(this.heldCrate.body.position, this.craneTipPos));
      if (distToTip > 140) {
        this.releaseCrate();
      } else {
        // Spark particles occasionally while holding
        if (Math.random() < 0.12) {
          this.addSparks(this.craneTipPos.x, this.craneTipPos.y, 1);
        }
      }
    } else if (this.isMagnetActive) {
      // Auto-attract any crate that enters range while magnet is on
      this.tryGrabCrate();
      if (Math.random() < 0.3) {
        this.addSparks(this.craneTipPos.x, this.craneTipPos.y, 2);
      }
    }
  }

  private updatePuzzleElements() {
    // 1. Switches
    this.switches.forEach((sw) => {
      let isPressed = false;
      const swBounds = sw.body.bounds;

      // Check if robot chassis or wheels are over switch
      const robotBodies = [this.robotChassis, this.robotWheelLeft, this.robotWheelRight];
      for (const rb of robotBodies) {
        if (Matter.Bounds.overlaps(rb.bounds, swBounds)) {
          isPressed = true;
          break;
        }
      }

      // Check if any crate is resting on switch
      if (!isPressed) {
        this.crateBodies.forEach((c) => {
          if (Matter.Bounds.overlaps(c.body.bounds, swBounds)) {
            isPressed = true;
          }
        });
      }

      if (isPressed !== sw.pressed) {
        sw.pressed = isPressed;
        sounds.playSwitch();
      }
    });

    // 2. Doors
    this.doors.forEach((door, id) => {
      // Find matching switch
      let triggered = false;
      this.switches.forEach((sw) => {
        if (sw.targetId === id && sw.pressed) {
          triggered = true;
        }
      });

      const targetPos = triggered ? door.targetY : door.startY;
      const currentPos = door.body.position.y;
      const diff = targetPos - currentPos;

      if (Math.abs(diff) > 1) {
        const step = Math.sign(diff) * Math.min(3, Math.abs(diff));
        Body.setPosition(door.body, { x: door.body.position.x, y: currentPos + step });
      }
    });

    // 3. Elevators
    this.elevators.forEach((elev, id) => {
      // Check if linked to a switch, or free-running
      let active = false;
      this.switches.forEach((sw) => {
        if (sw.targetId === id && sw.pressed) {
          active = true;
        }
      });

      const targetY = active ? elev.targetY : elev.startY;
      const currentY = elev.body.position.y;
      const diff = targetY - currentY;

      if (Math.abs(diff) > 1) {
        const step = Math.sign(diff) * Math.min(elev.speed, Math.abs(diff));
        Body.setPosition(elev.body, { x: elev.body.position.x, y: currentY + step });
      }
    });

    // 4. Conveyors
    this.conveyors.forEach((cv) => {
      const bounds = cv.body.bounds;
      const pushSpeed = cv.speed * cv.direction;

      // Convey crates
      this.crateBodies.forEach((c) => {
        if (Matter.Bounds.overlaps(c.body.bounds, bounds)) {
          Body.setVelocity(c.body, { x: pushSpeed, y: c.body.velocity.y });
        }
      });

      // Convey robot
      if (Matter.Bounds.overlaps(this.robotChassis.bounds, bounds) ||
          Matter.Bounds.overlaps(this.robotWheelLeft.bounds, bounds) ||
          Matter.Bounds.overlaps(this.robotWheelRight.bounds, bounds)) {
        Body.setVelocity(this.robotChassis, { x: this.robotChassis.velocity.x + pushSpeed * 0.1, y: this.robotChassis.velocity.y });
      }
    });
  }

  private updateStars() {
    this.stars.forEach((s) => {
      if (s.collected) return;
      const dist = Vector.magnitude(Vector.sub({ x: s.x, y: s.y }, this.robotChassis.position));
      if (dist < 42) {
        s.collected = true;
        this.collectedStarsCount++;
        sounds.playStar();
        this.addStarParticles(s.x, s.y);
        this.callbacks.onStarCollected(this.collectedStarsCount, this.stars.length);
      }
    });
  }

  private updateTruckCargo() {
    if (this.truckCompleted) {
      this.truckDriveOffX += 4;
      return;
    }

    const t = this.level.truck;
    let allFilled = true;
    let filledCount = 0;

    this.truckSlots.forEach((slot) => {
      const slotWorldX = t.x + slot.xOffset;
      const slotWorldY = t.y + slot.yOffset;
      let slotOccupied = false;

      this.crateBodies.forEach((entry) => {
        // Skip crate currently held by magnet
        if (this.heldCrate && this.heldCrate.body === entry.body) return;

        // Verify type match
        if (slot.requiredType && entry.def.type !== slot.requiredType) return;

        // Check if resting inside slot with low velocity
        const dx = Math.abs(entry.body.position.x - slotWorldX);
        const dy = Math.abs(entry.body.position.y - slotWorldY);
        const speed = Vector.magnitude(entry.body.velocity);

        if (dx < 26 && dy < 26 && speed < 1.2) {
          slotOccupied = true;
        }
      });

      slot.isFilled = slotOccupied;
      if (slotOccupied) filledCount++;
      else allFilled = false;
    });

    this.callbacks.onSlotFilled(filledCount, this.truckSlots.length);

    if (allFilled && this.truckSlots.length > 0) {
      this.truckCompleteTimer += 1;
      if (this.truckCompleteTimer > 45) { // stable for ~0.75s
        this.truckCompleted = true;
        sounds.playTruckHorn();
        sounds.playVictoryFanfare();

        // Calculate stars earned
        let starsEarned = 1; // 1 star for clearing level
        const allStarsFound = this.collectedStarsCount === this.stars.length;
        if (allStarsFound) starsEarned++;
        if (this.levelTimeSec <= this.level.starTimeTargetSec) starsEarned++;

        this.callbacks.onLevelComplete(this.levelTimeSec, starsEarned, allStarsFound);
      }
    } else {
      this.truckCompleteTimer = 0;
    }
  }

  private updateParticles(deltaSec: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += deltaSec;
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'smoke') {
        p.size += 0.15;
        p.vy -= 0.02;
      } else if (p.type === 'spark' || p.type === 'debris') {
        p.vy += 0.2; // gravity
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateCamera() {
    this.camera.targetX = this.robotChassis.position.x + this.robotFacing * 40;
    this.camera.targetY = this.robotChassis.position.y - 40;

    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.08;

    if (this.camera.shake > 0) {
      this.camera.x += (Math.random() - 0.5) * this.camera.shake;
      this.camera.y += (Math.random() - 0.5) * this.camera.shake;
      this.camera.shake *= 0.88;
      if (this.camera.shake < 0.5) this.camera.shake = 0;
    }
  }

  // Particle helper factories
  public addDustParticles(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.2,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        size: 3 + Math.random() * 3,
        color: '#cbd5e1',
        type: 'dust',
      });
    }
  }

  public addSparks(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.4 ? '#38bdf8' : '#67e8f9',
        type: 'spark',
      });
    }
  }

  public addDebrisParticles(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        size: 3 + Math.random() * 4,
        color,
        type: 'debris',
      });
    }
  }

  public addExplosionParticles(x: number, y: number) {
    // Fire & Smoke
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 6 + Math.random() * 10,
        color: Math.random() > 0.5 ? '#ef4444' : Math.random() > 0.5 ? '#f97316' : '#eab308',
        type: 'fire',
      });
    }
    // Sparks
    this.addSparks(x, y, 20);
  }

  public addStarParticles(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 3 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.6,
        size: 3 + Math.random() * 3,
        color: '#facc15',
        type: 'star',
      });
    }
  }

  public start() {
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    const loop = (now: number) => {
      if (!this.isRunning) return;
      const delta = now - this.lastTimestamp;
      this.lastTimestamp = now;
      this.update(delta);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
