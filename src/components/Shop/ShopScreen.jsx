import { useState } from 'react';
import { HELMETS, ARMORS, WEAPONS, SHOP_ITEMS, calculatePlayerStats, getWeightLimit } from '../../data/gameData.js';

const TAB_ITEMS = 'items';
const TAB_HELMET = 'helmet';
const TAB_ARMOR = 'armor';
const TAB_WEAPON = 'weapon';

export default function ShopScreen({ player, onPurchase, onLeave }) {
  const [activeTab, setActiveTab] = useState(TAB_ITEMS);
  const [message, setMessage] = useState('어서오세요, 모험가님!');
  const stats = calculatePlayerStats(player);

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage('무엇을 사시겠습니까?'), 2500);
  };

  const buyItem = (item) => {
    if (player.gold < item.price) {
      showMsg('💰 골드가 부족합니다!');
      return;
    }
    onPurchase('item', item);
    showMsg(`✅ ${item.name} 구매!`);
  };

  const buyEquipment = (equip) => {
    if (player.gold < equip.price) {
      showMsg('💰 골드가 부족합니다!');
      return;
    }
    if (equip.id === 'none') {
      showMsg('⚠️ 구매할 수 없는 항목입니다.');
      return;
    }
    onPurchase('equipment', equip);
    showMsg(`✅ ${equip.name} 구매 및 장착!`);
  };

  const equipList = (slot) => {
    switch (slot) {
      case TAB_HELMET: return HELMETS;
      case TAB_ARMOR: return ARMORS;
      case TAB_WEAPON: return WEAPONS;
      default: return [];
    }
  };

  const getEquippedId = (slot) => {
    if (!player.equipment) return 'none';
    return player.equipment[slot] || 'none';
  };

  const tabs = [
    { id: TAB_ITEMS, label: '🎒 아이템' },
    { id: TAB_HELMET, label: '⛑️ 투구' },
    { id: TAB_ARMOR, label: '🛡️ 갑옷' },
    { id: TAB_WEAPON, label: '⚔️ 무기' },
  ];

  const totalWeight = stats.totalWeight;
  const weightLimit = getWeightLimit(player.level || 1);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#1a0d00',
      display: 'flex', alignItems: 'stretch', justifyContent: 'stretch',
      zIndex: 100, fontFamily: '"Press Start 2P", monospace',
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: '#1a0d00',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Shop header */}
        <div style={{
          background: 'linear-gradient(135deg, #3d1a00, #5a2800)',
          padding: 'var(--gap-md) var(--gap-lg)',
          borderBottom: 'var(--bd) solid #DAA520',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#FFD700', fontSize: 'var(--fs-xl)' }}>🏪 아이템 상점</div>
            <div style={{ color: '#aaa', fontSize: 'var(--fs-sm)', marginTop: 'var(--gap-xs)' }}>{message}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#FFD700', fontSize: 'var(--fs-lg)' }}>💰 {player.gold}G</div>
            <div style={{ color: totalWeight > weightLimit ? '#FF4444' : '#aaa', fontSize: 'var(--fs-xs)', marginTop: 'var(--gap-xs)' }}>
              ⚖️ {totalWeight}/{weightLimit}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: 'var(--bd) solid #333' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: 'var(--gap-md) var(--gap-sm)',
                background: activeTab === tab.id ? '#3d1a00' : '#150a00',
                color: activeTab === tab.id ? '#FFD700' : '#888',
                border: 'none', borderBottom: activeTab === tab.id ? 'var(--bd) solid #FFD700' : 'var(--bd) solid transparent',
                fontSize: 'var(--fs-sm)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--gap-md) var(--gap-lg)' }}>
          {activeTab === TAB_ITEMS && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(180px, 22vw, 360px), 1fr))', gap: 'var(--gap-md)' }}>
              {SHOP_ITEMS.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  canAfford={player.gold >= item.price}
                  onBuy={() => buyItem(item)}
                />
              ))}
            </div>
          )}

          {[TAB_HELMET, TAB_ARMOR, TAB_WEAPON].includes(activeTab) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)', maxWidth: 1100, margin: '0 auto' }}>
              {equipList(activeTab).filter(e => e.id !== 'none').map(equip => (
                <EquipCard
                  key={equip.id}
                  equip={equip}
                  isEquipped={getEquippedId(activeTab) === equip.id}
                  canAfford={player.gold >= equip.price}
                  weightLimit={weightLimit}
                  currentWeight={totalWeight}
                  onBuy={() => buyEquipment(equip)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--gap-md) var(--gap-lg)',
          borderTop: 'var(--bd) solid #333',
          background: '#100800',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 'var(--fs-sm)', color: '#888' }}>
            LV.{player.level} | HP {player.hp}/{player.maxHp}
          </div>
          <button
            onClick={onLeave}
            style={{
              background: '#3d1a00', color: '#FFD700',
              border: 'var(--bd) solid #DAA520',
              padding: 'var(--gap-md) var(--gap-lg)', fontSize: 'var(--fs-md)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.target.style.background = '#5a2800'}
            onMouseLeave={e => e.target.style.background = '#3d1a00'}
          >
            🚪 나가기 (계속 달리기)
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, canAfford, onBuy }) {
  return (
    <div style={{
      background: '#200f00',
      border: `var(--bd) solid ${canAfford ? '#5a3a00' : '#333'}`,
      padding: 'var(--gap-md)',
      opacity: canAfford ? 1 : 0.6,
    }}>
      <div style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--gap-sm)' }}>{item.sprite}</div>
      <div style={{ color: '#FFD700', fontSize: 'var(--fs-md)', marginBottom: 'var(--gap-xs)' }}>{item.name}</div>
      <div style={{ color: '#aaa', fontSize: 'var(--fs-xs)', marginBottom: 'var(--gap-md)', lineHeight: 1.5 }}>{item.desc}</div>
      <button
        onClick={canAfford ? onBuy : undefined}
        disabled={!canAfford}
        style={{
          width: '100%', background: canAfford ? '#3d1a00' : '#111',
          color: canAfford ? '#FFD700' : '#444',
          border: `var(--bd) solid ${canAfford ? '#DAA520' : '#333'}`,
          padding: 'var(--gap-sm)', fontSize: 'var(--fs-sm)', cursor: canAfford ? 'pointer' : 'default',
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        💰 {item.price}G
      </button>
    </div>
  );
}

function EquipCard({ equip, isEquipped, canAfford, weightLimit, currentWeight, onBuy }) {
  const wouldExceed = (currentWeight + equip.weight) > weightLimit;
  return (
    <div style={{
      background: '#200f00',
      border: `var(--bd) solid ${isEquipped ? '#FFD700' : canAfford ? '#5a3a00' : '#333'}`,
      padding: 'var(--gap-md)',
      display: 'flex', alignItems: 'center', gap: 'var(--gap-md)',
      opacity: canAfford ? 1 : 0.6,
    }}>
      <div style={{ fontSize: 'var(--fs-xl)' }}>{equip.sprite}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: isEquipped ? '#FFD700' : '#ccc', fontSize: 'var(--fs-md)', marginBottom: 'var(--gap-xs)' }}>
          {equip.name} {isEquipped && '✓'}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: '#aaa', display: 'flex', gap: 'var(--gap-md)', flexWrap: 'wrap' }}>
          {equip.defense && <span>🛡️+{equip.defense}</span>}
          {equip.attack && <span>⚔️+{equip.attack}</span>}
          {equip.magic && <span>✨+{equip.magic}</span>}
          {equip.mp && <span>💧+{equip.mp}</span>}
          <span style={{ color: wouldExceed ? '#FF4444' : '#aaa' }}>⚖️{equip.weight}</span>
        </div>
      </div>
      <button
        onClick={!isEquipped && canAfford ? onBuy : undefined}
        disabled={isEquipped || !canAfford}
        style={{
          background: isEquipped ? '#1a3a10' : canAfford ? '#3d1a00' : '#111',
          color: isEquipped ? '#00ff44' : canAfford ? '#FFD700' : '#444',
          border: `var(--bd) solid ${isEquipped ? '#00ff44' : canAfford ? '#DAA520' : '#333'}`,
          padding: 'var(--gap-sm) var(--gap-md)', fontSize: 'var(--fs-sm)', cursor: isEquipped || !canAfford ? 'default' : 'pointer',
          fontFamily: '"Press Start 2P", monospace', minWidth: 'clamp(80px, 10vw, 160px)',
        }}
      >
        {isEquipped ? '장착중' : `💰${equip.price}G`}
      </button>
    </div>
  );
}
