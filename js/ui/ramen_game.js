/**
 * K-POP DEMON HUNTERS - Bonus Ramen Chef Express Minigame
 * A delightful, toddler-friendly arcade minigame to catch falling ramen ingredients.
 */

class RamenMinigame {
  constructor() {
    this.isActive = false;
    this.bowlX = 180;
    this.bowlY = 175;
    this.bowlWidth = 48;
    this.bowlHeight = 24;
    this.speed = 4.5;
    this.ingredients = [];
    this.score = 0;
    this.timeLeft = 40;
    this.animTimer = 0;
    this.spawnTimer = 0;
    this.isGameOver = false;
  }

  start() {
    this.isActive = true;
    this.isGameOver = false;
    this.score = 0;
    this.timeLeft = 40;
    this.ingredients = [];
    this.spawnTimer = 0;
    this.bowlX = 180;
  }

  update(dt, input, sfx, particles, viewportWidth = 384) {
    if (!this.isActive) return;
    this.animTimer += dt;

    if (this.isGameOver) return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.isGameOver = true;
      if (sfx) sfx.playRainbowFever();
      return;
    }

    // Move Bowl
    if (input.isLeft()) {
      this.bowlX -= this.speed * dt * 60;
    } else if (input.isRight()) {
      this.bowlX += this.speed * dt * 60;
    }

    this.bowlX = Math.max(10, Math.min(viewportWidth - this.bowlWidth - 10, this.bowlX));

    // Spawn Ingredients
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.4 + Math.random() * 0.4;
      const types = ['noodle', 'egg', 'naruto', 'chili', 'star'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      this.ingredients.push({
        x: 20 + Math.random() * (viewportWidth - 40),
        y: 10,
        vy: 1.8 + Math.random() * 1.5,
        type: chosenType,
        size: 16
      });
    }

    // Update Ingredients & Catch Collision
    const bowlBox = { x: this.bowlX, y: this.bowlY, width: this.bowlWidth, height: this.bowlHeight };

    for (let i = this.ingredients.length - 1; i >= 0; i--) {
      const item = this.ingredients[i];
      item.y += item.vy * dt * 60;

      // Check catch
      const itemBox = { x: item.x - 8, y: item.y - 8, width: 16, height: 16 };
      if (
        itemBox.x < bowlBox.x + bowlBox.width &&
        itemBox.x + itemBox.width > bowlBox.x &&
        itemBox.y < bowlBox.y + bowlBox.height &&
        itemBox.y + itemBox.height > bowlBox.y
      ) {
        // Caught!
        if (item.type === 'noodle') this.score += 10;
        if (item.type === 'egg') this.score += 25;
        if (item.type === 'naruto') this.score += 35;
        if (item.type === 'star') this.score += 50;
        if (item.type === 'chili') this.score += 100;

        if (sfx) sfx.playSlurp();
        if (particles) particles.spawnSparkleBurst(item.x, item.y, 8, '#ffe600');

        this.ingredients.splice(i, 1);
        continue;
      }

      // Fell past screen
      if (item.y > 220) {
        this.ingredients.splice(i, 1);
      }
    }
  }

  draw(ctx, spriteRenderer, viewportWidth = 384, viewportHeight = 216) {
    if (!this.isActive) return;

    ctx.save();
    // Warm Ramen Kitchen Background
    ctx.fillStyle = '#1c0e2a';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Kitchen Tiles
    ctx.fillStyle = '#2f1945';
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 12; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(c * 32, r * 32, 32, 32);
        }
      }
    }

    // Top Bar (Score & Time)
    ctx.fillStyle = 'rgba(8, 2, 18, 0.9)';
    ctx.fillRect(0, 0, viewportWidth, 24);
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(0, 23, viewportWidth, 1);

    ctx.fillStyle = '#ffe600';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText(`🍜 SCORE: ${this.score}`, 10, 15);

    ctx.fillStyle = this.timeLeft <= 10 ? '#ff0055' : '#00f0ff';
    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${Math.ceil(this.timeLeft)}S`, viewportWidth - 10, 15);
    ctx.textAlign = 'left';

    // Falling Ingredients
    for (const item of this.ingredients) {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (item.type === 'noodle') {
        ctx.fillStyle = '#fff0a3';
        ctx.fillRect(-6, -4, 12, 8);
        ctx.fillStyle = '#ffe600';
        ctx.fillRect(-4, -2, 8, 4);
      } else if (item.type === 'egg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(-3, -3, 6, 6);
      } else if (item.type === 'naruto') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#ff1493';
        ctx.fillRect(-3, -3, 6, 6);
      } else if (item.type === 'star') {
        spriteRenderer.drawStar(ctx, -8, -8, this.animTimer, 1.2);
      } else if (item.type === 'chili') {
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(-4, -6, 8, 12);
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(-2, -8, 4, 3);
      }
      ctx.restore();
    }

    // Player Catcher Ramen Bowl
    spriteRenderer.drawRamenBowl(ctx, this.bowlX, this.bowlY - 8, 'rainbow', this.animTimer, 1.8);

    // Game Over Summary
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(10, 2, 22, 0.92)';
      ctx.fillRect(40, 45, viewportWidth - 80, 125);
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 45, viewportWidth - 80, 125);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe600';
      ctx.font = "12px 'Press Start 2P', monospace";
      ctx.fillText("🍜 YUMMY BOWL COMPLETE! 🍜", viewportWidth / 2, 75);

      ctx.fillStyle = '#00f0ff';
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.fillText(`FINAL SCORE: ${this.score}`, viewportWidth / 2, 105);

      ctx.fillStyle = '#ffffff';
      ctx.font = "7px 'Press Start 2P', monospace";
      ctx.fillText("★ TAP / PRESS ANY BUTTON TO EXIT ★", viewportWidth / 2, 140);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }
}

window.RamenMinigame = RamenMinigame;
