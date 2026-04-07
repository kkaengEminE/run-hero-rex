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
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, fontFamily: '"Press Start 2P", monospace',
    }}>
      <div style={{
        width: 640, maxWidth: '100vw', maxHeight: '90vh',
        background: '#1a0d00',
        border: '3px solid #DAA520',
        boxShadow: '0 0 50px rgba(218,165,32,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Shop header */}
        <div style={{
          background: 'linear-gradient(135deg, #3d1a00, #5a2800)',
          padding: '12px 16px',
          borderBottom: '2px solid #DAA520',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#FFD700', fontSize: 14 }}>🏪 아이템 상점</div>
            <div style={{ color: '#aaa', fontSize: 8, marginTop: 4 }}>{message}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#FFD700', fontSize: 12 }}>💰 {player.gold}G</div>
            <div style={{ color: totalWeight > weightLimit ? '#FF4444' : '#aaa', fontSize: 7, marginTop: 2 }}>
              ⚖️ {totalWeight}/{weightLimit}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #333' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px 4px',
                background: activeTab === tab.id ? '#3d1a00' : '#150a00',
                color: activeTab === tab.id ? '#FFD700' : '#888',
                border: 'none', borderBottom: activeTab === tab.id ? '2px solid #FFD700' : '2px solid transparent',
                fontSize: 7, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {activeTab === TAB_ITEMS && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          padding: '10px 16px',
          borderTop: '2px solid #333',
          background: '#100800',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 7, color: '#666' }}>
            LV.{player.level} | HP {player.hp}/{player.maxHp}
          </div>
          <button
            onClick={onLeave}
            style={{
              background: '#3d1a00', color: '#FFD700',
              border: '2px solid #DAA520',
              padding: '8px 20px', fontSize: 9,
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
      border: `2px solid ${canAfford ? '#5a3a00' : '#333'}`,
      padding: 10,
      opacity: canAfford ? 1 : 0.6,
    }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{item.sprite}</div>
      <div style={{ color: '#FFD700', fontSize: 8, marginBottom: 3 }}>{item.name}</div>
      <div style={{ color: '#aaa', fontSize: 7, marginBottom: 6, lineHeight: 1.5 }}>{item.desc}</div>
      <button
        onClick={canAfford ? onBuy : undefined}
        disabled={!canAfford}
        style={{
          width: '100%', background: canAfford ? '#3d1a00' : '#111',
          color: canAfford ? '#FFD700' : '#444',
          border: `1px solid ${canAfford ? '#DAA520' : '#333'}`,
          padding: '5px', fontSize: 8, cursor: canAfford ? 'pointer' : 'default',
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
      border: `2px solid ${isEquipped ? '#FFD700' : canAfford ? '#5a3a00' : '#333'}`,
      padding: 10,
      display: 'flex', alignItems: 'center', gap: 12,
      opacity: canAfford ? 1 : 0.6,
    }}>
      <div style={{ fontSize: 24 }}>{equip.sprite}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: isEquipped ? '#FFD700' : '#ccc', fontSize: 9, marginBottom: 3 }}>
          {equip.name} {isEquipped && '✓'}
        </div>
        <div style={{ fontSize: 7, color: '#aaa', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
          border: `1px solid ${isEquipped ? '#00ff44' : canAfford ? '#DAA520' : '#333'}`,
          padding: '6px 10px', fontSize: 7, cursor: isEquipped || !canAfford ? 'default' : 'pointer',
          fontFamily: '"Press Start 2P", monospace', minWidth: 70,
        }}
      >
        {isEquipped ? '장착중' : `💰${equip.price}G`}
      </button>
    </div>
  );
}
