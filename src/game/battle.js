import { SHOP_ITEMS } from '../data/gameData.js';

export const BATTLE_ACTIONS = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  ITEM: 'item',
  STATUS: 'status',
};

export const ATTACK_TYPES = {
  NORMAL: 'normal',
  MAGIC: 'magic',
  ULTRA: 'ultra',
};

export function calculateDamage(attacker, defender, attackType, weaponData) {
  let baseDamage;

  switch (attackType) {
    case ATTACK_TYPES.MAGIC:
      baseDamage = (weaponData?.magic || 5) + Math.floor(attacker.mp * 0.1);
      break;
    case ATTACK_TYPES.ULTRA:
      baseDamage = attacker.attack * 2.5 + 20;
      break;
    default:
      baseDamage = attacker.attack;
  }

  // Add some variance
  const variance = 0.85 + Math.random() * 0.3;
  const rawDamage = Math.floor(baseDamage * variance);

  // Defender's defense
  const defenseReduction = Math.floor(defender.defense * 0.5);
  const finalDamage = Math.max(1, rawDamage - defenseReduction);

  const isCritical = Math.random() < 0.15;

  return {
    damage: isCritical ? Math.floor(finalDamage * 1.5) : finalDamage,
    isCritical,
    attackType,
  };
}

export function calculateEnemyAttack(enemy, playerDefense, isDefending) {
  const baseDamage = enemy.attack;
  const variance = 0.8 + Math.random() * 0.4;
  const rawDamage = Math.floor(baseDamage * variance);

  // Attack name
  const attackName = enemy.attacks
    ? enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)]
    : '공격';

  if (isDefending) {
    const blocked = Math.floor(rawDamage * 0.7);
    const throughDamage = Math.max(0, rawDamage - blocked);
    return {
      damage: throughDamage,
      blocked,
      attackName,
      wasDefended: true,
    };
  }

  const defenseReduction = Math.floor(playerDefense * 0.3);
  const finalDamage = Math.max(1, rawDamage - defenseReduction);

  return {
    damage: finalDamage,
    blocked: 0,
    attackName,
    wasDefended: false,
  };
}

export function useItem(itemId, player, enemy) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return { player, enemy, message: '아이템을 찾을 수 없음' };

  const newPlayer = { ...player };
  const newEnemy = { ...enemy };
  let message = '';

  switch (item.effect) {
    case 'hp':
      const healAmount = Math.min(item.value, newPlayer.maxHp - newPlayer.hp);
      newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + item.value);
      message = `HP ${healAmount} 회복!`;
      break;
    case 'mp':
      newPlayer.mp = Math.min(newPlayer.maxMp, newPlayer.mp + item.value);
      message = `MP ${item.value} 회복!`;
      break;
    case 'damage':
      const dmg = Math.max(1, item.value - Math.floor(newEnemy.defense * 0.3));
      newEnemy.currentHp = Math.max(0, newEnemy.currentHp - dmg);
      message = `${item.name} 투척! ${dmg} 대미지!`;
      break;
    case 'poison':
      newEnemy.poisoned = { damage: item.value, duration: item.duration || 3 };
      message = `독 중독! 매 턴 ${item.value} 대미지`;
      break;
    case 'defense':
      newPlayer.tempDefense = (newPlayer.tempDefense || 0) + item.value;
      message = `방어력 ${item.value} 강화!`;
      break;
    default:
      message = '아이템 사용';
  }

  // Remove one from inventory
  const newInventory = newPlayer.inventory.map(inv =>
    inv.id === itemId ? { ...inv, quantity: inv.quantity - 1 } : inv
  ).filter(inv => inv.quantity > 0);

  newPlayer.inventory = newInventory;

  return { player: newPlayer, enemy: newEnemy, message };
}

export function checkBattleEnd(playerHp, enemyHp) {
  if (enemyHp <= 0) return 'win';
  if (playerHp <= 0) return 'lose';
  return null;
}

export function getExpFromDino(dinoKey) {
  const expMap = {
    trex: 80, triceratops: 100, brachiosaurus: 120,
    pachycephalosaurus: 90, pteranodon: 70, velociraptor: 85,
  };
  return expMap[dinoKey] || 60;
}

export function getGoldFromDino(dinoKey) {
  const goldMap = {
    trex: 60, triceratops: 70, brachiosaurus: 80,
    pachycephalosaurus: 65, pteranodon: 55, velociraptor: 62,
  };
  return goldMap[dinoKey] || 50;
}
