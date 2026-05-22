import { useState, useCallback, useEffect, useRef } from 'react';
import GameCanvas from './components/Game/GameCanvas.jsx';
import BattleScreen from './components/Battle/BattleScreen.jsx';
import ShopScreen from './components/Shop/ShopScreen.jsx';
import { TitleScreen, CountdownOverlay, GameOverScreen, LevelUpToast } from './components/Menu/Screens.jsx';
import { INITIAL_PLAYER, calculatePlayerStats, getLevel } from './data/gameData.js';
import './App.css';

const PHASE = { TITLE:'title', RUNNING:'running', COUNTDOWN:'countdown', BATTLE:'battle', SHOP:'shop', GAMEOVER:'gameover' };

const fresh = (base) => ({
  ...INITIAL_PLAYER,
  equipment: base.equipment,
  gold: base.gold,
  level: base.level,
  exp: base.exp,
  maxHp: base.maxHp,
  maxMp: base.maxMp,
  hp: base.maxHp,
  mp: base.maxMp,
  attack: base.attack,
  defense: base.defense,
  inventory: [...INITIAL_PLAYER.inventory],
  defeatedDinosaurs: {},
  ultraGauge: 0,
});

const withStats = (p) => ({ ...p, stats: calculatePlayerStats(p) });

export default function App() {
  const [phase, setPhase]         = useState(PHASE.TITLE);
  const [player, setPlayer]       = useState(() => withStats(INITIAL_PLAYER));
  const [enemy, setEnemy]         = useState(null);
  const [distance, setDistance]   = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [levelUp, setLevelUp]     = useState(null); // level number when leveled up
  const [runId, setRunId]         = useState(0); // increments only on fresh game
  const cdRef = useRef(null);

  const up = useCallback((fn) => setPlayer(p => withStats(fn(p))), []);

  /* ── Start / Restart ── */
  const startGame = useCallback(() => {
    setPlayer(p => withStats(fresh(p)));
    setDistance(0);
    setRunId(id => id + 1);
    setPhase(PHASE.RUNNING);
  }, []);

  /* ── Countdown helper ── */
  const runCountdown = useCallback(() => {
    setCountdown(3);
    setPhase(PHASE.COUNTDOWN);
    let c = 3;
    cdRef.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) { clearInterval(cdRef.current); setPhase(PHASE.RUNNING); }
    }, 750);
  }, []);
  useEffect(() => () => clearInterval(cdRef.current), []);

  /* ── Canvas callbacks ── */
  const onObstacle  = useCallback(() => setPhase(PHASE.GAMEOVER), []);
  const onDino      = useCallback((ent) => { setEnemy(ent); setPhase(PHASE.BATTLE); }, []);
  const onShop      = useCallback(() => setPhase(PHASE.SHOP), []);
  const onDistance  = useCallback((d) => setDistance(d), []);
  const onUltra     = useCallback((g) => up(p => ({ ...p, ultraGauge: g })), [up]);

  /* ── Battle end ── */
  const onBattleEnd = useCallback((result, data) => {
    // Side-effect events first (no phase change)
    if (result === 'ultra_used') { up(p => ({ ...p, ultraGauge: Math.max(0, (p.ultraGauge||0)-1) })); return; }
    if (result === 'use_item') {
      up(p => {
        const inv = p.inventory.map(i => i.id===data.itemId ? {...i,quantity:i.quantity-1} : i).filter(i=>i.quantity>0);
        return { ...p, inventory: inv };
      });
      return;
    }

    if (result === 'won') {
      up(p => {
        const newExp  = p.exp + (data.exp||0);
        const newLv   = getLevel(newExp);
        const lvUp    = newLv > p.level;
        if (lvUp) setTimeout(() => { setLevelUp(newLv); }, 400);
        const newDef  = { ...p.defeatedDinosaurs, ...(data.dinoKey ? { [data.dinoKey]: (p.defeatedDinosaurs[data.dinoKey]||0)+1 } : {}) };
        return {
          ...p,
          hp: data.hp, mp: data.mp,
          gold: p.gold + (data.gold||0),
          exp: newExp, level: newLv,
          defeatedDinosaurs: newDef,
          maxHp: lvUp ? p.maxHp+20 : p.maxHp,
          maxMp: lvUp ? p.maxMp+10 : p.maxMp,
          attack:  lvUp ? p.attack+3  : p.attack,
          defense: lvUp ? p.defense+2 : p.defense,
        };
      });
      runCountdown();
    } else if (result === 'lost') {
      setPhase(PHASE.GAMEOVER);
    }
  }, [up, runCountdown]);

  /* ── Shop ── */
  const onPurchase = useCallback((type, item) => {
    up(p => {
      if (type === 'item') {
        const ex = p.inventory.find(i=>i.id===item.id);
        const inv = ex
          ? p.inventory.map(i => i.id===item.id ? {...i,quantity:i.quantity+1} : i)
          : [...p.inventory, {id:item.id,quantity:1}];
        return { ...p, gold: p.gold-item.price, inventory: inv };
      }
      if (type === 'equipment') {
        return { ...p, gold: p.gold-item.price, equipment: {...p.equipment,[item.slot]:item.id} };
      }
      return p;
    });
  }, [up]);

  const onShopLeave = useCallback(() => runCountdown(), [runCountdown]);

  /* ── Keyboard start from title ── */
  useEffect(() => {
    if (phase !== PHASE.TITLE) return;
    const h = (e) => { if (e.code==='Space') { e.preventDefault(); startGame(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, startGame]);

  const showCanvas = phase === PHASE.RUNNING || phase === PHASE.COUNTDOWN;
  const canvasMounted = phase !== PHASE.TITLE; // keep canvas alive across battle/shop so distance persists

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#060606', position:'relative', overflow:'hidden' }}>

      {/* Top bar (overlay) — only during run/countdown */}
      {showCanvas && (
        <div style={{ position:'absolute', top:'var(--gap-md)', left:0, right:0, padding:'0 var(--gap-lg)', fontFamily:'"Press Start 2P",monospace', fontSize:'var(--fs-sm)', display:'flex', gap:'var(--gap-lg)', alignItems:'center', flexWrap:'wrap', justifyContent:'center', zIndex:50, pointerEvents:'none', textShadow:'2px 2px 0 #000' }}>
          <span style={{ color:'#FF4500', letterSpacing:2, fontSize:'var(--fs-md)' }}>🏃 RUN HERO REX</span>
          <Chip icon="📏" label={`${Math.floor(distance)}m`} color="#FFD700" />
          <Chip icon="💰" label={`${player.gold}G`} color="#FFD700" />
          <Chip icon="⭐" label={`Lv.${player.level}`} color="#88aaff" />
          <MiniBar label="HP" val={player.hp} max={player.maxHp} color={player.hp/player.maxHp>0.5?'#00ee44':player.hp/player.maxHp>0.25?'#FFD700':'#FF4444'} />
          <MiniBar label="MP" val={player.mp} max={player.maxMp} color="#4488ff" />
        </div>
      )}

      {/* Canvas area */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
        {phase === PHASE.TITLE && <TitleScreen onStart={startGame} />}

        {canvasMounted && (
          <div style={{ display: showCanvas ? 'block' : 'none', width:'100%', height:'100%' }}>
            <GameCanvas
              isRunning={phase === PHASE.RUNNING}
              runId={runId}
              player={player}
              onCollideObstacle={onObstacle}
              onCollideDino={onDino}
              onCollideShop={onShop}
              onDistanceUpdate={onDistance}
              onUltraGainedFrame={onUltra}
            />
            {phase === PHASE.COUNTDOWN && <CountdownOverlay count={countdown} />}
          </div>
        )}
      </div>

      {/* Hint */}
      {phase === PHASE.RUNNING && (
        <div style={{ position:'absolute', bottom:'var(--gap-md)', left:0, right:0, fontFamily:'"Press Start 2P",monospace', fontSize:'var(--fs-xs)', color:'#ddd', display:'flex', gap:'var(--gap-lg)', justifyContent:'center', flexWrap:'wrap', padding:'0 var(--gap-md)', zIndex:50, pointerEvents:'none', textShadow:'2px 2px 0 #000' }}>
          <span>SPACE/↑: 점프(2단)</span><span>공룡=전투</span><span>상점=쇼핑</span><span>장애물=오버</span>
        </div>
      )}

      {/* Overlays */}
      {phase === PHASE.BATTLE && enemy && <BattleScreen player={player} enemy={enemy} onBattleEnd={onBattleEnd} />}
      {phase === PHASE.SHOP   && <ShopScreen player={player} onPurchase={onPurchase} onLeave={onShopLeave} />}
      {phase === PHASE.GAMEOVER && <GameOverScreen distance={distance} defeatedDinosaurs={player.defeatedDinosaurs} onRestart={startGame} />}
      {levelUp && <LevelUpToast level={levelUp} onDone={() => setLevelUp(null)} />}
    </div>
  );
}

function Chip({ icon, label, color }) {
  return <span style={{ color, fontSize:'var(--fs-sm)' }}>{icon} {label}</span>;
}

function MiniBar({ label, val, max, color }) {
  const r = Math.max(0, Math.min(1, val/max));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'var(--gap-sm)' }}>
      <span style={{ fontSize:'var(--fs-xs)', color:'#888' }}>{label}</span>
      <div style={{ background:'#1a1a1a', width:'var(--bar-w-mini)', height:'var(--bar-h-sm)', border:'var(--bd) solid #444' }}>
        <div style={{ background:color, width:`${r*100}%`, height:'100%', transition:'width 0.3s' }} />
      </div>
      <span style={{ fontSize:'var(--fs-xs)', color }}>{Math.floor(val)}/{max}</span>
    </div>
  );
}
