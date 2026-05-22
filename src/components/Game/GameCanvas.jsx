import { useEffect, useRef, useCallback } from 'react';
import {
  GAME_CONFIG,
  createObstacle, createDinosaur, createShop,
  checkCollision, getHeroHitbox, shouldSpawnEntity, getSpawnType,
} from '../../game/engine.js';
import {
  drawHero, drawDinosaur, drawShop, drawCloud, drawTree, drawGroundTile,
} from '../../game/sprites.js';

export default function GameCanvas({
  isRunning, runId, player, onCollideObstacle, onCollideDino, onCollideShop,
  onDistanceUpdate, onUltraGainedFrame,
}) {
  const canvasRef = useRef(null);

  // Persistent world state — never wiped between renders, only reset on new game
  const worldRef = useRef({
    heroY: GAME_CONFIG.GROUND_Y - GAME_CONFIG.HERO_HEIGHT,
    heroVY: 0,
    jumpCount: 0,
    gameSpeed: GAME_CONFIG.INITIAL_SPEED,
    distance: 0,
    cameraX: 0,
    entities: [],
    animFrame: 0,
    frameCount: 0,
    lastSpawnDistance: 0,
    initialized: false,
  });

  // Static environment (never changes)
  const envRef = useRef({
    clouds: [],
    bgTrees: [],
  });

  const rafRef = useRef(null);
  const playerRef = useRef(player);
  const isRunningRef = useRef(isRunning);
  const callbacksRef = useRef({});

  // Keep refs fresh without recreating gameLoop
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => {
    callbacksRef.current = {
      onCollideObstacle, onCollideDino, onCollideShop,
      onDistanceUpdate, onUltraGainedFrame,
    };
  });

  // Generate static environment once
  useEffect(() => {
    const env = envRef.current;
    if (env.clouds.length === 0) {
      env.clouds = Array.from({ length: 6 }, (_, i) => ({
        x: i * 160 + Math.random() * 80,
        y: 15 + Math.random() * 80,
        w: 60 + Math.random() * 90,
      }));
      env.bgTrees = Array.from({ length: 10 }, (_, i) => ({
        x: i * 140 + Math.random() * 70,
        parallax: 0.35 + Math.random() * 0.25,
      }));
    }
  }, []);

  // ─── Jump input ───────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (!isRunningRef.current) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        tryJump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTap = () => { if (isRunningRef.current) tryJump(); };
    canvas.addEventListener('touchstart', onTap, { passive: true });
    canvas.addEventListener('click', onTap);
    return () => {
      canvas.removeEventListener('touchstart', onTap);
      canvas.removeEventListener('click', onTap);
    };
  }, []);

  const tryJump = () => {
    const w = worldRef.current;
    const jumpMul = (playerRef.current?.stats?.jumpMultiplier) || 1;
    if (w.jumpCount < 2) {
      w.heroVY = GAME_CONFIG.JUMP_FORCE * jumpMul;
      w.jumpCount++;
    }
  };

  // ─── Reset world only on a brand-new game (runId change) ───
  useEffect(() => {
    const w = worldRef.current;
    w.heroY = GAME_CONFIG.GROUND_Y - GAME_CONFIG.HERO_HEIGHT;
    w.heroVY = 0;
    w.jumpCount = 0;
    w.gameSpeed = GAME_CONFIG.INITIAL_SPEED;
    w.distance = 0;
    w.cameraX = 0;
    w.entities = [];
    w.animFrame = 0;
    w.frameCount = 0;
    w.lastSpawnDistance = 0;
  }, [runId]);

  // ─── Resume after a battle/shop: hero ready pose, clear nearby entities ─
  // Triggered any time we go from not-running to running (after the runId reset).
  useEffect(() => {
    if (!isRunning) return;
    const w = worldRef.current;
    // Reset hero physics so they land on the ground in ready pose
    w.heroY = GAME_CONFIG.GROUND_Y - GAME_CONFIG.HERO_HEIGHT;
    w.heroVY = 0;
    w.jumpCount = 0;
    // Drop ahead-of-camera entities so the hero doesn't immediately collide.
    // Anything within ~one screen ahead is cleared; far-ahead spawns survive.
    const safeAheadX = w.cameraX + GAME_CONFIG.CANVAS_WIDTH + 80;
    w.entities = w.entities.filter(e => e.x > safeAheadX);
    // Re-arm spawn cadence so the next entity isn't generated instantly
    w.lastSpawnDistance = w.distance;
  }, [isRunning]);

  // ─── Draw helpers ─────────────────────────────────────────
  const drawBg = (ctx, camX) => {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } = GAME_CONFIG;
    const env = envRef.current;

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#1a90d0');
    sky.addColorStop(1, '#7ecfea');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    // Clouds (very slow parallax)
    env.clouds.forEach(c => {
      const sx = ((c.x - camX * 0.12 % (CANVAS_WIDTH + 200)) + (CANVAS_WIDTH + 200) * 10) % (CANVAS_WIDTH + 200) - 100;
      drawCloud(ctx, sx, c.y, c.w);
    });

    // BG trees (medium parallax, semi-transparent)
    env.bgTrees.forEach(t => {
      const wrap = CANVAS_WIDTH + 300;
      const sx = ((t.x - camX * t.parallax) % wrap + wrap * 10) % wrap - 60;
      ctx.globalAlpha = 0.45;
      drawTree(ctx, sx, GROUND_Y - 70);
      ctx.globalAlpha = 1;
    });

    // Ground
    drawGroundTile(ctx, 0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  };

  const drawEntities = (ctx, camX) => {
    const w = worldRef.current;
    w.entities.forEach(e => {
      const sx = e.x - camX;
      if (sx < -200 || sx > GAME_CONFIG.CANVAS_WIDTH + 200) return;

      if (e.type === 'obstacle') {
        ctx.font = `${e.height * 0.95}px serif`;
        ctx.textBaseline = 'bottom';
        ctx.fillText(e.emoji, sx, e.y + e.height);
      } else if (e.type === 'dinosaur') {
        drawDinosaur(ctx, e.dinoKey, sx, e.y, 3, w.animFrame);
      } else if (e.type === 'shop') {
        drawShop(ctx, sx, e.y, e.width, e.height);
      }
    });
  };

  const drawInGameHUD = (ctx, w) => {
    const p = playerRef.current;
    const CW = GAME_CONFIG.CANVAS_WIDTH;

    // Distance badge
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, 8, 8, 160, 28);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(w.distance)}m`, 16, 22);
    ctx.restore();

    // ULTRA gauge (KOF style) — top right
    const gx = CW - 210;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, gx - 4, 8, 206, 30);
    ctx.fill();

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#FF6600';
    ctx.textBaseline = 'middle';
    ctx.fillText('ULTRA', gx + 2, 23);

    const maxU = p.maxUltraGauge || 5;
    const curU = p.ultraGauge || 0;
    for (let i = 0; i < maxU; i++) {
      const bx = gx + 48 + i * 29;
      const filled = i < curU;
      ctx.fillStyle = filled ? '#FF4500' : '#2a2a2a';
      ctx.fillRect(bx, 13, 25, 14);
      if (filled) {
        ctx.fillStyle = '#FF8800';
        ctx.fillRect(bx + 2, 15, 10, 6);
        ctx.fillStyle = 'rgba(255,255,100,0.4)';
        ctx.fillRect(bx, 13, 25, 5);
      }
      ctx.strokeStyle = filled ? '#FF6600' : '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, 13, 25, 14);
    }
    ctx.restore();

    // Mini HP bar bottom-left
    const hpRatio = Math.max(0, (p.hp || 0) / (p.maxHp || 100));
    const hpColor = hpRatio > 0.5 ? '#00ee44' : hpRatio > 0.25 ? '#FFD700' : '#FF4444';
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, 8, GAME_CONFIG.CANVAS_HEIGHT - 30, 160, 22);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillRect(10, GAME_CONFIG.CANVAS_HEIGHT - 26, 156, 12);
    ctx.fillStyle = hpColor;
    ctx.fillRect(10, GAME_CONFIG.CANVAS_HEIGHT - 26, Math.floor(156 * hpRatio), 12);
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP ${Math.floor(p.hp || 0)}/${p.maxHp || 100}`, 14, GAME_CONFIG.CANVAS_HEIGHT - 20);
    ctx.restore();
  };

  // ─── Main game loop ────────────────────────────────────────
  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = worldRef.current;
    const p = playerRef.current;
    const cb = callbacksRef.current;
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, HERO_HEIGHT, HERO_X } = GAME_CONFIG;

    if (!isRunningRef.current) {
      // Static idle frame
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBg(ctx, w.cameraX);
      drawHero(ctx, HERO_X, GROUND_Y - HERO_HEIGHT, 3, 0, p.equipment || {});
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    // ── Speed & distance ──
    const speedMul = p?.stats?.speedMultiplier || 1;
    w.gameSpeed = Math.min(
      GAME_CONFIG.MAX_SPEED,
      (GAME_CONFIG.INITIAL_SPEED + w.distance * GAME_CONFIG.SPEED_INCREMENT) * speedMul,
    );
    w.distance += w.gameSpeed * 0.1;
    w.cameraX += w.gameSpeed;
    w.frameCount++;
    if (w.frameCount % 9 === 0) w.animFrame = (w.animFrame + 1) % 2;

    // Ultra gauge accumulation
    const newUltra = Math.min(p.maxUltraGauge || 5, Math.floor(w.distance / GAME_CONFIG.ULTRA_GAUGE_PER_DISTANCE));
    if (newUltra > (p.ultraGauge || 0)) cb.onUltraGainedFrame(newUltra);

    // ── Physics ──
    w.heroVY += GAME_CONFIG.GRAVITY;
    w.heroY += w.heroVY;
    const floorY = GROUND_Y - HERO_HEIGHT;
    if (w.heroY >= floorY) {
      w.heroY = floorY;
      w.heroVY = 0;
      w.jumpCount = 0;
    }

    // ── Spawn entities ──
    if (shouldSpawnEntity(w.distance, w.lastSpawnDistance, w.gameSpeed)) {
      const kind = getSpawnType(w.distance);
      let ent;
      if (kind === 'shop') ent = createShop(w.cameraX);
      else if (kind === 'dinosaur') ent = createDinosaur(w.cameraX);
      else ent = createObstacle(w.gameSpeed, w.cameraX);
      w.entities.push(ent);
      w.lastSpawnDistance = w.distance;
    }
    w.entities = w.entities.filter(e => e.x > w.cameraX - 200);

    // ── Collision ──
    const hbox = getHeroHitbox(HERO_X + w.cameraX, w.heroY);
    for (const ent of [...w.entities]) {
      if (!checkCollision(hbox, ent)) continue;
      if (ent.type === 'obstacle') {
        cb.onCollideObstacle();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (ent.type === 'dinosaur') {
        w.entities = w.entities.filter(e => e.id !== ent.id);
        cb.onCollideDino(ent);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (ent.type === 'shop') {
        w.entities = w.entities.filter(e => e.id !== ent.id);
        cb.onCollideShop();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
    }

    cb.onDistanceUpdate(w.distance);

    // ── Render ──
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBg(ctx, w.cameraX);
    drawEntities(ctx, w.cameraX);
    drawHero(ctx, HERO_X, w.heroY, 3, w.animFrame, p.equipment || {});
    drawInGameHUD(ctx, w);

    rafRef.current = requestAnimationFrame(loop);
  }, []); // stable — reads everything via refs

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_CONFIG.CANVAS_WIDTH}
      height={GAME_CONFIG.CANVAS_HEIGHT}
      style={{ display: 'block', imageRendering: 'pixelated', cursor: 'pointer', width: '100%', height: '100%', objectFit: 'fill' }}
    />
  );
}

// Helper: rounded rect path
function roundRect(ctx, x, y, w, h, r = 4) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
