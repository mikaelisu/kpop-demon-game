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
    this.slurpMeter = 100; // Starts 100% FULL so kid can immediately use SLURP!
    this.maxSlurpMeter = 100;
    this.score = 0;
    this.starsCollected = 0;
    this.photocardsCollected = 0;
    this.hasGoldenChopsticks = false;

    // Timers & Buffs
    this.animTimer = 0;
    this.attackTimer = 0;
    this.attackBufferTimer = 0;
    this.slurpBufferTimer = 0;
    this.slurpCooldownTimer = 0;
    this.combo = 1;
    this.comboResetTimer = 0;
    this.invincibleTimer = 0;
    this.spicyTimer = 0;
    this.rainbowFeverTimer = 0;
    this.slurpAnimTimer = 0;

    // Platforming Helpers (Kid-Friendly Ninja Gaiden feel)
    this.onGround = false;
    this.canDoubleJump = this.charId === 'rumi' || this.charId === 'luna';
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

  update(dt, input, physics, tilemap, sfx, particles, camera, playerProjectiles, levelManager) {
    this.animTimer += dt;

    // Update Timers
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.slurpCooldownTimer > 0) this.slurpCooldownTimer -= dt;
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

    // Slurp Input Buffering
    if (input.justSlurp() || input.isSlurp()) {
      this.slurpBufferTimer = 0.25;
    } else if (this.slurpBufferTimer > 0) {
      this.slurpBufferTimer -= dt;
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

    // Check & Trigger Slurp Special Button (Always works!)
    if (this.slurpBufferTimer > 0 && this.state !== 'slurp') {
      if (this.slurpMeter >= 40) {
        this.triggerSlurpSuper(sfx, particles, camera, playerProjectiles, levelManager);
      } else if (this.slurpCooldownTimer <= 0) {
        this.triggerMiniSlurp(sfx, particles, playerProjectiles);
      }
      this.slurpBufferTimer = 0;
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
        this.canDoubleJump = this.charId === 'rumi';
        this.state = 'jump';
        if (sfx) sfx.playJump();
      } else if (this.state === 'wall_cling') {
        // Ninja Wall Kick!
        this.vy = this.jumpForce * 0.95;
        this.vx = -this.wallClingDir * this.speed * 1.3;
        this.facingRight = this.wallClingDir < 0;
        this.canDoubleJump = this.charId === 'rumi';
        this.state = 'jump';
        this.jumpBufferTimer = 0;
        if (sfx) sfx.playWallKick();
        if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 20, 8, '#00f0ff');
      } else if (this.charId === 'rumi' && this.canDoubleJump && !this.onGround) {
        // Rumi's Signature Moonlight Double Jump Flip!
        this.vy = this.jumpForce * 0.9;
        this.canDoubleJump = false;
        this.jumpBufferTimer = 0;
        this.state = 'jump';
        if (sfx) sfx.playWallKick();
        if (particles) particles.spawnSparkleBurst(this.x + 12, this.y + 20, 14, '#00f0ff');
      }
    }

    if (this.onGround) {
      this.canDoubleJump = true;
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
      physics.updateEntity(this, tilemap, 32, sfx, particles);
    }
  }

  executeAttack(sfx, particles, playerProjectiles) {
    this.state = 'attack';
    // Zoey has fast attack speed (0.13s)
    this.attackTimer = this.charId === 'zoey' ? 0.13 : 0.18;

    const swordColor = this.getSwordColor();
    if (sfx) sfx.playSlash(this.combo);
    if (particles) particles.spawnSlashTrail(this.x, this.y, swordColor, this.facingRight, this.combo);

    const dir = this.facingRight ? 1 : -1;

    // Signature Character Finisher Moves on 3rd Combo Strike:
    if (playerProjectiles) {
      if (this.spicyTimer > 0) {
        // Spicy Fire Wave
        playerProjectiles.push(new PlayerSlashWave(this.x + (this.facingRight ? 26 : -12), this.y + 4, dir * 5.8, '#ff3300'));
      } else if (this.combo === 3) {
        if (this.charId === 'zoey') {
          // Zoey: Twin Pink Star Homing Dagger Burst
          playerProjectiles.push(new PlayerSlashWave(this.x + (this.facingRight ? 24 : -10), this.y, dir * 5.2, '#ff1493', -1.0));
          playerProjectiles.push(new PlayerSlashWave(this.x + (this.facingRight ? 24 : -10), this.y + 8, dir * 5.2, '#ff1493', 1.0));
        } else if (this.charId === 'mira') {
          // Mira: Golden Flame Shockwave
          playerProjectiles.push(new PlayerSlashWave(this.x + (this.facingRight ? 24 : -10), this.y + 6, dir * 4.8, '#ffaa00', 0));
        } else if (this.charId === 'jinu') {
          // Jinu: Violet Lightning Bolt Strike
          playerProjectiles.push(new PlayerSlashWave(this.x + (this.facingRight ? 24 : -10), this.y - 12, dir * 5.0, '#cc00ff', 2.0));
        }
      }
    }

    // Cycle 3-hit K-Pop combo
    this.combo = (this.combo % 3) + 1;
    this.comboResetTimer = 0.8;
  }

  triggerSlurpSuper(sfx, particles, camera, playerProjectiles, levelManager) {
    this.slurpMeter = 0;
    this.state = 'slurp';
    this.slurpAnimTimer = 0.45;
    this.heal(1);
    this.activateRainbowFever(8);

    if (sfx) { sfx.playSlurp(); sfx.playRainbowFever(); }
    if (camera) camera.shake(0.4, 6);
    if (particles) {
      particles.spawnRamenSlurpFX(this.x + 14, this.y + 10);
      particles.spawnSparkleBurst(this.x + 14, this.y + 10, 30, '#ffe600');
    }

    // Trigger Companion Synergy (Cat 10-way Ring + Raven Supersonic Dive!)
    if (levelManager && levelManager.companions) {
      levelManager.companions.triggerSlurpSynergy(this, levelManager.enemies, levelManager.boss, levelManager.collectibles, sfx, particles);
    }

    // Spawn 360 Idol Sparkle Shockwave (8 glowing blade crescents)
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

  triggerMiniSlurp(sfx, particles, playerProjectiles) {
    this.slurpMeter = 0;
    this.slurpCooldownTimer = 1.0;
    this.state = 'slurp';
    this.slurpAnimTimer = 0.3;
    this.heal(1);

    if (sfx) sfx.playSlurp();
    if (particles) {
      particles.spawnRamenSlurpFX(this.x + 14, this.y + 10);
      particles.spawnSparkleBurst(this.x + 14, this.y + 10, 15, '#ffe600');
    }

    // Mini 3-star burst in forward direction
    if (playerProjectiles) {
      const dir = this.facingRight ? 1 : -1;
      playerProjectiles.push(new PlayerSlashWave(this.x + 10, this.y + 10, dir * 4.0, '#ffe600', -1.2));
      playerProjectiles.push(new PlayerSlashWave(this.x + 10, this.y + 10, dir * 4.5, '#ffe600', 0));
      playerProjectiles.push(new PlayerSlashWave(this.x + 10, this.y + 10, dir * 4.0, '#ffe600', 1.2));
    }
  }

  getSwordColor() {
    if (this.rainbowFeverTimer > 0) return '#ffe600';
    if (this.spicyTimer > 0) return '#ff3300';
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

  onSpringBounce(sfx, particles) {
    this.state = 'jump';
    this.canDoubleJump = true;
    if (sfx) sfx.playBounce();
    if (particles) particles.spawnSparkleBurst(this.x + 14, this.y + 32, 14, '#ffe600');
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
