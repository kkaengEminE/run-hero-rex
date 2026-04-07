// Pixel art sprite definitions using canvas drawing functions

// Hero pixel art (16x16 logical grid → scaled up)
export function drawHero(ctx, x, y, scale = 3, frame = 0, equipment = {}) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);

  // Determine colors based on equipment
  const armorColor = getArmorColor(equipment.armor);
  const weaponColor = getWeaponColor(equipment.weapon);
  const helmetColor = getHelmetColor(equipment.helmet);

  // Body pixels (16x16 grid)
  const pixels = getHeroPixels(armorColor, helmetColor, frame);

  pixels.forEach(([px, py, color]) => {
    ctx.fillStyle = color;
    ctx.fillRect(px * s, py * s, s, s);
  });

  // Weapon on right side
  drawWeaponSprite(ctx, equipment.weapon, frame, s, weaponColor);

  ctx.restore();
}

function getArmorColor(armorId) {
  const colors = {
    none: '#CC4444',
    cloth: '#CC4444',
    leather: '#8B4513',
    chain_mail: '#778899',
    plate_armor: '#C0C0C0',
    dragon_armor: '#2d6b2d',
  };
  return colors[armorId] || '#CC4444';
}

function getHelmetColor(helmetId) {
  const colors = {
    none: '#FFB347',
    leather_hat: '#8B6914',
    iron_helm: '#888888',
    magic_crown: '#FFD700',
    dragon_helm: '#8B0000',
  };
  return colors[helmetId] || '#FFB347';
}

function getWeaponColor(weaponId) {
  const colors = {
    none: '#C0C0C0',
    dagger: '#E8E8E8',
    sword: '#C0C0C0',
    great_sword: '#888888',
    magic_staff: '#9400D3',
    dragon_sword: '#FF4500',
  };
  return colors[weaponId] || '#C0C0C0';
}

function getHeroPixels(armorColor, helmetColor, frame) {
  // Running animation: frame 0 or 1
  const legOffset = frame % 2;
  const skinColor = '#FFCC88';
  const hairColor = '#2C1810';
  const bandanaColor = '#CC0000';
  const beltColor = '#4A3728';
  const bootColor = '#3D2B1F';
  const shadowColor = 'rgba(0,0,0,0.3)';

  const base = [
    // Shadow
    [2, 14, shadowColor], [3, 14, shadowColor], [4, 14, shadowColor],
    [5, 14, shadowColor], [6, 14, shadowColor],

    // Hair/Head (rows 0-3)
    [2, 0, hairColor], [3, 0, hairColor], [4, 0, hairColor], [5, 0, hairColor],
    [1, 1, hairColor], [2, 1, skinColor], [3, 1, skinColor], [4, 1, skinColor], [5, 1, hairColor],
    [1, 2, skinColor], [2, 2, skinColor], [3, 2, skinColor], [4, 2, skinColor], [5, 2, skinColor],
    [2, 3, skinColor], [3, 3, skinColor], [4, 3, skinColor], [5, 3, skinColor],

    // Bandana
    [1, 1, bandanaColor], [2, 1, bandanaColor], [3, 1, bandanaColor],
    [4, 1, bandanaColor], [5, 1, bandanaColor], [6, 1, bandanaColor],
    // Bandana tail
    [6, 1, bandanaColor], [7, 2, bandanaColor],

    // Eyes
    [2, 2, '#2C1810'], [4, 2, '#2C1810'],

    // Torso (rows 4-8)
    [1, 4, armorColor], [2, 4, armorColor], [3, 4, armorColor], [4, 4, armorColor], [5, 4, armorColor],
    [1, 5, armorColor], [2, 5, armorColor], [3, 5, armorColor], [4, 5, armorColor], [5, 5, armorColor],
    [1, 6, armorColor], [2, 6, armorColor], [3, 6, armorColor], [4, 6, armorColor], [5, 6, armorColor],
    [1, 7, beltColor], [2, 7, beltColor], [3, 7, '#DAA520'], [4, 7, beltColor], [5, 7, beltColor],

    // Arms
    [0, 4, skinColor], [0, 5, skinColor], [0, 6, skinColor],
    [6, 4, skinColor], [6, 5, skinColor], [6, 6, skinColor],

    // Hands
    [0, 7, skinColor], [6, 7, skinColor],

    // Legs (rows 8-13) with running animation
    [1, 8, armorColor], [2, 8, armorColor], [3, 8, armorColor], [4, 8, armorColor], [5, 8, armorColor],
  ];

  // Legs animation
  if (legOffset === 0) {
    base.push(
      [1, 9, '#CC0000'], [2, 9, '#CC0000'],
      [4, 9, '#CC0000'], [5, 9, '#CC0000'],
      [1, 10, '#CC0000'], [2, 10, '#CC0000'],
      [4, 10, '#CC0000'], [5, 10, '#CC0000'],
      [1, 11, '#CC0000'], [2, 11, '#CC0000'],
      [5, 11, '#CC0000'],
      [1, 12, bootColor], [2, 12, bootColor],
      [5, 12, bootColor], [6, 12, bootColor],
      [1, 13, bootColor], [2, 13, bootColor], [3, 13, bootColor],
      [5, 13, bootColor], [6, 13, bootColor],
    );
  } else {
    base.push(
      [1, 9, '#CC0000'], [2, 9, '#CC0000'],
      [3, 9, '#CC0000'], [4, 9, '#CC0000'],
      [0, 10, '#CC0000'], [1, 10, '#CC0000'],
      [3, 10, '#CC0000'], [4, 10, '#CC0000'],
      [0, 11, '#CC0000'],
      [3, 11, '#CC0000'], [4, 11, '#CC0000'],
      [0, 12, bootColor], [1, 12, bootColor],
      [3, 12, bootColor], [4, 12, bootColor],
      [0, 13, bootColor], [1, 13, bootColor],
      [3, 13, bootColor], [4, 13, bootColor], [5, 13, bootColor],
    );
  }

  return base;
}

function drawWeaponSprite(ctx, weaponId, frame, s) {
  if (!weaponId || weaponId === 'none') return;

  const bobY = frame % 2 === 0 ? 0 : 1;

  switch (weaponId) {
    case 'dagger':
      ctx.fillStyle = '#E8E8E8';
      ctx.fillRect(7 * s, (4 + bobY) * s, s, 4 * s);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(6 * s, (7 + bobY) * s, 2 * s, s);
      break;
    case 'sword':
    default:
      // Blade
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(7 * s, (3 + bobY) * s, s, s);
      ctx.fillRect(7 * s, (4 + bobY) * s, s, s);
      ctx.fillRect(8 * s, (5 + bobY) * s, s, s);
      ctx.fillRect(8 * s, (6 + bobY) * s, s, s);
      // Guard
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(7 * s, (7 + bobY) * s, 3 * s, s);
      // Handle
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(8 * s, (8 + bobY) * s, s, 2 * s);
      break;
    case 'great_sword':
      ctx.fillStyle = '#888888';
      ctx.fillRect(7 * s, (2 + bobY) * s, 2 * s, 6 * s);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(6 * s, (7 + bobY) * s, 4 * s, s);
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(7 * s, (8 + bobY) * s, 2 * s, 2 * s);
      break;
    case 'magic_staff':
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(7 * s, (3 + bobY) * s, s, 8 * s);
      ctx.fillStyle = '#9400D3';
      ctx.fillRect(6 * s, (1 + bobY) * s, 3 * s, 3 * s);
      ctx.fillStyle = '#DA70D6';
      ctx.fillRect(7 * s, (2 + bobY) * s, s, s);
      break;
    case 'dragon_sword':
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(7 * s, (2 + bobY) * s, s, s);
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(7 * s, (3 + bobY) * s, 2 * s, 5 * s);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(6 * s, (7 + bobY) * s, 4 * s, s);
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(7 * s, (8 + bobY) * s, 2 * s, 2 * s);
      break;
  }
}

// Dinosaur sprite drawing
export function drawDinosaur(ctx, dinoId, x, y, scale = 3, frame = 0, isEnemy = false) {
  ctx.save();
  if (isEnemy) {
    ctx.translate(x + getDinoWidth(dinoId) * scale, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }

  switch (dinoId) {
    case 'trex': drawTrex(ctx, scale, frame); break;
    case 'triceratops': drawTriceratops(ctx, scale, frame); break;
    case 'brachiosaurus': drawBrachiosaurus(ctx, scale, frame); break;
    case 'pachycephalosaurus': drawPachycephalosaurus(ctx, scale, frame); break;
    case 'pteranodon': drawPteranodon(ctx, scale, frame); break;
    case 'velociraptor': drawVelociraptor(ctx, scale, frame); break;
    default: drawTrex(ctx, scale, frame);
  }

  ctx.restore();
}

function getDinoWidth(dinoId) {
  const widths = { trex: 20, triceratops: 22, brachiosaurus: 16, pachycephalosaurus: 18, pteranodon: 24, velociraptor: 16 };
  return widths[dinoId] || 20;
}

function fillPixels(ctx, pixels, s) {
  pixels.forEach(([px, py, color]) => {
    ctx.fillStyle = color;
    ctx.fillRect(px * s, py * s, s, s);
  });
}

function drawTrex(ctx, s, frame) {
  const g = '#2d5a1b';
  const lg = '#3d7a2b';
  const dk = '#1a3510';
  const eye = '#FF0000';
  const t = '#c8a876';
  const legOffset = frame % 2;

  const pixels = [
    // Tail
    [0, 8, g], [1, 7, g], [1, 8, g],
    // Body
    [2, 5, g], [3, 5, g], [4, 5, lg],
    [2, 6, g], [3, 6, lg], [4, 6, lg], [5, 6, g],
    [2, 7, g], [3, 7, lg], [4, 7, g], [5, 7, g],
    [2, 8, g], [3, 8, g], [4, 8, g], [5, 8, g],
    // Belly
    [3, 6, t], [3, 7, t], [3, 8, t],
    // Short arms
    [5, 6, g], [6, 7, g],
    // Neck
    [6, 4, g], [7, 3, g],
    // Head
    [7, 2, g], [8, 2, g], [9, 2, g], [10, 2, g],
    [7, 3, g], [8, 3, lg], [9, 3, lg], [10, 3, g],
    [7, 4, g], [8, 4, g], [9, 4, g],
    // Eye
    [9, 3, eye],
    // Jaw
    [8, 4, t], [9, 4, t], [10, 4, g], [11, 4, g],
    [10, 5, dk], [11, 5, dk], // teeth shadow
    // Legs
    ...(legOffset === 0 ? [
      [3, 9, g], [4, 9, g],
      [3, 10, g], [5, 10, g],
      [3, 11, dk], [5, 11, dk],
    ] : [
      [2, 9, g], [4, 9, g],
      [2, 10, g], [5, 10, g],
      [2, 11, dk], [5, 11, dk],
    ]),
  ];
  fillPixels(ctx, pixels, s);
}

function drawTriceratops(ctx, s, frame) {
  const br = '#5a3d1b';
  const dbr = '#3a2510';
  const lg = '#7a5d3b';
  const eye = '#FFD700';
  const horn = '#DAA520';
  const legOffset = frame % 2;

  const pixels = [
    // Body
    [2, 5, br], [3, 5, br], [4, 5, lg], [5, 5, lg], [6, 5, br],
    [2, 6, br], [3, 6, lg], [4, 6, lg], [5, 6, lg], [6, 6, br], [7, 6, br],
    [2, 7, br], [3, 7, br], [4, 7, br], [5, 7, br], [6, 7, br],
    // Frill
    [8, 3, br], [9, 3, '#FF6633'], [10, 3, '#FF6633'],
    [8, 4, br], [9, 4, '#FF6633'], [10, 4, '#FF6633'],
    [8, 5, br], [9, 5, '#FF6633'],
    // Head
    [8, 5, br], [9, 5, br], [10, 5, br], [11, 5, br],
    [9, 6, lg], [10, 6, lg], [11, 6, br],
    [9, 7, br], [10, 7, br],
    // Eye
    [10, 6, eye],
    // Horns
    [10, 4, horn], [11, 4, horn], [12, 3, horn],
    [9, 5, horn],
    // Legs
    ...(legOffset === 0 ? [
      [3, 8, br], [4, 8, br], [5, 8, br], [6, 8, br],
      [3, 9, dbr], [5, 9, dbr],
      [3, 10, dbr], [5, 10, dbr],
    ] : [
      [3, 8, br], [4, 8, br], [5, 8, br], [6, 8, br],
      [2, 9, dbr], [5, 9, dbr],
      [2, 10, dbr], [6, 10, dbr],
    ]),
    // Tail
    [0, 7, br], [1, 6, br], [1, 7, br],
  ];
  fillPixels(ctx, pixels, s);
}

function drawBrachiosaurus(ctx, s, frame) {
  const g = '#6b8e23';
  const lg = '#8fbd35';
  const dk = '#4a6218';
  const eye = '#FFD700';
  const legOffset = frame % 2;

  const pixels = [
    // Very long neck going up
    [6, 0, g], [6, 1, g], [6, 2, g], [6, 3, g],
    [6, 4, lg], [7, 4, g],
    // Head (high up)
    [6, 0, g], [7, 0, g],
    [7, 1, lg], [8, 1, g],
    [7, 2, g], [8, 2, g],
    [8, 3, eye],
    // Body
    [2, 8, g], [3, 8, g], [4, 8, lg], [5, 8, lg], [6, 8, g],
    [2, 9, g], [3, 9, lg], [4, 9, lg], [5, 9, lg], [6, 9, g],
    [2, 10, g], [3, 10, g], [4, 10, g], [5, 10, g],
    // Neck to body
    [5, 5, g], [5, 6, g], [5, 7, g], [6, 7, g],
    // Tail
    [0, 10, g], [1, 9, g], [1, 10, g],
    // Legs
    ...(legOffset === 0 ? [
      [3, 11, g], [4, 11, g], [5, 11, g],
      [3, 12, dk], [5, 12, dk],
    ] : [
      [2, 11, g], [4, 11, g], [6, 11, g],
      [2, 12, dk], [6, 12, dk],
    ]),
  ];
  fillPixels(ctx, pixels, s);
}

function drawPachycephalosaurus(ctx, s, frame) {
  const g = '#556b2f';
  const lg = '#7a9e45';
  const dome = '#8B7355';
  const eye = '#FF4500';
  const legOffset = frame % 2;

  const pixels = [
    // Dome head (thick skull)
    [6, 1, dome], [7, 1, dome], [8, 1, dome],
    [5, 2, dome], [6, 2, dome], [7, 2, dome], [8, 2, dome], [9, 2, dome],
    [6, 3, g], [7, 3, lg], [8, 3, g],
    [7, 4, eye],
    [6, 4, g], [8, 4, g], [9, 4, g],
    // Neck
    [6, 5, g], [7, 5, g],
    // Body
    [3, 6, g], [4, 6, g], [5, 6, lg], [6, 6, lg], [7, 6, g],
    [3, 7, g], [4, 7, lg], [5, 7, lg], [6, 7, g],
    [3, 8, g], [4, 8, g], [5, 8, g],
    // Tail
    [0, 8, g], [1, 7, g], [1, 8, g], [2, 8, g],
    // Legs
    ...(legOffset === 0 ? [
      [3, 9, g], [5, 9, g],
      [3, 10, g], [5, 10, g],
    ] : [
      [2, 9, g], [4, 9, g],
      [2, 10, g], [5, 10, g],
    ]),
  ];
  fillPixels(ctx, pixels, s);
}

function drawPteranodon(ctx, s, frame) {
  const bl = '#4a4a8a';
  const lbl = '#6a6aaa';
  const eye = '#FF0000';
  const wingOffset = frame % 2;

  const pixels = [
    // Wings (animated flap)
    ...(wingOffset === 0 ? [
      [0, 3, bl], [1, 2, bl], [2, 2, lbl], [3, 2, lbl], [4, 2, bl],
      [10, 2, bl], [11, 2, lbl], [12, 2, lbl], [13, 2, bl], [14, 3, bl],
      [4, 3, lbl], [5, 3, lbl], [9, 3, lbl], [10, 3, lbl],
    ] : [
      [0, 5, bl], [1, 4, bl], [2, 3, lbl], [3, 3, lbl], [4, 3, bl],
      [10, 3, bl], [11, 3, lbl], [12, 3, lbl], [13, 4, bl], [14, 5, bl],
      [4, 4, lbl], [5, 4, lbl], [9, 4, lbl], [10, 4, lbl],
    ]),
    // Body
    [5, 4, bl], [6, 4, lbl], [7, 4, lbl], [8, 4, bl], [9, 4, bl],
    [6, 5, lbl], [7, 5, lbl],
    // Head + crest
    [8, 2, bl], [9, 2, bl], [10, 2, bl],
    [11, 1, bl], [12, 1, bl],
    [8, 3, lbl], [9, 3, lbl], [10, 3, bl],
    // Eye
    [9, 3, eye],
    // Beak
    [10, 4, bl], [11, 4, bl], [12, 4, bl], [13, 4, bl],
    // Feet
    [6, 6, bl], [7, 6, bl],
  ];
  fillPixels(ctx, pixels, s);
}

function drawVelociraptor(ctx, s, frame) {
  const br = '#8b4513';
  const dbr = '#5a2d0c';
  const str = '#c8a876';
  const eye = '#FF4500';
  const claw = '#F5F5DC';
  const legOffset = frame % 2;

  const pixels = [
    // Tail (horizontal)
    [0, 7, br], [1, 7, br], [1, 6, br],
    // Body
    [2, 5, br], [3, 5, str], [4, 5, str], [5, 5, br],
    [2, 6, br], [3, 6, str], [4, 6, str], [5, 6, br],
    [2, 7, br], [3, 7, br],
    // Arms
    [5, 5, br], [6, 6, br], [7, 7, claw],
    // Neck
    [5, 4, br], [6, 3, br],
    // Head
    [6, 2, br], [7, 2, br], [8, 2, br],
    [7, 3, str], [8, 3, str], [9, 3, br],
    [8, 4, br], [9, 4, br], [10, 4, br], [11, 4, dbr],
    // Eye
    [8, 3, eye],
    // Legs (sickle claw!)
    ...(legOffset === 0 ? [
      [3, 8, br], [4, 8, br],
      [3, 9, dbr], [5, 9, dbr],
      [3, 10, claw], [5, 10, claw],
    ] : [
      [2, 8, br], [4, 8, br],
      [2, 9, dbr], [4, 9, dbr],
      [2, 10, claw], [5, 10, claw],
    ]),
  ];
  fillPixels(ctx, pixels, s);
}

// Pixel shop building
export function drawShop(ctx, x, y, width, height) {
  ctx.save();
  ctx.translate(x, y);

  // Building body
  ctx.fillStyle = '#D2691E';
  ctx.fillRect(0, height * 0.3, width, height * 0.7);

  // Roof
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.moveTo(-5, height * 0.3);
  ctx.lineTo(width / 2, 0);
  ctx.lineTo(width + 5, height * 0.3);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = '#4a2800';
  ctx.fillRect(width * 0.35, height * 0.6, width * 0.3, height * 0.4);

  // Window
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(width * 0.1, height * 0.4, width * 0.25, height * 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(width * 0.1, height * 0.4, width * 0.12, height * 0.09);

  // Sign
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(width * 0.15, height * 0.1, width * 0.7, height * 0.18);
  ctx.fillStyle = '#8B0000';
  ctx.font = `bold ${height * 0.13}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('SHOP', width / 2, height * 0.22);

  // Pixel border
  ctx.strokeStyle = '#5a3010';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, height * 0.3, width, height * 0.7);

  ctx.restore();
}

// Pixel cloud
export function drawCloud(ctx, x, y, w) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const h = w * 0.4;
  ctx.fillRect(w * 0.2, h * 0.4, w * 0.6, h * 0.6);
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.fillRect(w * 0.1, h * 0.2, w * 0.4, h * 0.4);
  ctx.fillRect(w * 0.4, 0, w * 0.35, h * 0.5);
  ctx.restore();
}

// Pixel tree
export function drawTree(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  // Trunk
  ctx.fillStyle = '#5C3A1E';
  ctx.fillRect(18, 40, 14, 30);
  // Canopy layers (pixel style)
  ctx.fillStyle = '#1a6b1a';
  ctx.fillRect(0, 20, 50, 25);
  ctx.fillStyle = '#228B22';
  ctx.fillRect(5, 8, 40, 20);
  ctx.fillStyle = '#2ecc2e';
  ctx.fillRect(12, 0, 26, 15);
  // Pixel highlights
  ctx.fillStyle = '#5aff5a';
  ctx.fillRect(14, 2, 5, 4);
  ctx.fillRect(7, 12, 6, 4);
  ctx.restore();
}

// Ground tiles
export function drawGroundTile(ctx, x, y, w, h) {
  // Grass top
  ctx.fillStyle = '#3cb371';
  ctx.fillRect(x, y, w, h * 0.25);
  // Dirt
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x, y + h * 0.25, w, h * 0.75);
  // Pixel detail
  ctx.fillStyle = '#5C3A1E';
  for (let i = 0; i < w; i += 16) {
    ctx.fillRect(x + i, y + h * 0.4, 8, 4);
  }
  // Grass tuft detail
  ctx.fillStyle = '#5aff5a';
  for (let i = 0; i < w; i += 20) {
    ctx.fillRect(x + i, y, 4, 4);
  }
}
