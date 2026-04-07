// ============================================================
// EQUIPMENT DATA
// ============================================================
export const HELMETS = [
  { id: 'none', name: '없음', slot: 'helmet', weight: 0, price: 0, defense: 0, sprite: null },
  { id: 'leather_hat', name: '가죽 모자', slot: 'helmet', weight: 2, price: 50, defense: 3, sprite: '🪖', color: '#8B6914' },
  { id: 'iron_helm', name: '철 투구', slot: 'helmet', weight: 5, price: 150, defense: 8, sprite: '⛑️', color: '#888' },
  { id: 'magic_crown', name: '마법사의 왕관', slot: 'helmet', weight: 3, price: 300, defense: 5, mp: 20, sprite: '👑', color: '#FFD700' },
  { id: 'dragon_helm', name: '드래곤 투구', slot: 'helmet', weight: 8, price: 600, defense: 18, sprite: '🐉', color: '#8B0000' },
];

export const ARMORS = [
  { id: 'none', name: '없음', slot: 'armor', weight: 0, price: 0, defense: 0, sprite: null },
  { id: 'cloth', name: '천 갑옷', slot: 'armor', weight: 3, price: 40, defense: 4, sprite: '👕', color: '#CC4444' },
  { id: 'leather', name: '가죽 갑옷', slot: 'armor', weight: 6, price: 120, defense: 10, sprite: '🧥', color: '#8B4513' },
  { id: 'chain_mail', name: '체인 메일', slot: 'armor', weight: 10, price: 280, defense: 18, sprite: '🛡️', color: '#778899' },
  { id: 'plate_armor', name: '판금 갑옷', slot: 'armor', weight: 15, price: 500, defense: 28, sprite: '🏰', color: '#C0C0C0' },
  { id: 'dragon_armor', name: '드래곤 갑옷', slot: 'armor', weight: 12, price: 800, defense: 35, sprite: '🐲', color: '#006400' },
];

export const WEAPONS = [
  { id: 'none', name: '없음', slot: 'weapon', weight: 0, price: 0, attack: 0, sprite: null },
  { id: 'dagger', name: '단검', slot: 'weapon', weight: 1, price: 30, attack: 5, sprite: '🗡️', color: '#C0C0C0' },
  { id: 'sword', name: '검', slot: 'weapon', weight: 4, price: 100, attack: 12, sprite: '⚔️', color: '#C0C0C0' },
  { id: 'great_sword', name: '대검', slot: 'weapon', weight: 9, price: 250, attack: 22, sprite: '🗡️', color: '#888' },
  { id: 'magic_staff', name: '마법 지팡이', slot: 'weapon', weight: 3, price: 350, attack: 8, magic: 25, sprite: '🪄', color: '#9400D3' },
  { id: 'dragon_sword', name: '드래곤 소드', slot: 'weapon', weight: 7, price: 700, attack: 35, sprite: '🔥', color: '#FF4500' },
];

// ============================================================
// ITEMS DATA
// ============================================================
export const SHOP_ITEMS = [
  { id: 'hp_potion', name: 'HP 포션', type: 'consumable', effect: 'hp', value: 50, price: 30, sprite: '🧪', color: '#FF4444', desc: 'HP를 50 회복' },
  { id: 'hp_potion_large', name: '대형 HP 포션', type: 'consumable', effect: 'hp', value: 150, price: 80, sprite: '🍶', color: '#FF0000', desc: 'HP를 150 회복' },
  { id: 'mp_potion', name: 'MP 포션', type: 'consumable', effect: 'mp', value: 30, price: 25, sprite: '🧃', color: '#4444FF', desc: 'MP를 30 회복' },
  { id: 'mp_potion_large', name: '대형 MP 포션', type: 'consumable', effect: 'mp', value: 100, price: 70, sprite: '💧', color: '#0000FF', desc: 'MP를 100 회복' },
  { id: 'throwing_knife', name: '투척 단검', type: 'attack_item', effect: 'damage', value: 30, price: 20, sprite: '🔪', color: '#888', desc: '적에게 30 대미지 (투척)' },
  { id: 'fire_bomb', name: '화염 폭탄', type: 'attack_item', effect: 'damage', value: 80, price: 60, sprite: '💣', color: '#FF6600', desc: '적에게 80 대미지' },
  { id: 'poison_vial', name: '독 약병', type: 'attack_item', effect: 'poison', value: 15, duration: 3, price: 45, sprite: '☠️', color: '#00CC00', desc: '3턴간 매턴 15 독 대미지' },
  { id: 'shield_scroll', name: '방패 두루마리', type: 'defense_item', effect: 'defense', value: 30, price: 35, sprite: '📜', color: '#DAA520', desc: '이번 전투 방어력 +30' },
];

// ============================================================
// DINOSAUR DATA
// ============================================================
export const DINOSAURS = {
  trex: {
    id: 'trex',
    name: '티라노사우르스',
    emoji: '🦖',
    color: '#2d5a1b',
    hp: 120,
    maxHp: 120,
    attack: 25,
    defense: 10,
    speed: 'fast',
    expReward: 80,
    goldReward: 60,
    width: 70,
    height: 80,
    attacks: ['물기', '꼬리 치기', '돌진'],
    description: '육식 공룡의 왕. 강력한 턱을 가졌다.',
  },
  triceratops: {
    id: 'triceratops',
    name: '트리케라톱스',
    emoji: '🦕',
    color: '#5a3d1b',
    hp: 180,
    maxHp: 180,
    attack: 18,
    defense: 20,
    speed: 'slow',
    expReward: 100,
    goldReward: 70,
    width: 80,
    height: 70,
    attacks: ['뿔 돌격', '밟기', '방어 자세'],
    description: '단단한 뿔과 방패를 가진 초식 공룡.',
  },
  brachiosaurus: {
    id: 'brachiosaurus',
    name: '브라키오사우르스',
    emoji: '🦒',
    color: '#6b8e23',
    hp: 250,
    maxHp: 250,
    attack: 12,
    defense: 8,
    speed: 'slow',
    expReward: 120,
    goldReward: 80,
    width: 60,
    height: 120,
    attacks: ['목 내리치기', '밟기', '꼬리 휩쓸기'],
    description: '거대한 몸집의 온순한 공룡. 그러나 밟히면 끝.',
  },
  pachycephalosaurus: {
    id: 'pachycephalosaurus',
    name: '파키케팔로사우르스',
    emoji: '🐊',
    color: '#556b2f',
    hp: 90,
    maxHp: 90,
    attack: 35,
    defense: 15,
    speed: 'fast',
    expReward: 90,
    goldReward: 65,
    width: 65,
    height: 65,
    attacks: ['박치기', '돌진', '머리 부딪기'],
    description: '두꺼운 머리뼈로 박치기를 하는 공룡.',
  },
  pteranodon: {
    id: 'pteranodon',
    name: '프테라노돈',
    emoji: '🦅',
    color: '#4a4a8a',
    hp: 70,
    maxHp: 70,
    attack: 20,
    defense: 5,
    speed: 'veryfast',
    expReward: 70,
    goldReward: 55,
    width: 80,
    height: 55,
    isFlying: true,
    attacks: ['급강하', '발톱 공격', '날개 폭풍'],
    description: '하늘을 나는 공룡. 빠르지만 체력이 낮다.',
  },
  velociraptor: {
    id: 'velociraptor',
    name: '벨로시랍터',
    emoji: '🦎',
    color: '#8b4513',
    hp: 80,
    maxHp: 80,
    attack: 30,
    defense: 8,
    speed: 'veryfast',
    expReward: 85,
    goldReward: 62,
    width: 55,
    height: 65,
    attacks: ['발톱 베기', '도약 공격', '연속 베기'],
    description: '지능적이고 빠른 포식자. 연속 공격이 특기.',
  },
};

// ============================================================
// OBSTACLES DATA
// ============================================================
export const OBSTACLE_TYPES = {
  cactus: { id: 'cactus', emoji: '🌵', width: 30, height: 50, color: '#2d8a2d', name: '선인장' },
  rock: { id: 'rock', emoji: '🪨', width: 50, height: 40, color: '#808080', name: '바위' },
  tree: { id: 'tree', emoji: '🌳', width: 55, height: 70, color: '#228B22', name: '나무' },
  bush: { id: 'bush', emoji: '🌿', width: 40, height: 30, color: '#32CD32', name: '덤불' },
};

// ============================================================
// LEVEL DATA
// ============================================================
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700];

export function getLevel(exp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getExpToNextLevel(exp) {
  const level = getLevel(exp);
  if (level >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[level] - exp;
}

export function getWeightLimit(level) {
  return 10 + level * 5;
}

// ============================================================
// INITIAL PLAYER STATE
// ============================================================
export const INITIAL_PLAYER = {
  hp: 100,
  maxHp: 100,
  mp: 60,
  maxMp: 60,
  attack: 15,
  defense: 5,
  level: 1,
  exp: 0,
  gold: 100,
  ultraGauge: 0,
  maxUltraGauge: 5,
  equipment: {
    helmet: 'none',
    armor: 'none',
    weapon: 'sword',
  },
  inventory: [
    { id: 'hp_potion', quantity: 3 },
    { id: 'mp_potion', quantity: 2 },
  ],
  defeatedDinosaurs: {},
  totalDistance: 0,
};

export function calculatePlayerStats(player) {
  const helmetData = HELMETS.find(h => h.id === player.equipment.helmet) || HELMETS[0];
  const armorData = ARMORS.find(a => a.id === player.equipment.armor) || ARMORS[0];
  const weaponData = WEAPONS.find(w => w.id === player.equipment.weapon) || WEAPONS[0];

  const totalWeight = helmetData.weight + armorData.weight + weaponData.weight;
  const weightLimit = getWeightLimit(player.level);
  const isOverweight = totalWeight > weightLimit;
  const overweightRatio = isOverweight ? (totalWeight - weightLimit) / weightLimit : 0;

  const speedMultiplier = isOverweight ? Math.max(0.6, 1 - overweightRatio * 0.4) : 1;
  const jumpMultiplier = isOverweight ? Math.max(0.65, 1 - overweightRatio * 0.35) : 1;

  return {
    attack: player.attack + (weaponData.attack || 0),
    defense: player.defense + (helmetData.defense || 0) + (armorData.defense || 0),
    magic: (weaponData.magic || 0),
    mpBonus: (helmetData.mp || 0),
    speedMultiplier,
    jumpMultiplier,
    totalWeight,
    weightLimit,
    isOverweight,
    helmetData,
    armorData,
    weaponData,
  };
}
