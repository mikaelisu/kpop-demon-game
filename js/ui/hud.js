/**
 * K-POP DEMON HUNTERS - 8-Bit Retro HUD
 */

class HUD {
  constructor() {
    this.animTimer = 0;
  }

  update(dt) {
    this.animTimer += dt;
  }

  draw(ctx, player, levelManager, spriteRenderer, viewportWidth = 384, viewportHeight = 216) {
    ctx.save();

    // 1. Top HUD Background Bar
    ctx.fillStyle = 'rgba(8, 2, 18, 0.85)';
    ctx.fillRect(0, 0, viewportWidth, 24);
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(0, 23, viewportWidth, 1);

    // 2. Health Hearts
    for (let i = 0; i < player.maxHp; i++) {
      const isFull = i < player.hp;
      spriteRenderer.drawHeart(ctx, 8 + i * 16, 4, isFull, 1.8);
    }

    // 3. Steaming Ramen Slurp Meter
    const slurpX = 80;
    const slurpY = 6;
    const slurpWidth = 70;
    const slurpHeight = 12;

    // Slurp Meter Container
    ctx.fillStyle = '#110022';
    ctx.fillRect(slurpX, slurpY, slurpWidth, slurpHeight);
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 1;
    ctx.strokeRect(slurpX, slurpY, slurpWidth, slurpHeight);

    // Slurp Fill Progress
    const fillWidth = Math.max(0, (player.slurpMeter / player.maxSlurpMeter) * (slurpWidth - 2));
    const isFullSlurp = player.slurpMeter >= 50;

    if (isFullSlurp) {
      // Pulsing Neon Glow when ready
      const pulseColor = Math.floor(this.animTimer * 8) % 2 === 0 ? '#ff007f' : '#ffe600';
      ctx.fillStyle = pulseColor;
      ctx.fillRect(slurpX + 1, slurpY + 1, fillWidth, slurpHeight - 2);

      // Flashing text
      ctx.fillStyle = '#ffffff';
      ctx.font = "6px 'Press Start 2P', monospace";
      ctx.fillText("SLURP!", slurpX + 16, slurpY + 9);
    } else {
      ctx.fillStyle = '#ff6b00';
      ctx.fillRect(slurpX + 1, slurpY + 1, fillWidth, slurpHeight - 2);
    }

    // Ramen Icon beside meter
    spriteRenderer.drawRamenBowl(ctx, slurpX - 16, slurpY - 4, player.spicyTimer > 0 ? 'spicy' : (player.rainbowFeverTimer > 0 ? 'rainbow' : 'normal'), this.animTimer, 0.9);

    // 4. Stars & Golden Chopsticks Count
    spriteRenderer.drawStar(ctx, 165, 4, this.animTimer, 1.2);
    ctx.fillStyle = '#ffffff';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText(`x${player.starsCollected}`, 180, 15);

    if (player.hasGoldenChopsticks) {
      spriteRenderer.drawGoldenChopsticks(ctx, 215, 2, this.animTimer, 1.0);
    }

    // 5. Score
    ctx.fillStyle = '#00f0ff';
    ctx.font = "8px 'Press Start 2P', monospace";
    const scoreStr = String(player.score).padStart(6, '0');
    ctx.fillText(`PTS ${scoreStr}`, viewportWidth - 95, 15);

    // 6. Boss Health Bar (if active)
    if (levelManager.boss && levelManager.isArenaLocked && !levelManager.boss.isDefeated) {
      const boss = levelManager.boss;
      const bBarWidth = 140;
      const bBarHeight = 10;
      const bX = (viewportWidth - bBarWidth) / 2;
      const bY = viewportHeight - 18;

      ctx.fillStyle = 'rgba(10, 0, 20, 0.9)';
      ctx.fillRect(bX - 4, bY - 12, bBarWidth + 8, bBarHeight + 16);
      ctx.strokeStyle = '#ff007f';
      ctx.strokeRect(bX - 4, bY - 12, bBarWidth + 8, bBarHeight + 16);

      // Boss Name
      ctx.fillStyle = '#ffe600';
      ctx.font = "7px 'Press Start 2P', monospace";
      const bName = (boss.type === 'gwi_ma' || boss.type === 'shadow_king') ? 'GWI-MA (DEMON KING)' : (boss.type === 'ramen_fiend' ? 'GIANT RAMEN FIEND' : 'DJ DOKKAEBI');
      ctx.fillText(bName, bX + 4, bY - 3);

      // HP Fill
      const hpFill = Math.max(0, (boss.hp / boss.maxHp) * bBarWidth);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(bX, bY, hpFill, bBarHeight);
    }

    // 7. Stage Clear Celebratory Banner
    if (levelManager.isStageCleared) {
      ctx.fillStyle = 'rgba(15, 0, 35, 0.92)';
      ctx.fillRect(20, viewportHeight / 2 - 35, viewportWidth - 40, 70);
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, viewportHeight / 2 - 35, viewportWidth - 40, 70);

      ctx.fillStyle = '#ffe600';
      ctx.font = "12px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.fillText("⭐ STAGE CLEAR! ⭐", viewportWidth / 2, viewportHeight / 2 - 12);

      ctx.fillStyle = '#00f0ff';
      ctx.font = "8px 'Press Start 2P', monospace";
      ctx.fillText("K-POP DEMON HUNTER VICTORY!", viewportWidth / 2, viewportHeight / 2 + 6);
      ctx.fillStyle = '#ff77bb';
      ctx.fillText("🍜 MORE RAMEN AWAITS! 🍜", viewportWidth / 2, viewportHeight / 2 + 22);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }
}

window.HUD = HUD;
