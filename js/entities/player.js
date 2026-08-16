/**
 * K-POP DEMON HUNTERS - Player Entity (Idol Demon Hunter)
 */

class Player {
  constructor(charId = 'rumi') {
    this.charId = charId; // 'rumi', 'mira', 'zoey', 'jinu'
    this.x = 60;
    this.y = 120;
    this.width = 28;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;

    // Movement speeds
    this.speed = 3.4;
    this.jumpForce = -8.5; // High, crisp, responsive jump!
    this.facingRight = true;
    this.state = 'idle'; // 'idle', 'run', 'jump', 'fall', 'wall_cling', 'attack', 'slurp', 'hurt', 'victory'

    // Health & Stats
    this.maxHp = 4;
    this.hp = this.maxHp;
    this.slurpMeter = 30; // 0 - 100
    this.maxSlurpMeter = 100;
    this.score = 0;
    this.starsCollected = 0;
    this.photocardsCollected = 0;
    this.hasGoldenChopsticks = false;

    // Timers & Buffs
    this.animTimer = 0;
    this.attackTimer = 0;
    this.attackBufferTimer = 0;
    this.combo = 1;
    this.comboResetTimer = 0;
    this.invincibleTimer = 0;
    this.spicyTimer = 0;
    this.rainbowFeverTimer = 0;
    this.slurpAnimTimer = 0;

    // Platforming Helpers (Kid-Friendly Ninja Gaiden feel)
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.touchingWallLeft = false;
    this.touchingWallRight = false;
    this.wallClingDir = 0;

    // Toddler / Assist Mode
    this.assistInvincible = true; // Default ON for 4-year-olds!
    this.assistAutoJump = false;
  }

  setCharacter(charId) {
    this.charId = charId;
  }

  update(dt, input, physics, tilemap, sfx, particles, camera, playerProjectiles) {
    this.animTimer += dt;

    // Update Timers
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) this.combo = 1;
    }
    if (this.spicyTimer > 0) this.spicyTimer -= dt;
    if (this.rainbowFeverTimer > 0) this.rainbowFeverTimer -= dt;

    // Coyote Time & Jump Buffering
    if (this.onGround) {
      this.coyoteTimer = 0.22; // 0.22s Coyote Time
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    if (input.justJump() || (input.isJump() && this.onGround && this.vy >= 0)) {
      this.jumpBufferTimer = 0.22;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Attack Input Buffering
    if (input.justAttack() || input.isAttack()) {
      this.attackBufferTimer = 0.25;
    } else if (this.attackBufferTimer > 0) {
      this.attackBufferTimer -= dt;
    }

    // Slurp Super Animation
    if (this.state === 'slurp') {
      this.slurpAnimTimer -= dt;
      this.vx = 0;
      if (this.slurpAnimTimer <= 0) {
        this.state = 'idle';
      }
      return;
    }

    // Victory Pose
    if (this.state === 'victory') {
      this.vx = 0;
      if (physics) physics.updateEntity(this, tilemap, 32);
      return;
    }

    // Check Slurp Special Button
    if (input.justSlurp() && this.slurpMeter >= 50) {
      this.triggerSlurpSuper(sfx, particles, camera, playerProjectiles);
      return;
    }

    // Horizontal Movement
    let moveDir = 0;
    if (input.isLeft()) {
      moveDir = -1;
      this.facingRight = false;
    } else if (input.isRight()) {
      moveDir = 1;
      this.facingRight = true;
    }

    const currentSpeed = this.rainbowFeverTimer > 0 ? this.speed * 1.4 : this.speed;
    this.vx = moveDir * currentSpeed;

    // Wall Cling Check (Ninja Gaiden style)
    if (!this.onGround && ((this.touchingWallLeft && input.isLeft()) || (this.touchingWallRight && input.isRight()))) {
      this.state = 'wall_cling';
      this.vy = Math.min(this.vy, 1.2); // Slow wall slide
      this.wallClingDir = this.touchingWallLeft ? -1 : 1;
    }

    // Jump & Wall Kick (Instant, smooth, forgiving)
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0 || this.onGround) {
        // Normal Jump
        this.vy = this.jumpForce;
        this.onGround = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.state = 'jump';
        if (sfx) sfx.playJump();
      } else if (this.state === 'wall_cling') {
        // Ninja Wall Kick!
        this.vy = this.jumpForce * 0.95;
        this.vx = -this.wallClingDir * this.speed * 1.3;
        this.facingRight = this.wallClingDir < 0;
        this.state = 'jump';
        this.jumpBufferTimer = 0;
        if (sfx) sfx.playWallKick();
        if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 20, 8, '#00f0ff');
      }
    }

    // Execute Buffered Attack / Glowing Sword Slash
    if (this.attackBufferTimer > 0 && this.attackTimer <= 0 && this.state !== 'slurp') {
      this.executeAttack(sfx, particles, playerProjectiles);
      this.attackBufferTimer = 0;
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0 && this.state === 'attack') {
        this.state = this.onGround ? (this.vx !== 0 ? 'run' : 'idle') : 'jump';
      }
    }

    // Determine General State
    if (this.attackTimer <= 0 && this.state !== 'wall_cling') {
      if (!this.onGround) {
        this.state = this.vy < 0 ? 'jump' : 'fall';
      } else {
        this.state = this.vx !== 0 ? 'run' : 'idle';
      }
    }

    // Apply Physics
    if (physics) {
      physics.updateEntity(this, tilemap, 32);
    }
  }

  executeAttack(sfx, particles, playerProjectiles) {
    this.state = 'attack';
    this.attackTimer = 0.18; // Fast, snappy 0.18s combo slash

    const swordColor = this.getSwordColor();
    if (sfx) sfx.playSlash(this.combo);
    if (particles) particles.spawnSlashTrail(this.x, this.y, swordColor, this.facingRight, this.combo);

    // Spicy Mode Fire Wave Projectile
    if (this.spicyTimer > 0 && playerProjectiles) {
      const dir = this.facingRight ? 1 : -1;
      playerProjectiles.push(new PlayerSlashWave(this.x + (this.facingRight ? 26 : -12), this.y + 4, dir * 5.5, '#ff3300'));
    }

    // Cycle 3-hit K-Pop combo
    this.combo = (this.combo % 3) + 1;
    this.comboResetTimer = 0.8;
  }

  triggerSlurpSuper(sfx, particles, camera, playerProjectiles) {
    this.slurpMeter = 0;
    this.state = 'slurp';
    this.slurpAnimTimer = 0.5;
    this.heal(1);
    this.activateRainbowFever(8);

    if (sfx) { sfx.playSlurp(); sfx.playRainbowFever(); }
    if (camera) camera.shake(0.4, 6);
    if (particles) {
      particles.spawnRamenSlurpFX(this.x + 14, this.y + 10);
      particles.spawnSparkleBurst(this.x + 14, this.y + 10, 30, '#ffe600');
    }

    // Spawn 360 Idol Sparkle Shockwave
    if (playerProjectiles) {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        playerProjectiles.push(new PlayerSlashWave(
          this.x + 10,
          this.y + 10,
          Math.cos(angle) * 4.5,
          '#00f0ff',
          Math.sin(angle) * 4.5
        ));
      }
    }
  }

  getSwordColor() {
    if (this.spicyTimer > 0) return '#ff3300';
    if (this.rainbowFeverTimer > 0) return '#ffe600';
    if (this.charId === 'mira' || this.charId === 'minho') return '#ffaa00';
    if (this.charId === 'zoey' || this.charId === 'hana') return '#ff1493';
    if (this.charId === 'jinu' || this.charId === 'felix') return '#cc00ff';
    return '#00f0ff'; // Rumi cyan
  }

  getSwordHitbox() {
    if (this.state !== 'attack') return null;
    const width = 58;
    const height = 48;
    const x = this.facingRight ? this.x + 6 : this.x - width + 22;
    const y = this.y - 6;
    return { x, y, width, height };
  }

  getHitbox() {
    return {
      x: this.x + 4,
      y: this.y + 4,
      width: this.width - 8,
      height: this.height - 4
    };
  }

  takeDamage(amount, sfx, particles) {
    if (this.invincibleTimer > 0 || this.rainbowFeverTimer > 0) return;

    if (this.assistInvincible) {
      // Toddler Mode: Just a playful star bounce, never loses hearts!
      this.vy = -6.0;
      this.invincibleTimer = 1.0;
      if (sfx) sfx.playBounce();
      if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 12, 12, '#00f0ff');
      return;
    }

    this.hp -= amount;
    this.invincibleTimer = 1.5;
    this.vy = -4.5;
    this.vx = this.facingRight ? -2.5 : 2.5;

    if (sfx) sfx.playPlayerHurt();
    if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 12, 10, '#ff0055');
  }

  bounceOnEnemy(sfx, particles) {
    this.vy = -7.5; // Springy high bounce
    this.onGround = false;
    if (sfx) sfx.playBounce();
    if (particles) particles.spawnSparkleBurst(this.x + 14, this.y + 30, 8, '#ffe600');
  }

  onSpringBounce() {
    this.state = 'jump';
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addSlurpMeter(amount) {
    this.slurpMeter = Math.min(this.maxSlurpMeter, this.slurpMeter + amount);
  }

  activateSpicyMode(duration = 10) {
    this.spicyTimer = duration;
  }

  activateRainbowFever(duration = 12) {
    this.rainbowFeverTimer = duration;
    this.invincibleTimer = duration;
  }

  draw(ctx, spriteRenderer, camera) {
    spriteRenderer.drawPlayer(ctx, {
      x: this.x - camera.x,
      y: this.y - camera.y,
      charId: this.charId,
      state: this.state,
      facingRight: this.facingRight,
      animTimer: this.animTimer,
      combo: this.combo,
      spicyMode: this.spicyTimer > 0,
      rainbowFever: this.rainbowFeverTimer > 0,
      invincibleTimer: this.invincibleTimer
    }, 1.5);
  }
}

class PlayerSlashWave {
  constructor(x, y, vx, color = '#00f0ff', vy = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.width = 18;
    this.height = 18;
    this.life = 0.8;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.life -= dt;
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
    ctx.shadowBlur = 10;

    // Glowing Crescent Blade Wave
    ctx.fillRect(4, 0, 10, 18);
    ctx.fillRect(0, 4, 18, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 4, 6, 10);
    ctx.restore();
  }
}

window.Player = Player;
window.PlayerSlashWave = PlayerSlashWave;
