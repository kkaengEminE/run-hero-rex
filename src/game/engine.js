import { DINOSAURS, OBSTACLE_TYPES } from '../data/gameData.js';

export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 400,
  GROUND_Y: 300,
  HERO_X: 120,
  HERO_WIDTH: 48,
  HERO_HEIGHT: 56,
  GRAVITY: 0.6,
  INITIAL_SPEED: 5,
  MAX_SPEED: 14,
  SPEED_INCREMENT: 0.0015,
  JUMP_FORCE: -14,
  ULTRA_GAUGE_PER_DISTANCE: 200, // distance per gauge fill
};

export function createObstacle(gameSpeed, cameraX) {
  const types = Object.keys(OBSTACLE_TYPES);
  const typeKey = types[Math.floor(Math.random() * types.length)];
  const type = OBSTACLE_TYPES[typeKey];
  const isPteranodon = typeKey === 'pteranodon';

  return {
    id: `obs_${Date.now()}_${Math.random()}`,
    type: 'obstacle',
    obstacleType: typeKey,
    x: cameraX + GAME_CONFIG.CANVAS_WIDTH + 50,
    y: GAME_CONFIG.GROUND_Y - type.height,
    width: type.width,
    height: type.height,
    ...type,
  };
}

export function createDinosaur(cameraX) {
  const dinoKeys = Object.keys(DINOSAURS);
  const dinoKey = dinoKeys[Math.floor(Math.random() * dinoKeys.length)];
  const dino = DINOSAURS[dinoKey];

  const isFlying = dino.isFlying;
  const groundY = GAME_CONFIG.GROUND_Y;

  // Flying dinos appear at mid-height, ground dinos at ground level
  const y = isFlying
    ? groundY - 120 - Math.random() * 60
    : groundY - (dino.height || 70);

  return {
    id: `dino_${Date.now()}_${Math.random()}`,
    type: 'dinosaur',
    dinoKey,
    x: cameraX + GAME_CONFIG.CANVAS_WIDTH + 50,
    y,
    width: dino.width || 70,
    height: dino.height || 70,
    dinoData: { ...dino },
    currentHp: dino.hp,
    maxHp: dino.hp,
  };
}

export function createShop(cameraX) {
  return {
    id: `shop_${Date.now()}`,
    type: 'shop',
    x: cameraX + GAME_CONFIG.CANVAS_WIDTH + 50,
    y: GAME_CONFIG.GROUND_Y - 90,
    width: 80,
    height: 90,
  };
}

export function createCloud(cameraX, canvasWidth) {
  return {
    id: `cloud_${Date.now()}_${Math.random()}`,
    x: cameraX + canvasWidth + Math.random() * 200,
    y: 20 + Math.random() * 80,
    w: 60 + Math.random() * 80,
    speed: 0.5 + Math.random() * 1,
  };
}

// Check AABB collision
export function checkCollision(a, b) {
  const margin = 8; // Forgiveness margin
  return (
    a.x + margin < b.x + b.width - margin &&
    a.x + a.width - margin > b.x + margin &&
    a.y + margin < b.y + b.height - margin &&
    a.y + a.height - margin > b.y + margin
  );
}

export function getHeroHitbox(heroX, heroY) {
  return {
    x: heroX,
    y: heroY,
    width: GAME_CONFIG.HERO_WIDTH,
    height: GAME_CONFIG.HERO_HEIGHT,
  };
}

// Spawn schedule based on distance
export function shouldSpawnEntity(distance, lastSpawnDistance, gameSpeed) {
  const minGap = 300 + gameSpeed * 20;
  const randomExtra = Math.random() * 300;
  return distance - lastSpawnDistance > minGap + randomExtra;
}

// Determine spawn type weights
export function getSpawnType(distance) {
  const shopChance = 0.08;
  const dinoChance = 0.35;

  const roll = Math.random();
  if (roll < shopChance) return 'shop';
  if (roll < shopChance + dinoChance) return 'dinosaur';
  return 'obstacle';
}

// Background parallax layers
export function createParallaxLayers() {
  return {
    sky: { offset: 0, speed: 0.1 },
    mountains: { offset: 0, speed: 0.3 },
    trees: { offset: 0, speed: 0.6 },
  };
}

export function updateParallax(layers, speed) {
  return {
    sky: { ...layers.sky, offset: (layers.sky.offset + speed * 0.1) % 900 },
    mountains: { ...layers.mountains, offset: (layers.mountains.offset + speed * 0.3) % 900 },
    trees: { ...layers.trees, offset: (layers.trees.offset + speed * 0.6) % 900 },
  };
}
