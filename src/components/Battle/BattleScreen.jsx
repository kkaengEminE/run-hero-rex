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
      style={{ display: 'block', imageRendering: 'pixelated', width: '100%' }} />
  );
}

/* ── stat bar ── */
function Bar({ label, val, max, color }) {
  const r = Math.max(0, Math.min(1, val / max));
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#aaa', marginBottom: 2 }}>
        <span>{label}</span><span>{Math.floor(val)}/{max}</span>
      </div>
      <div style={{ background: '#1a1a1a', height: 10, border: '1px solid #333' }}>
        <div style={{ background: color, height: '100%', width: `${r * 100}%`, transition: 'width 0.25s' }} />
      </div>
    </div>
  );
}

/* ── floating damage number ── */
function FloatNum({ nums }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 220, pointerEvents: 'none', overflow: 'hidden' }}>
      {nums.map(n => (
        <div key={n.id} style={{
          position: 'absolute', left: n.x, top: n.y,
          color: n.color, fontFamily: '"Press Start 2P", monospace',
          fontSize: n.big ? 16 : 12,
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
  const doEnemyTurn = useCallback((state) => {
    setTimeout(() => {
      setBs(prev => {
        let s = { ...prev, ...state };

        // Poison tick
        if (s.ePoisoned) {
          const dmg = s.ePoisoned.damage;
          s.ehp = Math.max(0, s.ehp - dmg);
          s.log = addLog(`☠️ 독! ${dmg} 대미지`, s.log);
          spawnFloat(`-${dmg}`, 420, 60, '#00cc00');
          s.ePoisoned = { ...s.ePoisoned, duration: s.ePoisoned.duration - 1 };
          if (s.ePoisoned.duration <= 0) s.ePoisoned = null;
          if (s.ehp <= 0) {
            return { ...s, result: 'won', log: addLog('🏆 승리!', s.log) };
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
          spawnFloat(`-${atkResult.damage}`, 80, 90, s.defending ? '#FFD700' : '#FF4444', !s.defending);
        }

        const won = checkBattleEnd(newPhp, s.ehp);
        return {
          ...s,
          php: newPhp,
          shakeP: atkResult.damage > 0,
          defending: false,
          turn: 'player',
          phase: won === 'lose' ? 'select' : 'select',
          result: won === 'lose' ? 'lost' : null,
          log: addLog(logMsg, s.log),
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
      const won = checkBattleEnd(newState.php, newState.ehp);
      const finalState = {
        ...prev, ...newState,
        turn: won ? 'done' : 'enemy',
        result: won || null,
        log: addLog(log, prev.log),
        phase: 'select',
      };
      if (!won) doEnemyTurn(finalState);
      if (won === 'won') finalState.log = addLog('🏆 승리!', finalState.log);
      if (won === 'lost') finalState.log = addLog('💀 패배...', finalState.log);
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
      floatArgs: [`${r.isCritical ? '💥' : ''}−${r.damage}`, 430, 50, r.isCritical ? '#FFD700' : '#ff8800', r.isCritical],
    };
  });

  const magicAttack = () => {
    if (bs.pmp < 20) { setBs(p => ({ ...p, log: addLog('💧 MP 부족!', p.log) })); return; }
    act(prev => {
      const r = calculateDamage({ attack: pStats.attack, mp: prev.pmp }, { defense: Math.floor(dino.defense * 0.5) }, ATTACK_TYPES.MAGIC, pStats.weaponData);
      return {
        newState: { ehp: Math.max(0, prev.ehp - r.damage), pmp: prev.pmp - 20, shakeD: true },
        log: `✨ 마법 공격! ${r.damage} 대미지 (MP-20)`,
        floatArgs: [`✨−${r.damage}`, 430, 50, '#88aaff', true],
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
        floatArgs: [`🔥−${r.damage}`, 410, 40, '#FF4500', true],
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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, fontFamily: '"Press Start 2P", monospace',
    }}>
      <style>{`
        @keyframes floatUp { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-50px);opacity:0} }
        @keyframes battleShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
      `}</style>

      <div style={{ width: 600, maxWidth: '100vw', border: '3px solid #FFD700', background: '#08080f', boxShadow: '0 0 50px rgba(255,215,0,0.25)' }}>

        {/* ── HP bars above scene ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '6px 10px', background: '#0d0d1f', borderBottom: '1px solid #222' }}>
          {/* Player */}
          <div>
            <div style={{ fontSize: 7, color: '#aaa', marginBottom: 3 }}>용사</div>
            <HpBarMini val={bs.php} max={player.maxHp || 100} />
          </div>
          {/* VS */}
          <div style={{ color: '#FF4500', fontSize: 10, padding: '0 12px' }}>VS</div>
          {/* Enemy */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 7, color: '#aaa', marginBottom: 3 }}>{dino.name}</div>
            <HpBarMini val={bs.ehp} max={dino.hp} flip />
          </div>
        </div>

        {/* ── Battle scene ── */}
        <div style={{ position: 'relative' }}>
          <FightCanvas equipment={player.equipment || {}} dinoKey={enemy.dinoKey} pAnim={bs.pAnim} dAnim={bs.dAnim} shakePlayer={bs.shakeP} shakeDino={bs.shakeD} />
          <FloatNum nums={bs.floats} />
        </div>

        {/* ── Battle log ── */}
        <div style={{ background: '#0a0a18', borderTop: '2px solid #1a1a30', borderBottom: '2px solid #1a1a30', padding: '7px 12px', minHeight: 68, maxHeight: 68, overflow: 'hidden' }}>
          {bs.log.slice(-3).map((m, i, arr) => (
            <div key={i} style={{ color: i === arr.length - 1 ? '#FFD700' : '#555', fontSize: 8, lineHeight: 1.7 }}>{m}</div>
          ))}
        </div>

        {/* ── Command area ── */}
        {!bs.result ? (
          <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', background: '#08080f' }}>
            {/* Left — menus */}
            <div style={{ padding: 10, borderRight: '2px solid #1a1a1a', minHeight: 130 }}>
              {isMyTurn && bs.phase === 'select' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: '⚔️ 공격', sub: 'attack_sub', color: '#FF6600' },
                    { label: '🛡️ 방어', fn: defend, color: '#4488ff' },
                    { label: '🎒 아이템', sub: 'item_sub', color: '#00cc44' },
                    { label: '📊 상태', sub: 'status', color: '#aaaaaa' },
                  ].map(b => (
                    <Btn key={b.label} color={b.color}
                      onClick={() => b.fn ? b.fn() : setBs(p => ({ ...p, phase: b.sub }))}>
                      {b.label}
                    </Btn>
                  ))}
                </div>
              )}

              {isMyTurn && bs.phase === 'attack_sub' && (
                <SubMenu title="공격 선택" onBack={() => setBs(p => ({ ...p, phase: 'select' }))}>
                  <Btn color="#FF6600" onClick={normalAttack}>⚔️ 일반 공격</Btn>
                  <Btn color={bs.pmp >= 20 ? '#8888ff' : '#333'} onClick={magicAttack}>
                    ✨ 마법 (MP {bs.pmp}/{player.maxMp || 60})
                  </Btn>
                  <Btn color={(player.ultraGauge || 0) > 0 ? '#FF4500' : '#333'} onClick={ultraAttack}>
                    🔥 필살기 [{player.ultraGauge || 0}/{player.maxUltraGauge || 5}]
                  </Btn>
                </SubMenu>
              )}

              {isMyTurn && bs.phase === 'item_sub' && (
                <SubMenu title="아이템" onBack={() => setBs(p => ({ ...p, phase: 'select' }))}>
                  {items.length === 0 && <div style={{ color: '#555', fontSize: 8 }}>아이템 없음</div>}
                  {items.map(inv => {
                    const d = SHOP_ITEMS.find(i => i.id === inv.id);
                    return (
                      <Btn key={inv.id} color="#00cc44" onClick={() => useItemAct(inv.id)}>
                        {d?.sprite} {d?.name} ×{inv.quantity}
                      </Btn>
                    );
                  })}
                </SubMenu>
              )}

              {isMyTurn && bs.phase === 'status' && (
                <SubMenu title="내 상태" onBack={() => setBs(p => ({ ...p, phase: 'select' }))}>
                  <div style={{ fontSize: 7, color: '#aaa', lineHeight: 2 }}>
                    <div>⚔️ 공격력: {pStats.attack}</div>
                    <div>🛡️ 방어력: {pStats.defense}</div>
                    {pStats.magic > 0 && <div>✨ 마법력: {pStats.magic}</div>}
                    <div style={{ color: pStats.isOverweight ? '#FF4444' : '#aaa' }}>
                      ⚖️ 무게: {pStats.totalWeight}/{pStats.weightLimit}
                      {pStats.isOverweight && ' ⚠️과부하'}
                    </div>
                    <div style={{ color: '#FFD700', marginTop: 4 }}>
                      {pStats.helmetData?.name !== '없음' ? pStats.helmetData?.sprite : '🚫'} {pStats.helmetData?.name}
                    </div>
                    <div style={{ color: '#FFD700' }}>
                      {pStats.armorData?.name !== '없음' ? pStats.armorData?.sprite : '🚫'} {pStats.armorData?.name}
                    </div>
                    <div style={{ color: '#FFD700' }}>
                      {pStats.weaponData?.name !== '없음' ? pStats.weaponData?.sprite : '🚫'} {pStats.weaponData?.name}
                    </div>
                  </div>
                </SubMenu>
              )}

              {!isMyTurn && !bs.result && (
                <div style={{ color: '#FF4500', fontSize: 9, paddingTop: 24, textAlign: 'center' }}>
                  {dino.emoji} 적의 턴...
                </div>
              )}
            </div>

            {/* Right — stats */}
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 7, color: '#666', marginBottom: 6 }}>── 내 상태 ──</div>
              <Bar label="HP" val={bs.php} max={player.maxHp || 100}
                color={hpR > 0.5 ? '#00ee44' : hpR > 0.25 ? '#FFD700' : '#FF4444'} />
              <Bar label="MP" val={bs.pmp} max={player.maxMp || 60} color="#4488ff" />
              <div style={{ marginTop: 6, fontSize: 7, color: '#555' }}>
                <div style={{ marginBottom: 3 }}>🔥 ULTRA</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: player.maxUltraGauge || 5 }, (_, i) => (
                    <div key={i} style={{
                      width: 16, height: 10,
                      background: i < (player.ultraGauge || 0) ? '#FF4500' : '#222',
                      border: '1px solid #444',
                    }} />
                  ))}
                </div>
                <div style={{ marginTop: 5, fontSize: 6, color: '#444' }}>
                  {dino.description}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Result */
          <div style={{ padding: 28, textAlign: 'center', background: bs.result === 'won' ? '#040f04' : '#0f0404' }}>
            <div style={{ fontSize: 22, color: bs.result === 'won' ? '#00ff44' : '#FF4444', marginBottom: 14 }}>
              {bs.result === 'won' ? '🏆 승리!' : '💀 패배...'}
            </div>
            {bs.result === 'won' && (
              <div style={{ fontSize: 9, color: '#FFD700', marginBottom: 14, lineHeight: 2 }}>
                <div>EXP +{getExpFromDino(enemy.dinoKey)}</div>
                <div>GOLD +{getGoldFromDino(enemy.dinoKey)}</div>
              </div>
            )}
            <button onClick={handleEnd} style={{
              background: bs.result === 'won' ? '#0a3a10' : '#3a0a0a',
              color: bs.result === 'won' ? '#00ff44' : '#FF4444',
              border: `2px solid ${bs.result === 'won' ? '#00ff44' : '#FF4444'}`,
              padding: '10px 28px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {bs.result === 'won' ? '계속 달리기 →' : '게임 오버'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HpBarMini({ val, max, flip = false }) {
  const r = Math.max(0, Math.min(1, val / max));
  const color = r > 0.5 ? '#00ee44' : r > 0.25 ? '#FFD700' : '#FF4444';
  return (
    <div style={{ background: '#1a1a1a', height: 10, border: '1px solid #333', direction: flip ? 'rtl' : 'ltr' }}>
      <div style={{ background: color, height: '100%', width: `${r * 100}%`, transition: 'width 0.3s' }} />
    </div>
  );
}

function Btn({ children, onClick, color = '#FFD700' }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', background: '#0d0d1f',
      color, border: `1px solid ${color}44`,
      padding: '7px 4px', fontSize: 8, cursor: 'pointer',
      fontFamily: '"Press Start 2P", monospace', textAlign: 'left',
      marginBottom: 5, transition: 'background 0.1s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#1a1a3a'}
      onMouseLeave={e => e.currentTarget.style.background = '#0d0d1f'}>
      {children}
    </button>
  );
}

function SubMenu({ title, onBack, children }) {
  return (
    <div>
      <div style={{ fontSize: 7, color: '#666', marginBottom: 6 }}>▶ {title}</div>
      {children}
      <button onClick={onBack} style={{
        background: 'none', color: '#555', border: '1px solid #333',
        padding: '5px 8px', fontSize: 7, cursor: 'pointer',
        fontFamily: '"Press Start 2P", monospace', marginTop: 4,
      }}>◀ 뒤로</button>
    </div>
  );
}
