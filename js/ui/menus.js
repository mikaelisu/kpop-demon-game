/**
 * K-POP DEMON HUNTERS - Menus & UI System
 * Title screen, character selection, stage select, toddler assist settings, and victory concert.
 */

class MenuManager {
  constructor() {
    this.currentScreen = 'title'; // 'title', 'character_select', 'stage_select', 'assist_settings', 'pause', 'game_over', 'game_win'
    this.selectedCharIndex = 0;
    this.selectedStageIndex = 0;
    this.menuSelection = 0;
    this.animTimer = 0;

    this.characters = [
      { id: 'luna', name: 'LUNA', title: 'MOONLIGHT BLADE', color: '#00f0ff', sword: 'Cyan Glow Katana', desc: 'Fast & Agile! Slashes through demons with graceful neon crescent arcs.' },
      { id: 'minho', name: 'MINHO', title: 'FLAME BEAT', color: '#ffaa00', sword: 'Golden Glow Greatsword', desc: 'Powerful ground slams & spicy ramen shockwaves!' },
      { id: 'hana', name: 'HANA', title: 'STAR POP', color: '#ff1493', sword: 'Twin Neon Star Daggers', desc: 'High-speed spinning star slashes with sparkling K-Pop magic.' },
      { id: 'felix', name: 'FELIX', title: 'THUNDER RHYTHM', color: '#cc00ff', sword: 'Violet Lightning Blade', desc: 'Acrobatic somersaults and lightning wall kicks!' }
    ];
  }

  update(dt) {
    this.animTimer += dt;
  }

  draw(ctx, spriteRenderer, player, viewportWidth = 384, viewportHeight = 216) {
    ctx.save();

    if (this.currentScreen === 'title') {
      this.drawTitleScreen(ctx, spriteRenderer, viewportWidth, viewportHeight);
    } else if (this.currentScreen === 'character_select') {
      this.drawCharacterSelect(ctx, spriteRenderer, viewportWidth, viewportHeight);
    } else if (this.currentScreen === 'stage_select') {
      this.drawStageSelect(ctx, spriteRenderer, viewportWidth, viewportHeight);
    } else if (this.currentScreen === 'assist_settings') {
      this.drawAssistSettings(ctx, player, viewportWidth, viewportHeight);
    } else if (this.currentScreen === 'pause') {
      this.drawPauseMenu(ctx, viewportWidth, viewportHeight);
    } else if (this.currentScreen === 'game_over') {
      this.drawGameOver(ctx, spriteRenderer, viewportWidth, viewportHeight);
    } else if (this.currentScreen === 'game_win') {
      this.drawGameWin(ctx, spriteRenderer, viewportWidth, viewportHeight);
    }

    ctx.restore();
  }

  // =========================================================================
  // TITLE SCREEN
  // =========================================================================
  drawTitleScreen(ctx, spriteRenderer, width, height) {
    // Cyberpunk Gradient
    ctx.fillStyle = '#060112';
    ctx.fillRect(0, 0, width, height);

    // Neon City Background Glow
    ctx.fillStyle = '#16082c';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 55 - 10, height - 70 - (i % 3) * 20, 50, 80);
    }

    // Floating Stars & Ramen
    for (let i = 0; i < 6; i++) {
      const sx = (i * 70 + this.animTimer * 15) % width;
      const sy = 30 + Math.sin(this.animTimer * 2 + i) * 12;
      spriteRenderer.drawStar(ctx, sx, sy, this.animTimer, 1.2);
    }

    // Big Glowing Logo
    ctx.textAlign = 'center';
    
    // Sub-banner
    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText("★ 8-BIT RETRO ACTION PLATFORMER ★", width / 2, 36);

    // Title Lines
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 12;
    ctx.font = "18px 'Press Start 2P', monospace";
    ctx.fillText("K-POP DEMON", width / 2, 62);

    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ffe600';
    ctx.fillText("HUNTERS", width / 2, 86);

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText("🍜 8-BIT RAMEN RUSH ⚔️", width / 2, 106);

    // 4 Idols Hopping Together
    const idols = ['luna', 'minho', 'hana', 'felix'];
    idols.forEach((id, idx) => {
      const hop = Math.abs(Math.sin(this.animTimer * 5 + idx)) * 6;
      spriteRenderer.drawPlayer(ctx, {
        x: width / 2 - 90 + idx * 48,
        y: 120 - hop,
        charId: id,
        state: 'idle',
        facingRight: true,
        animTimer: this.animTimer,
        combo: 1,
        spicyMode: false,
        rainbowFever: idx === 0,
        invincibleTimer: 0
      }, 1.2);
    });

    // Tap to Play Prompt
    const pulse = Math.floor(this.animTimer * 4) % 2 === 0;
    if (pulse) {
      ctx.fillStyle = '#00f0ff';
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.fillText("▶ TAP / PRESS START TO PLAY ◀", width / 2, 178);
    }

    // Small instructions
    ctx.fillStyle = '#a89bb9';
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.fillText("TOUCH SCREEN • KEYBOARD (WASD/Z/X/C) • GAMEPAD", width / 2, 198);
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // CHARACTER SELECT
  // =========================================================================
  drawCharacterSelect(ctx, spriteRenderer, width, height) {
    ctx.fillStyle = '#09021a';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe600';
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.fillText("SELECT YOUR IDOL HUNTER", width / 2, 28);

    const char = this.characters[this.selectedCharIndex];

    // Character Card Frame
    const cardX = 35;
    const cardY = 42;
    const cardW = width - 70;
    const cardH = 135;

    ctx.fillStyle = 'rgba(25, 10, 45, 0.9)';
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.strokeStyle = char.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    // Large Animated Player Sprite Preview
    spriteRenderer.drawPlayer(ctx, {
      x: cardX + 25,
      y: cardY + 28,
      charId: char.id,
      state: 'attack',
      facingRight: true,
      animTimer: this.animTimer,
      combo: (Math.floor(this.animTimer * 2) % 3) + 1,
      spicyMode: false,
      rainbowFever: false,
      invincibleTimer: 0
    }, 2.5);

    // Name & Title
    ctx.textAlign = 'left';
    ctx.fillStyle = char.color;
    ctx.font = "13px 'Press Start 2P', monospace";
    ctx.fillText(char.name, cardX + 115, cardY + 28);

    ctx.fillStyle = '#ffe600';
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.fillText(char.title, cardX + 115, cardY + 44);

    ctx.fillStyle = '#ffffff';
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.fillText(`WEAPON: ${char.sword}`, cardX + 115, cardY + 62);

    // Description text wrapped
    ctx.fillStyle = '#c0b2d6';
    ctx.fillText(char.desc, cardX + 115, cardY + 80);

    // Navigation indicators
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText("◀ PREV (A/LEFT)   NEXT (D/RIGHT) ▶", width / 2, cardY + 118);

    ctx.fillStyle = '#ffe600';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText("★ PRESS ATTACK / TAP TO CONFIRM ★", width / 2, height - 14);
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // STAGE SELECT
  // =========================================================================
  drawStageSelect(ctx, spriteRenderer, width, height) {
    ctx.fillStyle = '#080116';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.fillText("SELECT STAGE", width / 2, 26);

    const stages = window.STAGES_DATA;
    const stage = stages[this.selectedStageIndex];

    const boxX = 40;
    const boxY = 40;
    const boxW = width - 80;
    const boxH = 135;

    ctx.fillStyle = 'rgba(20, 10, 40, 0.9)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Stage Name & Number
    ctx.fillStyle = '#ffe600';
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText(stage.name, width / 2, boxY + 30);

    // Stage Icon / Mini Tile Preview
    for (let c = 0; c < 6; c++) {
      spriteRenderer.drawTile(ctx, 1, boxX + 45 + c * 32, boxY + 50, stage.stageType, 2);
    }
    spriteRenderer.drawRamenBowl(ctx, boxX + 60, boxY + 40, 'normal', this.animTimer, 1.2);
    spriteRenderer.drawEnemy(ctx, {
      x: boxX + 160,
      y: boxY + 35,
      type: stage.id === 3 ? 'dumpling' : (stage.id === 2 ? 'ghoul' : 'imp'),
      facingRight: false,
      animTimer: this.animTimer,
      isHit: false
    }, 1.4);

    ctx.fillStyle = '#ffffff';
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.fillText(`BOSS: ${stage.bossType.toUpperCase().replace('_', ' ')}`, width / 2, boxY + 95);

    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText("◀ PREV   NEXT ▶", width / 2, boxY + 118);

    ctx.fillStyle = '#ffe600';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText("★ TAP / PRESS ATTACK TO START STAGE ★", width / 2, height - 14);
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // TODDLER / ASSIST SETTINGS
  // =========================================================================
  drawAssistSettings(ctx, player, width, height) {
    ctx.fillStyle = '#0a0218';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#39ff14';
    ctx.font = "11px 'Press Start 2P', monospace";
    ctx.fillText("👶 KID & TODDLER ASSIST MODE 👶", width / 2, 28);

    const boxX = 30;
    const boxY = 44;
    const boxW = width - 60;
    const boxH = 130;

    ctx.fillStyle = 'rgba(20, 15, 35, 0.9)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#39ff14';
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.textAlign = 'left';
    ctx.font = "8px 'Press Start 2P', monospace";

    // Toggle 1: Invincibility (Star Bounce)
    ctx.fillStyle = '#ffffff';
    ctx.fillText("1. PLAYFUL INVINCIBILITY:", boxX + 15, boxY + 30);
    ctx.fillStyle = player.assistInvincible ? '#39ff14' : '#ff0055';
    ctx.fillText(player.assistInvincible ? "[ON - NEVER LOSE HEARTS!]" : "[OFF - NORMAL HEARTS]", boxX + 25, boxY + 44);

    // Toggle 2: Auto-Jump
    ctx.fillStyle = '#ffffff';
    ctx.fillText("2. BOUNCY RAMEN SPRINGS:", boxX + 15, boxY + 70);
    ctx.fillStyle = '#ffe600';
    ctx.fillText("[ACTIVE - HIGH SPRING JUMPS]", boxX + 25, boxY + 84);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText("PRESS (Z/TAP) TO TOGGLE • (X) BACK", width / 2, height - 16);
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // PAUSE MENU
  // =========================================================================
  drawPauseMenu(ctx, width, height) {
    ctx.fillStyle = 'rgba(6, 1, 15, 0.85)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe600';
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillText("PAUSED", width / 2, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText("▶ TAP / PRESS (P) TO RESUME ◀", width / 2, 105);
    ctx.fillText("★ PRESS (X) TO RETURN TO TITLE ★", width / 2, 130);
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // GAME OVER / TRY AGAIN
  // =========================================================================
  drawGameOver(ctx, spriteRenderer, width, height) {
    ctx.fillStyle = 'rgba(12, 2, 20, 0.92)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff77bb';
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillText("GREAT TRY!", width / 2, 55);

    spriteRenderer.drawRamenBowl(ctx, width / 2 - 16, 75, 'normal', this.animTimer, 2.0);

    ctx.fillStyle = '#ffe600';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText("SLURP MORE RAMEN & CONTINUE!", width / 2, 135);

    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText("★ TAP / PRESS ANY BUTTON TO RESPAWN ★", width / 2, 165);
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // GAME WIN / GRAND CONCERT FINALE
  // =========================================================================
  drawGameWin(ctx, spriteRenderer, width, height) {
    ctx.fillStyle = '#090118';
    ctx.fillRect(0, 0, width, height);

    // Concert Stage Lighting
    ctx.fillStyle = '#ffe600';
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText("★ CONCERT VICTORY! ★", width / 2, 35);

    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText("ALL DEMONS PURIFIED WITH K-POP & RAMEN!", width / 2, 55);

    // All 4 Idols Dancing on Stage
    const idols = ['luna', 'minho', 'hana', 'felix'];
    idols.forEach((id, idx) => {
      const hop = Math.abs(Math.sin(this.animTimer * 6 + idx)) * 8;
      spriteRenderer.drawPlayer(ctx, {
        x: width / 2 - 90 + idx * 48,
        y: 100 - hop,
        charId: id,
        state: 'victory',
        facingRight: true,
        animTimer: this.animTimer,
        combo: 1,
        spicyMode: false,
        rainbowFever: true,
        invincibleTimer: 0
      }, 1.5);
    });

    ctx.fillStyle = '#ff007f';
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText("🍜 THANK YOU FOR PLAYING! 🍜", width / 2, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.fillText("TAP OR PRESS ANY BUTTON FOR MAIN MENU", width / 2, 185);
    ctx.textAlign = 'left';
  }
}

window.MenuManager = MenuManager;
