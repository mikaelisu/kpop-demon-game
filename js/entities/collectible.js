/**
 * K-POP DEMON HUNTERS - Collectible Items
 * Steaming Ramen Bowls, Stars, Golden Chopsticks, and Photocards.
 */

class Collectible {
  constructor(x, y, type = 'ramen_normal') {
    this.x = x;
    this.y = y;
    this.type = type; // 'ramen_normal', 'ramen_spicy', 'ramen_rainbow', 'star', 'chopsticks', 'photocard'
    this.width = 24;
    this.height = 24;
    this.animTimer = Math.random() * 5;
    this.collected = false;
  }

  update(dt) {
    this.animTimer += dt;
  }

  getHitbox() {
    return {
      x: this.x + 2,
      y: this.y + 2,
      width: this.width - 4,
      height: this.height - 4
    };
  }

  draw(ctx, spriteRenderer, camera) {
    if (this.collected) return;
    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    if (this.type.startsWith('ramen')) {
      const ramenType = this.type.replace('ramen_', '');
      spriteRenderer.drawRamenBowl(ctx, screenX, screenY, ramenType, this.animTimer, 1.4);
    } else if (this.type === 'star') {
      spriteRenderer.drawStar(ctx, screenX + 4, screenY + 4, this.animTimer, 1.6);
    } else if (this.type === 'chopsticks') {
      spriteRenderer.drawGoldenChopsticks(ctx, screenX + 4, screenY + 2, this.animTimer, 1.4);
    } else if (this.type === 'photocard') {
      // Glowing Idol Photocard
      ctx.save();
      const bob = Math.sin(this.animTimer * 5) * 3;
      ctx.translate(screenX + 4, screenY + bob);
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, 0, 16, 22);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 2, 12, 14);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(4, 18, 8, 2);
      ctx.restore();
    }
  }

  onCollect(player, sfx, particles) {
    if (this.collected) return;
    this.collected = true;

    if (this.type === 'ramen_normal') {
      player.heal(1);
      player.addSlurpMeter(30);
      player.score += 150;
      if (sfx) sfx.playSlurp();
      if (particles) particles.spawnRamenSlurpFX(this.x + 12, this.y + 12);
    } else if (this.type === 'ramen_spicy') {
      player.heal(2);
      player.activateSpicyMode(10);
      player.addSlurpMeter(50);
      player.score += 300;
      if (sfx) { sfx.playSlurp(); sfx.playRainbowFever(); }
      if (particles) particles.spawnRamenSlurpFX(this.x + 12, this.y + 12);
    } else if (this.type === 'ramen_rainbow') {
      player.heal(3);
      player.activateRainbowFever(12);
      player.addSlurpMeter(100);
      player.score += 500;
      if (sfx) sfx.playRainbowFever();
      if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 12, 24, '#ffe600');
    } else if (this.type === 'star') {
      player.starsCollected++;
      player.score += 100;
      player.addSlurpMeter(10);
      if (sfx) sfx.playStar();
      if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 12, 8, '#ffe600');
    } else if (this.type === 'chopsticks') {
      player.hasGoldenChopsticks = true;
      player.score += 1000;
      if (sfx) sfx.playChopsticks();
      if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 12, 20, '#ffd700');
    } else if (this.type === 'photocard') {
      player.photocardsCollected++;
      player.score += 800;
      if (sfx) sfx.playRainbowFever();
      if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 12, 20, '#ff007f');
    }
  }
}

window.Collectible = Collectible;
