/**
 * K-POP DEMON HUNTERS - Demon Enemies & Projectiles
 */

class EnemyProjectile {
  constructor(x, y, vx, vy, type = 'spark', color = '#ffe600') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'spark', 'note', 'star', 'fishcake'
    this.color = color;
    this.width = 12;
    this.height = 12;
    this.life = 4.0;
    this.animTimer = 0;
    this.isDeflected = false;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
    this.animTimer += dt;
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  draw(ctx, camera) {
    const screenX = Math.round(this.x - camera.x);
    const screenY = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    if (this.type === 'note') {
      // 8-bit Music Note
      ctx.fillRect(4, 2, 4, 4);
      ctx.fillRect(6, 6, 2, 6);
      ctx.fillRect(2, 10, 6, 4);
    } else if (this.type === 'fishcake') {
      // Spinning Naruto Shuriken
      const rot = this.animTimer * 10;
      ctx.translate(6, 6);
      ctx.rotate(rot);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = '#ff1493';
      ctx.fillRect(-3, -3, 6, 6);
    } else {
      // Fiery Star Spark
      const pulse = Math.sin(this.animTimer * 12) * 2;
      ctx.fillRect(2 - pulse / 2, 2 - pulse / 2, 8 + pulse, 8 + pulse);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 4, 4);
    }

    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, type = 'imp') {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.type = type; // 'imp', 'ghoul', 'dokkaebi', 'bat', 'dumpling'
    this.width = 28;
    this.height = 28;
    this.vx = (type === 'dokkaebi' || type === 'imp') ? -0.7 : 0;
    this.vy = 0;
    this.onGround = false;
    this.facingRight = false;
    this.animTimer = Math.random() * 5;
    this.shootTimer = 2.0 + Math.random() * 2;
    this.hp = type === 'dokkaebi' ? 2 : 1;
    this.isHit = false;
    this.hitTimer = 0;
    this.isDefeated = false;
    this.patrolDistance = 70;
  }

  update(dt, player, tilemap, projectiles, physics) {
    if (this.isDefeated) return;
    this.animTimer += dt;

    if (this.isHit) {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0) this.isHit = false;
    }

    // AI Behavior by Type
    if (this.type === 'imp') {
      // Hops back and forth, shoots occasional mini chili sparks
      if (this.x < this.startX - this.patrolDistance) {
        this.vx = 0.8;
        this.facingRight = true;
      } else if (this.x > this.startX + this.patrolDistance) {
        this.vx = -0.8;
        this.facingRight = false;
      }

      if (this.onGround && Math.random() < 0.02) {
        this.vy = -4.0; // Mini hop
        this.onGround = false;
      }

      // Shoot spark towards player if in range
      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && Math.abs(player.x - this.x) < 220) {
        this.shootTimer = 3.0 + Math.random() * 2;
        const dir = player.x > this.x ? 1 : -1;
        this.facingRight = dir > 0;
        if (projectiles) {
          projectiles.push(new EnemyProjectile(this.x + 10, this.y + 8, dir * 2.2, -0.5, 'spark', '#ff3300'));
        }
      }

      if (physics) physics.updateEntity(this, tilemap, 32);

    } else if (this.type === 'dokkaebi') {
      // Heavy goblin patrol
      if (this.x < this.startX - this.patrolDistance) {
        this.vx = 0.6;
        this.facingRight = true;
      } else if (this.x > this.startX + this.patrolDistance) {
        this.vx = -0.6;
        this.facingRight = false;
      }

      if (physics) physics.updateEntity(this, tilemap, 32);

    } else if (this.type === 'ghoul') {
      // Floating lightstick ghost (Sine wave path)
      this.x += Math.sin(this.animTimer * 1.5) * 1.0;
      this.y = this.startY + Math.sin(this.animTimer * 3) * 20;
      this.facingRight = player.x > this.x;

      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && Math.abs(player.x - this.x) < 200) {
        this.shootTimer = 3.5;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        if (projectiles) {
          projectiles.push(new EnemyProjectile(this.x + 10, this.y + 10, Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 'star', '#00f0ff'));
        }
      }

    } else if (this.type === 'bat') {
      // Swoops down when player passes underneath
      const dx = player.x - this.x;
      if (Math.abs(dx) < 90 && player.y > this.y && this.vy === 0) {
        this.vy = 2.5;
        this.vx = dx > 0 ? 1.5 : -1.5;
        this.facingRight = this.vx > 0;
      }

      this.x += this.vx;
      this.y += this.vy;

      if (this.y > this.startY + 100) {
        this.vy = -1.5; // Return up
      } else if (this.y <= this.startY && this.vy < 0) {
        this.y = this.startY;
        this.vy = 0;
        this.vx = 0;
      }

    } else if (this.type === 'dumpling') {
      // Squishy bouncing fiend
      if (this.onGround) {
        this.vy = -3.5;
        this.onGround = false;
      }
      if (this.x < this.startX - 40) this.vx = 0.5;
      if (this.x > this.startX + 40) this.vx = -0.5;

      if (physics) physics.updateEntity(this, tilemap, 32);
    }
  }

  getHitbox() {
    return {
      x: this.x + 4,
      y: this.y + 4,
      width: this.width - 8,
      height: this.height - 8
    };
  }

  takeDamage(amount, sfx, particles, collectibles) {
    if (this.isDefeated) return;
    this.hp -= amount;
    this.isHit = true;
    this.hitTimer = 0.15;

    if (this.hp <= 0) {
      this.isDefeated = true;
      if (sfx) sfx.playEnemyDefeat();
      if (particles) particles.spawnSparkleBurst(this.x + 14, this.y + 14, 16, '#ffe600');

      // Chance to drop steaming ramen bowl or star!
      if (collectibles) {
        const rand = Math.random();
        if (rand < 0.4) {
          collectibles.push(new Collectible(this.x, this.y, 'ramen_normal'));
        } else if (rand < 0.55) {
          collectibles.push(new Collectible(this.x, this.y, 'ramen_spicy'));
        } else {
          collectibles.push(new Collectible(this.x, this.y, 'star'));
        }
      }
    } else {
      if (sfx) sfx.playEnemyHit();
      if (particles) particles.spawnSparkleBurst(this.x + 14, this.y + 14, 6, '#ffffff');
    }
  }

  draw(ctx, spriteRenderer, camera) {
    if (this.isDefeated) return;
    spriteRenderer.drawEnemy(ctx, {
      x: this.x - camera.x,
      y: this.y - camera.y,
      type: this.type,
      facingRight: this.facingRight,
      animTimer: this.animTimer,
      isHit: this.isHit
    }, 1.4);
  }
}

window.EnemyProjectile = EnemyProjectile;
window.Enemy = Enemy;
