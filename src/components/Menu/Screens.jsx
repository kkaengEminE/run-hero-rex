import { useEffect, useRef, useState } from 'react';
import { DINOSAURS } from '../../data/gameData.js';

/* ── Title Screen ─────────────────────────────────────────── */
export function TitleScreen({ onStart }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const frame = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const tick = () => {
      frame.current++;
      const t = frame.current;
      ctx.clearRect(0, 0, 900, 400);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, 400);
      sky.addColorStop(0, '#0d1f3a');
      sky.addColorStop(0.6, '#1a3a6b');
      sky.addColorStop(1, '#2a5a2a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 900, 400);

      // Stars twinkle
      for (let i = 0; i < 60; i++) {
        const x = (i * 179 + 53) % 900;
        const y = (i * 67 + 13) % 220;
        const bright = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.04 + i));
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
      }

      // Moon
      ctx.fillStyle = 'rgba(255,255,220,0.9)';
      ctx.beginPath();
      ctx.arc(820, 60, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a2a4a';
      ctx.beginPath();
      ctx.arc(833, 55, 26, 0, Math.PI * 2);
      ctx.fill();

      // Rolling hills
      ctx.fillStyle = '#1a3a1a';
      ctx.beginPath();
      ctx.moveTo(0, 300);
      for (let x = 0; x <= 900; x += 5) {
        const y = 300 - 40 * Math.sin((x + t * 0.5) * 0.01) - 20 * Math.sin((x + t * 0.3) * 0.02);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(900, 400); ctx.lineTo(0, 400); ctx.closePath();
      ctx.fill();

      // Ground
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, 340, 900, 60);
      ctx.fillStyle = '#3a7a30';
      ctx.fillRect(0, 340, 900, 8);

      // Scrolling dino parade on ground
      const dinoEmojis = ['🦖', '🦕', '🐊', '🦎', '🦅', '🦕'];
      dinoEmojis.forEach((e, i) => {
        const x = (((-t * 1.8) + i * 160 + 1600) % 1600) - 60;
        ctx.font = '32px serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(e, x, 358);
      });

      // Hero walking
      const hx = 380 + Math.sin(t * 0.03) * 10;
      ctx.font = '52px serif';
      ctx.fillText('🧙', hx, 360);

      // Title glow
      const pulse = Math.sin(t * 0.06) * 4;
      ctx.save();
      ctx.shadowColor = '#FF4500';
      ctx.shadowBlur = 25 + pulse;
      ctx.fillStyle = '#FF3300';
      ctx.font = 'bold 44px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RUN HERO REX', 450, 120);
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 42px "Press Start 2P", monospace';
      ctx.fillText('RUN HERO REX', 450, 118);
      ctx.restore();

      // Subtitle
      ctx.fillStyle = '#88bbff';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('달리고  싸우고  살아남아라!', 450, 154);

      // Controls box
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(260, 170, 380, 60);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.strokeRect(260, 170, 380, 60);
      ctx.fillStyle = '#aaa';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText('SPACE / ↑ : 점프 (2단 점프 가능)', 450, 190);
      ctx.fillText('공룡 충돌 = 전투   상점 충돌 = 쇼핑', 450, 208);
      ctx.fillText('장애물 충돌 = 게임 오버', 450, 224);

      // Blinking start
      if (Math.floor(t / 28) % 2 === 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText('▶  SPACE 또는 클릭하여 시작  ◀', 450, 270);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={900} height={400}
      style={{ display: 'block', imageRendering: 'pixelated', cursor: 'pointer', width: '100vw', height: '100vh', objectFit: 'fill' }}
      onClick={onStart}
    />
  );
}

/* ── Countdown Overlay ────────────────────────────────────── */
export function CountdownOverlay({ count }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)', zIndex: 50, pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: count === 0 ? 'clamp(48px, 9vmin, 160px)' : 'clamp(64px, 13vmin, 220px)',
        color: count > 1 ? '#FFD700' : '#00ff44',
        textShadow: '0 0 40px currentColor',
        animation: 'cntDown 0.35s ease-out',
      }}>
        {count === 0 ? 'GO!' : count}
      </div>
      <style>{`@keyframes cntDown{from{transform:scale(1.8);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

/* ── Level-Up Toast ───────────────────────────────────────── */
export function LevelUpToast({ level, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', top: 'var(--gap-lg)', left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg,#1a3a00,#3a6a00)',
      border: 'var(--bd) solid #FFD700', padding: 'var(--gap-md) var(--gap-lg)',
      fontFamily: '"Press Start 2P", monospace', zIndex: 300,
      boxShadow: '0 0 30px rgba(255,215,0,0.5)',
      animation: 'lvlUp 0.4s ease-out',
      whiteSpace: 'nowrap',
    }}>
      <div style={{ color: '#FFD700', fontSize: 'var(--fs-lg)' }}>✨ LEVEL UP!</div>
      <div style={{ color: '#aaffaa', fontSize: 'var(--fs-sm)', marginTop: 'var(--gap-sm)' }}>Lv.{level} 달성!</div>
      <style>{`@keyframes lvlUp{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}`}</style>
    </div>
  );
}

/* ── Game Over Screen ─────────────────────────────────────── */
export function GameOverScreen({ distance, defeatedDinosaurs, onRestart }) {
  const total = Object.values(defeatedDinosaurs).reduce((a, b) => a + b, 0);
  const ranking = getRank(distance);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#100000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, fontFamily: '"Press Start 2P", monospace',
    }}>
      <div style={{
        width: '100%', maxWidth: 'min(900px, 92vw)',
        padding: 'var(--gap-lg)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 'var(--fs-xxl)', marginBottom: 'var(--gap-sm)' }}>💀</div>
        <div style={{ color: '#FF4444', fontSize: 'var(--fs-xl)', marginBottom: 'var(--gap-sm)' }}>GAME OVER</div>
        <div style={{ color: ranking.color, fontSize: 'var(--fs-md)', marginBottom: 'var(--gap-lg)' }}>{ranking.label}</div>

        <div style={{ background: '#0a0000', border: 'var(--bd) solid #2a0000', padding: 'var(--gap-lg)', marginBottom: 'var(--gap-lg)' }}>
          <Row label="달린 거리" value={`${Math.floor(distance)}m`} color="#FFD700" />
          <Row label="처치한 공룡" value={`${total}마리`} color="#FF6600" />
          {total > 0 && (
            <div style={{ borderTop: 'var(--bd) solid #2a0000', marginTop: 'var(--gap-md)', paddingTop: 'var(--gap-md)' }}>
              {Object.entries(defeatedDinosaurs).map(([k, cnt]) =>
                cnt > 0 ? (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 'var(--fs-sm)', color: '#888', marginBottom: 'var(--gap-xs)', padding: '0 var(--gap-md)',
                  }}>
                    <span>{DINOSAURS[k]?.emoji} {DINOSAURS[k]?.name}</span>
                    <span style={{ color: '#bbb' }}>{cnt}마리</span>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        <button onClick={onRestart} style={{
          background: '#3a0000', color: '#FF4444', border: 'var(--bd) solid #FF4444',
          padding: 'var(--gap-md) var(--gap-lg)', fontSize: 'var(--fs-lg)', cursor: 'pointer', fontFamily: 'inherit',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#5a0000'}
          onMouseLeave={e => e.currentTarget.style.background = '#3a0000'}
        >
          다시 시작
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-md)', padding: 'var(--gap-sm) var(--gap-md)' }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}

function getRank(dist) {
  if (dist >= 2000) return { label: '★★★ 전설의 용사', color: '#FFD700' };
  if (dist >= 1000) return { label: '★★ 베테랑 모험가', color: '#C0C0C0' };
  if (dist >= 500) return { label: '★ 용감한 전사', color: '#CD7F32' };
  if (dist >= 200) return { label: '초보 모험가', color: '#aaa' };
  return { label: '도전자', color: '#666' };
}
