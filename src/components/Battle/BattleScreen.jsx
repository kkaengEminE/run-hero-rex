import { useState, useEffect, useRef, useCallback } from 'react';
import { DINOSAURS, SHOP_ITEMS, calculatePlayerStats } from '../../data/gameData.js';
import {
  calculateDamage, calculateEnemyAttack, useItem, checkBattleEnd,
  getExpFromDino, getGoldFromDino, ATTACK_TYPES,
} from '../../game/battle.js';
import { drawHero, drawDinosaur } from '../../game/sprites.js';

/* ── tiny canvas showing both fighters ── */
function FightCanvas({ equipment, dinoKey, pAnim, dAnim, shakePlayer, shakeDino }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 600, 220);

    // Backdrop
    const g = ctx.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, '#0d1a30'); g.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 220);

    // Checkerboard floor strip
    for (let i = 0; i < 38; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1a3320' : '#162b1a';
      ctx.fillRect(i * 16, 188, 16, 32);
    }

    // Platform shadows
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(50, 186, 130, 6);
    ctx.fillRect(390, 148, 170, 6);

    // Player platform
    ctx.fillStyle = '#2d6b27'; ctx.fillRect(55, 182, 120, 8);
    ctx.fillStyle = '#4a8a42'; ctx.fillRect(55, 182, 120, 3);

    // Enemy platform
    ctx.fillStyle = '#2d6b27'; ctx.fillRect(395, 146, 160, 8);
    ctx.fillStyle = '#4a8a42'; ctx.fillRect(395, 146, 160, 3);

    // Hero (with shake offset)
    const px = 65 + (shakePlayer ? (Math.random() * 8 - 4) : 0);
    drawHero(ctx, px, 122, 4, pAnim % 2, equipment);

    // Enemy dino
    const dx = 400 + (shakeDino ? (Math.random() * 10 - 5) : 0);
    drawDinosaur(ctx, dinoKey, dx, 82, 4, dAnim % 2, true);
  });

  return (
    <canvas ref={ref} width={600} height={220}
      style={{ display: 'block', imageRendering: 'pixelated', width: '100%', height: '100%', objectFit: 'fill' }} />
  );
}

/* ── stat bar ── */
function Bar({ label, val, max, color }) {
  const r = Math.max(0, Math.min(1, val / max));
  return (
    <div style={{ marginBottom: 'var(--gap-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: '#aaa', marginBottom: 'var(--gap-xs)' }}>
        <span>{label}</span><span>{Math.floor(val)}/{max}</span>
      </div>
      <div style={{ background: '#1a1a1a', height: 'var(--bar-h-sm)', border: 'var(--bd) solid #333' }}>
        <div style={{ background: color, height: '100%', width: `${r * 100}%`, transition: 'width 0.25s' }} />
      </div>
    </div>
  );
}

/* ── floating damage number ── */
function FloatNum({ nums }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {nums.map(n => (
        <div key={n.id} style={{
          position: 'absolute', left: `${n.x}%`, top: `${n.y}%`,
          color: n.color, fontFamily: '"Press Start 2P", monospace',
          fontSize: n.big ? 'var(--fs-xl)' : 'var(--fs-lg)',
          textShadow: '1px 1px 0 #000',
          animation: 'floatUp 1s ease-out forwards',
          pointerEvents: 'none',
        }}>{n.text}</div>
      ))}
    </div>
  );
}

export default function BattleScreen({ player, enemy, onBattleEnd }) {
  const dino = DINOSAURS[enemy.dinoKey];
  const pStats = calculatePlayerStats(player);

  const [bs, setBs] = useState({
    php: player.hp, pmp: player.mp,
    ehp: dino.hp,
    ePoisoned: null,
    turn: 'player', // player | enemy | animating
    phase: 'select', // select | attack_sub | item_sub | status
    result: null,    // null | won | lost
    log: [`⚔️ ${dino.name}이(가) 나타났다!`],
    defending: false,
    pAnim: 0, dAnim: 0,
    shakeP: false, shakeD: false,
    floats: [],
  });

  const bsRef = useRef(bs);
  useEffect(() => { bsRef.current = bs; }, [bs]);

  // Anim tick
  const rafRef = useRef(null);
  const frame = useRef(0);
  useEffect(() => {
    const tick = () => {
      frame.current++;
      if (frame.current % 10 === 0)
        setBs(p => ({ ...p, pAnim: p.pAnim + 1, dAnim: p.dAnim + 1 }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const addLog = useCallback((msg, prev) => {
    const l = [...prev, msg];
    return l.length > 6 ? l.slice(-6) : l;
  }, []);

  const spawnFloat = useCallback((text, x, y, color, big = false) => {
    const id = Date.now() + Math.random();
    setBs(p => ({ ...p, floats: [...p.floats, { id, text, x, y, color, big }] }));
    setTimeout(() => setBs(p => ({ ...p, floats: p.floats.filter(f => f.id !== id) })), 1100);
  }, []);

  /* ── enemy turn ── */
  const doEnemyTurn = useCallback(() => {
    setTimeout(() => {
      setBs(prev => {
        // Battle already ended — bail out, no enemy action.
        if (prev.result || prev.ehp <= 0 || prev.php <= 0) return prev;

        let s = { ...prev };

        // Poison tick
        if (s.ePoisoned) {
          const dmg = s.ePoisoned.damage;
          s.ehp = Math.max(0, s.ehp - dmg);
          s.log = addLog(`☠️ 독! ${dmg} 대미지`, s.log);
          spawnFloat(`-${dmg}`, 70, 27, '#00cc00');
          s.ePoisoned = { ...s.ePoisoned, duration: s.ePoisoned.duration - 1 };
          if (s.ePoisoned.duration <= 0) s.ePoisoned = null;
          if (s.ehp <= 0) {
            return { ...s, turn: 'done', result: 'won', log: addLog('🏆 승리!', s.log) };
          }
        }

        const atkResult = calculateEnemyAttack(
          { attack: dino.attack, attacks: dino.attacks },
          pStats.defense + (s.tempDefense || 0),
          s.defending,
        );
        const newPhp = Math.max(0, s.php - atkResult.damage);
        const logMsg = s.defending
          ? `🛡️ ${dino.name}: ${atkResult.attackName}! 방어! ${atkResult.damage > 0 ? atkResult.damage + ' 피해' : '완전 방어'}`
          : `👹 ${atkResult.attackName}! ${atkResult.damage} 대미지!`;

        if (atkResult.damage > 0) {
          spawnFloat(`-${atkResult.damage}`, 13, 41, s.defending ? '#FFD700' : '#FF4444', !s.defending);
        }

        const lost = newPhp <= 0;
        let nextLog = addLog(logMsg, s.log);
        if (lost) nextLog = addLog('💀 패배...', nextLog);
        return {
          ...s,
          php: newPhp,
          shakeP: atkResult.damage > 0,
          defending: false,
          turn: lost ? 'done' : 'player',
          phase: 'select',
          result: lost ? 'lost' : null,
          log: nextLog,
        };
      });
      setTimeout(() => setBs(p => ({ ...p, shakeP: false })), 300);
    }, 900);
  }, [dino, pStats, addLog, spawnFloat]);

  /* ── player actions ── */
  const act = useCallback((fn) => {
    setBs(prev => {
      if (prev.turn !== 'player' || prev.result) return prev;
      const { newState, log, floatArgs } = fn(prev);
      const raw = checkBattleEnd(newState.php, newState.ehp);
      const result = raw === 'win' ? 'won' : raw === 'lose' ? 'lost' : null;
      const finalState = {
        ...prev, ...newState,
        turn: result ? 'done' : 'enemy',
        result,
        log: addLog(log, prev.log),
        phase: 'select',
      };
      if (!result) doEnemyTurn();
      if (result === 'won') finalState.log = addLog('🏆 승리!', finalState.log);
      if (result === 'lost') finalState.log = addLog('💀 패배...', finalState.log);
      if (floatArgs) setTimeout(() => spawnFloat(...floatArgs), 80);
      return finalState;
    });
    setTimeout(() => setBs(p => ({ ...p, shakeD: false, shakeP: false })), 400);
  }, [doEnemyTurn, addLog, spawnFloat]);

  const normalAttack = () => act(prev => {
    const r = calculateDamage({ attack: pStats.attack, mp: prev.pmp }, { defense: dino.defense }, ATTACK_TYPES.NORMAL, pStats.weaponData);
    return {
      newState: { ehp: Math.max(0, prev.ehp - r.damage), shakeD: true },
      log: r.isCritical ? `✨ 치명타!! ${r.damage} 대미지!` : `⚔️ 일반 공격! ${r.damage} 대미지`,
      floatArgs: [`${r.isCritical ? '💥' : ''}−${r.damage}`, 71, 23, r.isCritical ? '#FFD700' : '#ff8800', r.isCritical],
    };
  });

  const magicAttack = () => {
    if (bs.pmp < 20) { setBs(p => ({ ...p, log: addLog('💧 MP 부족!', p.log) })); return; }
    act(prev => {
      const r = calculateDamage({ attack: pStats.attack, mp: prev.pmp }, { defense: Math.floor(dino.defense * 0.5) }, ATTACK_TYPES.MAGIC, pStats.weaponData);
      return {
        newState: { ehp: Math.max(0, prev.ehp - r.damage), pmp: prev.pmp - 20, shakeD: true },
        log: `✨ 마법 공격! ${r.damage} 대미지 (MP-20)`,
        floatArgs: [`✨−${r.damage}`, 71, 23, '#88aaff', true],
      };
    });
  };

  const ultraAttack = () => {
    if (!(player.ultraGauge > 0)) { setBs(p => ({ ...p, log: addLog('🔥 필살기 게이지 없음!', p.log) })); return; }
    onBattleEnd('ultra_used', {});
    act(prev => {
      const r = calculateDamage({ attack: pStats.attack, mp: prev.pmp }, { defense: 0 }, ATTACK_TYPES.ULTRA, pStats.weaponData);
      return {
        newState: { ehp: Math.max(0, prev.ehp - r.damage), shakeD: true },
        log: `🔥💥 필살기!! ${r.damage} 강력한 대미지!!!`,
        floatArgs: [`🔥−${r.damage}`, 68, 18, '#FF4500', true],
      };
    });
  };

  const defend = () => act(() => ({
    newState: { defending: true },
    log: '🛡️ 방어 자세를 취했다!',
    floatArgs: null,
  }));

  const useItemAct = (itemId) => {
    onBattleEnd('use_item', { itemId });
    act(prev => {
      const r = useItem(itemId,
        { ...player, hp: prev.php, mp: prev.pmp, inventory: player.inventory },
        { currentHp: prev.ehp, defense: dino.defense }
      );
      return {
        newState: { php: r.player.hp, pmp: r.player.mp, ehp: r.enemy.currentHp, ePoisoned: r.enemy.poisoned || prev.ePoisoned },
        log: `🎒 ${r.message}`,
        floatArgs: null,
      };
    });
  };

  const handleEnd = () => {
    const exp = getExpFromDino(enemy.dinoKey);
    const gold = getGoldFromDino(enemy.dinoKey);
    onBattleEnd(bs.result, { hp: bs.php, mp: bs.pmp, exp: bs.result === 'won' ? exp : 0, gold: bs.result === 'won' ? gold : 0, dinoKey: enemy.dinoKey });
  };

  const items = (player.inventory || []).filter(inv => {
    const d = SHOP_ITEMS.find(i => i.id === inv.id);
    return d && inv.quantity > 0;
  });

  const hpR = bs.php / (player.maxHp || 100);
  const eHpR = bs.ehp / dino.hp;
  const isMyTurn = bs.turn === 'player' && !bs.result;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#08080f',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, fontFamily: '"Press Start 2P", monospace',
    }}>
      <style>{`
        @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-50px);opacity:0} }
        @keyframes battleShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
      `}</style>

      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#08080f' }}>

        {/* ── HP bars above scene ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'var(--gap-md)', padding: 'var(--gap-md) var(--gap-lg)', background: '#0d0d1f', borderBottom: 'var(--bd) solid #222' }}>
          {/* Player */}
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#aaa', marginBottom: 'var(--gap-xs)' }}>용사</div>
            <HpBarMini val={bs.php} max={player.maxHp || 100} />
          </div>
          {/* VS */}
          <div style={{ color: '#FF4500', fontSize: 'var(--fs-md)', padding: '0 var(--gap-md)' }}>VS</div>
          {/* Enemy */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: '#aaa', marginBottom: 'var(--gap-xs)' }}>{dino.name}</div>
            <HpBarMini val={bs.ehp} max={dino.hp} flip />
          </div>
        </div>

        {/* ── Battle scene ── */}
        <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
          <FightCanvas equipment={player.equipment || {}} dinoKey={enemy.dinoKey} pAnim={bs.pAnim} dAnim={bs.dAnim} shakePlayer={bs.shakeP} shakeDino={bs.shakeD} />
          <FloatNum nums={bs.floats} />
        </div>

        {/* ── Battle log ── */}
        <div style={{ background: '#0a0a18', borderTop: 'var(--bd) solid #1a1a30', borderBottom: 'var(--bd) solid #1a1a30', padding: 'var(--gap-md) var(--gap-lg)', minHeight: 'calc(var(--fs-sm) * 4.5)', maxHeight: 'calc(var(--fs-sm) * 4.5)', overflow: 'hidden' }}>
          {bs.log.slice(-3).map((m, i, arr) => (
            <div key={i} style={{ color: i === arr.length - 1 ? '#FFD700' : '#555', fontSize: 'var(--fs-sm)', lineHeight: 1.5 }}>{m}</div>
          ))}
        </div>

        {/* ── Command area (fixed-size 4-quadrant grid) ── */}
        {!bs.result ? (
          <div style={{
            display: 'grid', gridTemplateColumns: '60% 40%', background: '#08080f',
            height: 'clamp(220px, 32vh, 420px)', // FIXED — never reflows on phase change
          }}>
            {/* Left — fixed 2x2 command grid */}
            <div style={{
              padding: 'var(--gap-md) var(--gap-lg)',
              borderRight: 'var(--bd) solid #1a1a1a',
              display: 'flex', flexDirection: 'column', minHeight: 0,
            }}>
              <div style={{
                fontSize: 'var(--fs-xs)', color: '#888',
                marginBottom: 'var(--gap-sm)', height: 'var(--fs-md)',
                display: 'flex', alignItems: 'center', gap: 'var(--gap-md)',
              }}>
                {!isMyTurn ? (
                  <span style={{ color: '#FF4500' }}>{dino.emoji} 적의 턴...</span>
                ) : (
                  <span>▶ {bs.phase === 'attack_sub' ? '공격 선택'
                       : bs.phase === 'item_sub'   ? '아이템'
                       : bs.phase === 'status'     ? '내 상태'
                       : '명령'}</span>
                )}
              </div>

              <div style={{
                flex: 1, minHeight: 0,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
                gap: 'var(--gap-sm)', opacity: isMyTurn ? 1 : 0.4,
                pointerEvents: isMyTurn ? 'auto' : 'none',
              }}>
                {buildCommandCells({
                  phase: bs.phase, bs, player, pStats, items,
                  defend, normalAttack, magicAttack, ultraAttack, useItemAct,
                  setPhase: (next) => setBs(p => ({ ...p, phase: next })),
                }).map((c, i) => <Cell key={i} {...c} />)}
              </div>
            </div>

            {/* Right — stats */}
            <div style={{ padding: 'var(--gap-md) var(--gap-lg)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: '#666', marginBottom: 'var(--gap-sm)' }}>── 내 상태 ──</div>
              <Bar label="HP" val={bs.php} max={player.maxHp || 100}
                color={hpR > 0.5 ? '#00ee44' : hpR > 0.25 ? '#FFD700' : '#FF4444'} />
              <Bar label="MP" val={bs.pmp} max={player.maxMp || 60} color="#4488ff" />
              <div style={{ marginTop: 'var(--gap-md)', fontSize: 'var(--fs-xs)', color: '#888' }}>
                <div style={{ marginBottom: 'var(--gap-xs)' }}>🔥 ULTRA</div>
                <div style={{ display: 'flex', gap: 'var(--gap-xs)' }}>
                  {Array.from({ length: player.maxUltraGauge || 5 }, (_, i) => (
                    <div key={i} style={{
                      width: 'calc(var(--bar-h-md) * 1.4)', height: 'var(--bar-h-sm)',
                      background: i < (player.ultraGauge || 0) ? '#FF4500' : '#222',
                      border: 'var(--bd) solid #444',
                    }} />
                  ))}
                </div>
                <div style={{ marginTop: 'var(--gap-sm)', fontSize: 'var(--fs-xxs)', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dino.description}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Result */
          <div style={{ padding: 'var(--gap-lg)', textAlign: 'center', background: bs.result === 'won' ? '#040f04' : '#0f0404' }}>
            <div style={{ fontSize: 'var(--fs-xxl)', color: bs.result === 'won' ? '#00ff44' : '#FF4444', marginBottom: 'var(--gap-lg)' }}>
              {bs.result === 'won' ? '🏆 승리!' : '💀 패배...'}
            </div>
            {bs.result === 'won' && (
              <div style={{ fontSize: 'var(--fs-md)', color: '#FFD700', marginBottom: 'var(--gap-lg)', lineHeight: 1.8 }}>
                <div>EXP +{getExpFromDino(enemy.dinoKey)}</div>
                <div>GOLD +{getGoldFromDino(enemy.dinoKey)}</div>
              </div>
            )}
            <button onClick={handleEnd} style={{
              background: bs.result === 'won' ? '#0a3a10' : '#3a0a0a',
              color: bs.result === 'won' ? '#00ff44' : '#FF4444',
              border: `var(--bd) solid ${bs.result === 'won' ? '#00ff44' : '#FF4444'}`,
              padding: 'var(--gap-md) var(--gap-lg)', fontSize: 'var(--fs-lg)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {bs.result === 'won' ? '계속 달리기 →' : '게임 오버'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Build the 4 cells for the current phase ── */
function buildCommandCells({ phase, bs, player, pStats, items, defend, normalAttack, magicAttack, ultraAttack, useItemAct, setPhase }) {
  const back = { label: '◀ 뒤로', color: '#888', onClick: () => setPhase('select') };

  if (phase === 'attack_sub') {
    const canMagic = bs.pmp >= 20;
    const canUltra = (player.ultraGauge || 0) > 0;
    return [
      { label: '⚔️\n일반 공격', color: '#FF6600', onClick: normalAttack },
      { label: `✨\n마법\nMP ${bs.pmp}/${player.maxMp || 60}`, color: canMagic ? '#8888ff' : '#444', disabled: !canMagic, onClick: canMagic ? magicAttack : null },
      { label: `🔥\n필살기\n[${player.ultraGauge || 0}/${player.maxUltraGauge || 5}]`, color: canUltra ? '#FF4500' : '#444', disabled: !canUltra, onClick: canUltra ? ultraAttack : null },
      back,
    ];
  }

  if (phase === 'item_sub') {
    const slots = [];
    for (let i = 0; i < 3; i++) {
      const inv = items[i];
      if (inv) {
        const d = SHOP_ITEMS.find(x => x.id === inv.id);
        slots.push({ label: `${d?.sprite || ''}\n${d?.name || ''}\n×${inv.quantity}`, color: '#00cc44', onClick: () => useItemAct(inv.id) });
      } else {
        slots.push({ label: '─', color: '#222', disabled: true });
      }
    }
    slots.push(back);
    return slots;
  }

  if (phase === 'status') {
    return [
      { label: `⚔️\n공격력\n${pStats.attack}`, color: '#FF6600', readonly: true },
      { label: `🛡️\n방어력\n${pStats.defense}`, color: '#4488ff', readonly: true },
      {
        label: `⚖️\n무게\n${pStats.totalWeight}/${pStats.weightLimit}${pStats.isOverweight ? ' ⚠️' : ''}`,
        color: pStats.isOverweight ? '#FF4444' : '#aaa', readonly: true,
      },
      back,
    ];
  }

  // select
  return [
    { label: '⚔️\n공격', color: '#FF6600', onClick: () => setPhase('attack_sub') },
    { label: '🛡️\n방어', color: '#4488ff', onClick: defend },
    { label: '🎒\n아이템', color: '#00cc44', onClick: () => setPhase('item_sub') },
    { label: '📊\n상태', color: '#aaaaaa', onClick: () => setPhase('status') },
  ];
}

/* ── A single 2x2 grid cell — fixed size, scales font with cell size ── */
function Cell({ label, color, onClick, disabled, readonly }) {
  const isInteractive = !disabled && !readonly && typeof onClick === 'function';
  return (
    <button
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      style={{
        background: readonly ? '#0f0f1a' : '#0d0d1f',
        color: disabled ? '#444' : color,
        border: `var(--bd) solid ${disabled ? '#333' : color + '66'}`,
        fontSize: 'var(--fs-sm)',
        fontFamily: '"Press Start 2P", monospace',
        cursor: isInteractive ? 'pointer' : 'default',
        whiteSpace: 'pre-line', textAlign: 'center', lineHeight: 1.5,
        padding: 'var(--gap-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 0, minHeight: 0, // allow grid to control size
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => isInteractive && (e.currentTarget.style.background = '#1a1a3a')}
      onMouseLeave={e => isInteractive && (e.currentTarget.style.background = readonly ? '#0f0f1a' : '#0d0d1f')}
    >
      {label}
    </button>
  );
}

function HpBarMini({ val, max, flip = false }) {
  const r = Math.max(0, Math.min(1, val / max));
  const color = r > 0.5 ? '#00ee44' : r > 0.25 ? '#FFD700' : '#FF4444';
  return (
    <div style={{ background: '#1a1a1a', height: 'var(--bar-h-md)', border: 'var(--bd) solid #333', direction: flip ? 'rtl' : 'ltr' }}>
      <div style={{ background: color, height: '100%', width: `${r * 100}%`, transition: 'width 0.3s' }} />
    </div>
  );
}

