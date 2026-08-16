/**
 * K-POP DEMON HUNTERS - Boss Battles
 * Epic, colorful retro bosses with clear telegraphs for kid-friendly gameplay.
 */

class Boss {
  constructor(x, y, type = 'dj_dokkaebi') {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.type = type; // 'troll_dj', 'troll_chef', 'troll_king', 'gwi_ma', 'dj_dokkaebi', 'ramen_fiend'
    this.width = 64;
    this.height = 64;
    this.maxHp = (type === 'troll_king' || type === 'gwi_ma' || type === 'shadow_king') ? 12 : ((type === 'troll_chef' || type === 'ramen_fiend') ? 10 : 8);
    this.hp = this.maxHp;
    this.isActive = false; // Only active once player enters boss arena
    this.facingRight = false;
    this.animTimer = 0;
    this.attackTimer = 2.5;
    this.state = 'idle'; // 'idle', 'telegraph', 'attack', 'recovering', 'defeated'
    this.attackPhase = 0;
    this.isHit = false;
    this.hitTimer = 0;
    this.telegraphTimer = 0;
    this.isDefeated = false;
    this.defeatTimer = 0;
  }

  update(dt, player, projectiles, particles, sfx, camera) {
    this.animTimer += dt;

    if (!this.isActive) return;

    if (this.isHit) {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0) this.isHit = false;
    }

    if (this.isDefeated) {
      this.defeatTimer += dt;
      if (Math.random() < 0.3 && particles) {
        particles.spawnSparkleBurst(
          this.x + Math.random() * this.width,
          this.y + Math.random() * this.height,
          10,
          '#ffe600'
        );
      }
      return;
    }

    this.facingRight = player.x > this.x;

    // Boss State Machine
    if (this.state === 'idle') {
      this.attackTimer -= dt;
      // Slight hover/pacing
      this.x = this.startX + Math.sin(this.animTimer * 2) * 40;

      if (this.attackTimer <= 0) {
        this.state = 'telegraph';
        this.telegraphTimer = 1.0; // 1-second clear warning for kids
      }

    } else if (this.state === 'telegraph') {
      this.telegraphTimer -= dt;
      if (this.telegraphTimer <= 0) {
        this.executeAttack(player, projectiles, particles, sfx, camera);
        this.state = 'attack';
        this.attackTimer = 1.5;
      }

    } else if (this.state === 'attack') {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = 'idle';
        this.attackTimer = 2.0 + Math.random() * 1.5;
      }
    }
  }

  executeAttack(player, projectiles, particles, sfx, camera) {
    if (!projectiles) return;

    if (this.type === 'dj_dokkaebi' || this.type === 'troll_dj') {
      // Attack 1: Spiked Boombox Club Shockwave & Beat Drop
      if (sfx) sfx.playBossRoar();
      if (camera) camera.shake(0.4, 6);

      const dir = player.x > this.x ? 1 : -1;
      projectiles.push(new EnemyProjectile(this.x + 20, this.y + 20, dir * 2.6, -1.2, 'note', '#00f0ff'));
      projectiles.push(new EnemyProjectile(this.x + 20, this.y + 20, dir * 3.0, 0, 'note', '#ff007f'));
      projectiles.push(new EnemyProjectile(this.x + 20, this.y + 20, dir * 2.6, 1.2, 'note', '#ffe600'));

    } else if (this.type === 'ramen_fiend' || this.type === 'troll_chef') {
      // Attack 2: Boiling Chili Rock & Spiked Chopstick Burst
      if (sfx) sfx.playBossRoar();
      if (camera) camera.shake(0.45, 7);

      const angles = [-0.45, -0.22, 0, 0.22, 0.45];
      const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);

      angles.forEach(offset => {
        const a = baseAngle + offset;
        projectiles.push(new EnemyProjectile(
          this.x + 30,
          this.y + 30,
          Math.cos(a) * 3.0,
          Math.sin(a) * 3.0,
          'fishcake',
          '#ff3300'
        ));
      });

    } else {
      // Attack 3: Emperor Troll Dark Lightning Lightshow
      if (sfx) sfx.playBossRoar();
      if (camera) camera.shake(0.55, 8);

      for (let i = -2; i <= 2; i++) {
        projectiles.push(new EnemyProjectile(
          this.x + 30,
          this.y + 10,
          i * 1.8,
          2.6,
          'star',
          '#ff007f'
        ));
      }
    }
  }

  takeDamage(amount, sfx, particles, collectibles) {
    if (this.isDefeated || !this.isActive) return;
    this.hp -= amount;
    this.isHit = true;
    this.hitTimer = 0.2;

    if (this.hp <= 0) {
      this.isDefeated = true;
      this.hp = 0;
      if (sfx) sfx.playEnemyDefeat();
      if (particles) particles.spawnSparkleBurst(this.x + 30, this.y + 30, 40, '#ffe600');

      // Giant Victory Rewards!
      if (collectibles) {
        collectibles.push(new Collectible(this.x + 10, this.y + 10, 'ramen_rainbow'));
        collectibles.push(new Collectible(this.x + 40, this.y + 10, 'chopsticks'));
        for (let i = 0; i < 5; i++) {
          collectibles.push(new Collectible(this.x + (i * 15), this.y - 20, 'star'));
        }
      }
    } else {
      if (sfx) sfx.playEnemyHit();
      if (particles) particles.spawnSparkleBurst(this.x + 30, this.y + 30, 10, '#ffffff');
    }
  }

  getHitbox() {
    return {
      x: this.x + 8,
      y: this.y + 8,
      width: this.width - 16,
      height: this.height - 16
    };
  }

  draw(ctx, spriteRenderer, camera) {
    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    // Draw Telegraph Warning Indicator for Kids
    if (this.state === 'telegraph') {
      ctx.save();
      const pulse = 1 + Math.sin(this.animTimer * 15) * 0.2;
      ctx.translate(screenX + this.width / 2, screenY - 20);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 10;
      ctx.fillRect(-12, -8, 24, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.fillText("!", -4, 5);
      ctx.restore();
    }

    spriteRenderer.drawBoss(ctx, {
      x: screenX,
      y: screenY,
      type: this.type,
      facingRight: this.facingRight,
      animTimer: this.animTimer,
      isHit: this.isHit,
      hp: this.hp,
      maxHp: this.maxHp
    }, 1.6);
  }
}

window.Boss = Boss;
