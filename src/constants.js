// Constants used throughout the app

export const MAP_CONFIG = {
  AmbroseValley: { scale: 900, originX: -370, originZ: -473, label: 'Ambrose Valley' },
  GrandRift:     { scale: 581, originX: -290, originZ: -290, label: 'Grand Rift' },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500, label: 'Lockdown' },
};

export const MAP_IMAGES = {
  AmbroseValley: '/maps/AmbroseValley_Minimap.png',
  GrandRift:     '/maps/GrandRift_Minimap.png',
  Lockdown:      '/maps/Lockdown_Minimap.jpg',
};

export const EVENT_COLORS = {
  Kill:          '#f97316',
  BotKill:       '#fb923c',
  Killed:        '#ef4444',
  BotKilled:     '#f87171',
  KilledByStorm: '#a855f7',
  Loot:          '#22c55e',
  Position:      'rgba(96,165,250,0.5)',
  BotPosition:   'rgba(245,158,11,0.5)',
};

export const EVENT_LABELS = {
  Kill:          'Player Kill',
  BotKill:       'Bot Kill',
  Killed:        'Player Death',
  BotKilled:     'Bot Death',
  KilledByStorm: 'Storm Death',
  Loot:          'Loot',
};

export const EVENT_ICONS = {
  Kill:          '💀',
  BotKill:       '🤖',
  Killed:        '☠️',
  BotKilled:     '🦾',
  KilledByStorm: '⚡',
  Loot:          '📦',
};

export const HEATMAP_TYPES = [
  { key: 'kills',       label: 'Kill Zones',    color: '#f97316' },
  { key: 'deaths',      label: 'Death Zones',   color: '#ef4444' },
  { key: 'positions',   label: 'Traffic',       color: '#6366f1' },
  { key: 'storm_deaths',label: 'Storm Deaths',  color: '#a855f7' },
  { key: 'loot',        label: 'Loot Hotspots', color: '#22c55e' },
];

export const DAYS = ['February_10', 'February_11', 'February_12', 'February_13', 'February_14'];
export const DAY_LABELS = {
  February_10: 'Feb 10',
  February_11: 'Feb 11',
  February_12: 'Feb 12',
  February_13: 'Feb 13',
  February_14: 'Feb 14',
};
