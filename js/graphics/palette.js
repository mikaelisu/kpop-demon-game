/**
 * K-POP DEMON HUNTERS - Palette & Color Definitions
 * Authentic NES 2C02 54-Color Hardware Palette + Cyber Neon Glow Extensions
 */

const NES_PALETTE = [
  // Row 0 ($00-$0F): Grays, deep blues, purples, dark greens, browns
  '#666666', '#002A88', '#1412A7', '#3B00A4', '#5C007E', '#6E0040', '#6C0600', '#561D00',
  '#333500', '#0B4800', '#005200', '#004F08', '#00404D', '#000000', '#000000', '#000000',

  // Row 1 ($10-$1F): Medium tones, bright blues, magentas, oranges, vibrant greens
  '#ADADAD', '#155FD9', '#4240FF', '#7527FE', '#A01ACC', '#B71E7B', '#B53120', '#994E00',
  '#6B6D00', '#388700', '#0C9300', '#008F32', '#007C8D', '#000000', '#000000', '#000000',

  // Row 2 ($20-$2F): Highlights, pastel blues, pinks, yellows, lime greens, cyans
  '#FFFFFF', '#64B0FF', '#9290FF', '#C676FF', '#F36AFF', '#FE6ECC', '#FE8176', '#E59E30',
  '#B5BF00', '#7CDA00', '#4EE400', '#3DDC68', '#38CDDF', '#4F4F4F', '#000000', '#000000',

  // Row 3 ($30-$3F): Super bright pastels / whites
  '#FFFFFF', '#C0E0FF', '#D3D2FF', '#E8C8FF', '#FBC2FF', '#FEC4EA', '#FECCC5', '#F7D8A5',
  '#E4E794', '#CEF292', '#B9F791', '#B3F5BC', '#B1EFEF', '#B8B8B8', '#000000', '#000000'
];

// Special Cyber K-Pop & Ramen Glow Palette
const GLOW_PALETTE = {
  // Luna (Moonlight Agility)
  LUNA_HAIR: '#ff77bb',
  LUNA_OUTFIT_1: '#ffffff',
  LUNA_OUTFIT_2: '#00f0ff',
  LUNA_SWORD: '#00f0ff',
  LUNA_AURA: 'rgba(0, 240, 255, 0.6)',

  // Minho (Flame Beat Power)
  MINHO_HAIR: '#332211',
  MINHO_OUTFIT_1: '#ff4400',
  MINHO_OUTFIT_2: '#222222',
  MINHO_SWORD: '#ffaa00',
  MINHO_AURA: 'rgba(255, 170, 0, 0.6)',

  // Hana (Star Pop Magic)
  HANA_HAIR: '#ffdd00',
  HANA_OUTFIT_1: '#ff007f',
  HANA_OUTFIT_2: '#ffffff',
  HANA_SWORD: '#ff1493',
  HANA_AURA: 'rgba(255, 20, 147, 0.6)',

  // Felix (Thunder Rhythm Acrobat)
  FELIX_HAIR: '#88ddff',
  FELIX_OUTFIT_1: '#9900ff',
  FELIX_OUTFIT_2: '#111122',
  FELIX_SWORD: '#cc00ff',
  FELIX_AURA: 'rgba(204, 0, 255, 0.6)',

  // Ramen & Powerups
  RAMEN_BOWL: '#d22d2d',
  RAMEN_BROTH: '#e69926',
  RAMEN_NOODLE: '#fff0a3',
  RAMEN_EGG: '#ffffff',
  RAMEN_YOLK: '#ffaa00',
  RAMEN_NARUTO_WHITE: '#ffffff',
  RAMEN_NARUTO_PINK: '#ff1493',
  RAMEN_NORI: '#1c2b18',
  RAMEN_STEAM: '#ffffff',
  GOLD_CHOPSTICKS: '#ffd700',

  // Demons
  IMP_BODY: '#e63946',
  IMP_HORN: '#ffe600',
  GHOUL_BODY: '#90e0ef',
  GHOUL_LIGHTSTICK: '#ff007f',
  DOKKAEBI_SKIN: '#38b000',
  DOKKAEBI_PANTS: '#ffaa00',
  BAT_WING: '#7209b7',
  SLIME_GREEN: '#55ff55',

  // Bosses
  DJ_DOKKAEBI: '#2a9d8f',
  RAMEN_FIEND: '#e76f51',
  SHADOW_KING: '#480ca8',
  NEON_GOLD: '#ffe600',
  NEON_CYAN: '#00f0ff',
  NEON_MAGENTA: '#ff007f'
};

window.NES_PALETTE = NES_PALETTE;
window.GLOW_PALETTE = GLOW_PALETTE;
