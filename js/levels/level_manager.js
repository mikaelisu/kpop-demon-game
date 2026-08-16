/**
 * K-POP DEMON HUNTERS - Level Manager & World Renderer
 */

class LevelManager {
  constructor() {
    this.currentStageIndex = 0;
    this.stageData = null;
    this.tilemap = null;
    this.enemies = [];
    this.collectibles = [];
    this.enemyProjectiles = [];
    this.playerProjectiles = [];
    this.boss = null;
    this.companions = new CompanionManager();
    this.isArenaLocked = false;
    this.isStageCleared = false;
    this.bossDefeated = false;
    this.clearTimer = 0;
    this.animTimer = 0;
    this.goalX = 2000;
  }

  loadStage(stageIndex, player, camera, music) {
    this.currentStageIndex = stageIndex % STAGES_DATA.length;
    this.stageData = STAGES_DATA[this.currentStageIndex];
    this.isStageCleared = false;
    this.isArenaLocked = false;
    this.bossDefeated = false;
    this.clearTimer = 0;
    this.goalX = (this.stageData.widthTiles - 2.5) * this.stageData.tileSize;
    if (this.companions) this.companions.projectiles = [];

    // Build Tilemap object
    const grid = this.stageData.buildTilemap();
    this.tilemap = {
      cols: this.stageData.widthTiles,
      rows: this.stageData.heightTiles,
      tileSize: this.stageData.tileSize,
      grid: grid,
      getTile: (x, y) => {
        if (x < 0 || x >= this.stageData.widthTiles || y < 0 || y >= this.stageData.heightTiles) {
          return 0;
        }
        return grid[y][x];
      }
    };

    // Position Player
    player.x = this.stageData.playerStart.x;
    player.y = this.stageData.playerStart.y;
    player.vx = 0;
    player.vy = 0;
    player.state = 'idle';

    // Set Camera Bounds
    const stagePixelWidth = this.stageData.widthTiles * this.stageData.tileSize;
    const stagePixelHeight = this.stageData.heightTiles * this.stageData.tileSize;
    camera.setBounds(0, 0, stagePixelWidth, stagePixelHeight);

    // Spawn Enemies
    this.enemies = this.stageData.spawns.enemies.map(e => new Enemy(e.x, e.y, e.type));

    // Spawn Collectibles
    this.collectibles = this.stageData.spawns.collectibles.map(c => new Collectible(c.x, c.y, c.type));

    // Spawn Boss
    this.boss = new Boss(this.stageData.bossSpawn.x, this.stageData.bossSpawn.y, this.stageData.bossType);

    // Clear Projectiles
    this.enemyProjectiles = [];
    this.playerProjectiles = [];

    // Start Stage BGM
    if (music) {
      music.playTrack(this.stageData.musicTrack);
    }
  }

  update(dt, player, physics, sfx, particles, camera, music) {
    this.animTimer += dt;

    // Check Boss Arena Lock (Only locks when reaching arena for the first time)
    if (!this.isArenaLocked && !this.bossDefeated && player.x >= this.stageData.arenaLockX) {
      this.isArenaLocked = true;
      if (this.boss) this.boss.isActive = true;
      camera.setBounds(this.stageData.arenaLockX - 60, 0, this.stageData.widthTiles * 32, this.stageData.heightTiles * 32);
      if (music) music.playTrack('boss');
      if (sfx) sfx.playBossRoar();
      if (camera) camera.shake(0.5, 6);
    }

    // 0. Update Companions (Demon Cat & Demon Raven Assist)
    if (this.companions) {
      this.companions.update(dt, player, this.enemies, this.boss, this.collectibles, this.enemyProjectiles, sfx, particles);
    }

    // 1. Update Player Projectiles
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.playerProjectiles.splice(i, 1);
        continue;
      }

      // Check collision with Enemies
      for (const enemy of this.enemies) {
        if (!enemy.isDefeated && physics.checkOverlap(p.getHitbox(), enemy.getHitbox())) {
          enemy.takeDamage(2, sfx, particles, this.collectibles);
          p.life = 0;
          break;
        }
      }

      // Check collision with Boss (Only if Boss is active in arena!)
      if (this.boss && this.boss.isActive && !this.boss.isDefeated && physics.checkOverlap(p.getHitbox(), this.boss.getHitbox())) {
        this.boss.takeDamage(2, sfx, particles, this.collectibles);
        p.life = 0;
      }
    }

    // 2. Update Enemy Projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.update(dt);
      if (ep.life <= 0) {
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      // Check hit with Player Glowing Sword (Deflect/Destroy projectile!)
      const swordBox = player.getSwordHitbox();
      if (swordBox && physics.checkOverlap(swordBox, ep.getHitbox())) {
        ep.life = 0;
        player.score += 50;
        if (sfx) sfx.playSlash(1);
        if (particles) particles.spawnSparkleBurst(ep.x, ep.y, 10, '#00f0ff');
        continue;
      }

      // Check hit with Player
      if (physics.checkOverlap(player.getHitbox(), ep.getHitbox())) {
        player.takeDamage(1, sfx, particles);
        ep.life = 0;
      }
    }

    // 3. Update Enemies
    for (const enemy of this.enemies) {
      if (enemy.isDefeated) continue;
      enemy.update(dt, player, this.tilemap, this.enemyProjectiles, physics);

      // Check Sword Slash Attack Hit
      const swordBox = player.getSwordHitbox();
      if (swordBox && !enemy.isHit && physics.checkOverlap(swordBox, enemy.getHitbox())) {
        enemy.takeDamage(player.spicyTimer > 0 ? 2 : 1, sfx, particles, this.collectibles);
        player.score += 200;
        player.addSlurpMeter(15);
      }

      // Check Rainbow Fever Auto-Defeat
      else if (player.rainbowFeverTimer > 0 && !enemy.isHit && physics.checkOverlap(player.getHitbox(), enemy.getHitbox())) {
        enemy.takeDamage(3, sfx, particles, this.collectibles);
        player.score += 300;
      }

      // Check Player Landing / Bouncing on Enemy Head (Kid-Friendly Stomp!)
      else if (player.vy > 0 && !enemy.isHit && player.y + player.height <= enemy.y + 12 && physics.checkOverlap(player.getHitbox(), enemy.getHitbox())) {
        enemy.takeDamage(1, sfx, particles, this.collectibles);
        player.bounceOnEnemy(sfx, particles);
        player.score += 150;
      }

      // Enemy damages player
      else if (physics.checkOverlap(player.getHitbox(), enemy.getHitbox())) {
        player.takeDamage(1, sfx, particles);
      }
    }

    // 4. Update Boss
    if (this.boss) {
      this.boss.update(dt, player, this.enemyProjectiles, particles, sfx, camera);

      if (this.boss.isActive && !this.boss.isDefeated) {
        // Sword Slash vs Boss
        const swordBox = player.getSwordHitbox();
        if (swordBox && !this.boss.isHit && physics.checkOverlap(swordBox, this.boss.getHitbox())) {
          this.boss.takeDamage(1, sfx, particles, this.collectibles);
          player.score += 300;
          player.addSlurpMeter(20);
        }

        // Rainbow Fever vs Boss
        else if (player.rainbowFeverTimer > 0 && !this.boss.isHit && physics.checkOverlap(player.getHitbox(), this.boss.getHitbox())) {
          this.boss.takeDamage(2, sfx, particles, this.collectibles);
          player.bounceOnEnemy(sfx, particles);
        }

        // Boss damages player
        else if (physics.checkOverlap(player.getHitbox(), this.boss.getHitbox())) {
          player.takeDamage(1, sfx, particles);
        }
      } else if (this.boss.isDefeated && !this.bossDefeated) {
        // Boss defeated! Unlock Arena so player can run right to the Goal Gate!
        this.bossDefeated = true;
        this.isArenaLocked = false;
        const stagePixelWidth = this.stageData.widthTiles * this.stageData.tileSize;
        const stagePixelHeight = this.stageData.heightTiles * this.stageData.tileSize;
        camera.setBounds(0, 0, stagePixelWidth, stagePixelHeight);
        if (music) music.playTrack(this.stageData.musicTrack);
        if (particles) particles.spawnSparkleBurst(this.boss.x + 30, this.boss.y + 30, 30, '#ffd700');
      }
    }

    // Dynamic Music Tempo Shift (Rainbow Fever 1.25x / Boss Pinch Mode 1.2x)
    if (music) {
      if (player.rainbowFeverTimer > 0) {
        music.setTempoMultiplier(1.25);
      } else if (this.boss && this.boss.isActive && !this.boss.isDefeated && this.boss.hp <= this.boss.maxHp * 0.4) {
        music.setTempoMultiplier(1.20);
      } else {
        music.setTempoMultiplier(1.0);
      }
    }

    // 5. Update Collectibles & Destructible Props
    const swordBox = player.getSwordHitbox();
    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.update(dt);

      // Player Touch Collect
      if (physics.checkOverlap(player.getHitbox(), c.getHitbox())) {
        c.onCollect(player, sfx, particles, this.collectibles);
      }

      // Sword Slash Destructibles (Lanterns, Crystals)
      else if (swordBox && (c.type === 'lantern' || c.type === 'demon_crystal') && physics.checkOverlap(swordBox, c.getHitbox())) {
        c.onCollect(player, sfx, particles, this.collectibles);
      }
    }

    // 6. Rightmost Finish Goal Gate Check (Stage ONLY completes when reaching the far right goal!)
    const goalHitbox = { x: this.goalX - 16, y: 0, width: 64, height: this.stageData.heightTiles * 32 };
    if (!this.isStageCleared && physics.checkOverlap(player.getHitbox(), goalHitbox)) {
      if (this.bossDefeated || (this.boss && this.boss.isDefeated) || player.assistInvincible) {
        this.isStageCleared = true;
        this.clearTimer = 4.0;
        player.state = 'victory';
        if (music) music.playTrack('victory');
        if (particles) particles.spawnVictoryConfetti(player.x, player.y, 384);
      }
    }

    // 7. Stage Clear Timer Animation
    if (this.isStageCleared) {
      this.clearTimer -= dt;
      if (Math.random() < 0.2 && particles) {
        particles.spawnVictoryConfetti(player.x, player.y, 384);
      }
    }
  }

  // =========================================================================
  // PARALLAX BACKGROUND & TILE RENDERING
  // =========================================================================

  drawBackground(ctx, camera) {
    const stageType = this.stageData ? this.stageData.stageType : 'market';

    // Sky gradient
    if (stageType === 'market') {
      ctx.fillStyle = '#06010f';
      ctx.fillRect(0, 0, camera.width, camera.height);
      this.drawNeonCityParallax(ctx, camera);
    } else if (stageType === 'concert') {
      ctx.fillStyle = '#080014';
      ctx.fillRect(0, 0, camera.width, camera.height);
      this.drawConcertDomeParallax(ctx, camera);
    } else if (stageType === 'temple') {
      ctx.fillStyle = '#0b132b';
      ctx.fillRect(0, 0, camera.width, camera.height);
      this.drawMysticShrineParallax(ctx, camera);
    } else {
      ctx.fillStyle = '#10002b';
      ctx.fillRect(0, 0, camera.width, camera.height);
      this.drawCastleParallax(ctx, camera);
    }
  }

  drawNeonCityParallax(ctx, camera) {
    const p1 = camera.x * 0.15;
    const p2 = camera.x * 0.35;

    // Distant Neon Skyline Silhouette
    ctx.fillStyle = '#180a2a';
    for (let i = 0; i < 15; i++) {
      const bx = (i * 90 - p1) % (camera.width + 180) - 40;
      const bh = 70 + (i % 4) * 25;
      ctx.fillRect(bx, camera.height - bh - 40, 70, bh);
      // Neon rooftop antennas
      ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ff007f';
      ctx.fillRect(bx + 30, camera.height - bh - 48, 4, 8);
      ctx.fillStyle = '#180a2a';
    }

    // Midground Ramen Stall Lanterns & Neon Signs
    for (let i = 0; i < 10; i++) {
      const lx = (i * 140 - p2) % (camera.width + 200) - 30;
      // Glowing Lantern
      ctx.fillStyle = '#ff6b00';
      ctx.fillRect(lx, 60 + (i % 3) * 15, 12, 16);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(lx + 3, 63 + (i % 3) * 15, 6, 10);
    }
  }

  drawConcertDomeParallax(ctx, camera) {
    const p = camera.x * 0.2;
    // Sweeping concert stage laser beams
    ctx.save();
    const beamAngle = Math.sin(this.animTimer * 2) * 0.4;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(camera.width * 0.25 - p % 100, camera.height);
    ctx.lineTo(camera.width * 0.5 + Math.sin(this.animTimer * 2) * 80, 0);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 0, 127, 0.25)';
    ctx.beginPath();
    ctx.moveTo(camera.width * 0.75 - p % 100, camera.height);
    ctx.lineTo(camera.width * 0.5 - Math.sin(this.animTimer * 2) * 80, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawMysticShrineParallax(ctx, camera) {
    const p = camera.x * 0.2;
    // Distant mountain & glowing full moon
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(camera.width - 60 - p % 80, 50, 28, 0, Math.PI * 2);
    ctx.fill();

    // Cherry blossom floating petals
    for (let i = 0; i < 12; i++) {
      const px = (i * 45 + this.animTimer * 20 - camera.x * 0.4) % camera.width;
      const py = (i * 30 + Math.sin(this.animTimer * 3 + i) * 15) % camera.height;
      ctx.fillStyle = '#ff77bb';
      ctx.fillRect(px, py, 3, 3);
    }
  }

  drawCastleParallax(ctx, camera) {
    // Dark cyber moon and fortress spires
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(80, 60, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTiles(ctx, spriteRenderer, camera) {
    if (!this.tilemap) return;
    const stageType = this.stageData ? this.stageData.stageType : 'market';
    const ts = this.tilemap.tileSize;

    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol = Math.min(this.tilemap.cols - 1, Math.ceil((camera.x + camera.width) / ts));
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow = Math.min(this.tilemap.rows - 1, Math.ceil((camera.y + camera.height) / ts));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.tilemap.getTile(c, r);
        if (tile > 0) {
          spriteRenderer.drawTile(ctx, tile, c * ts - camera.x, r * ts - camera.y, stageType, 2);
        }
      }
    }
  }

  drawEntities(ctx, spriteRenderer, camera) {
    // 1. Collectibles
    for (const c of this.collectibles) {
      c.draw(ctx, spriteRenderer, camera);
    }

    // 2. Enemies
    for (const enemy of this.enemies) {
      enemy.draw(ctx, spriteRenderer, camera);
    }

    // 3. Boss
    if (this.boss) {
      this.boss.draw(ctx, spriteRenderer, camera);
    }

    // 4. Enemy Projectiles
    for (const ep of this.enemyProjectiles) {
      ep.draw(ctx, camera);
    }

    // 5. Player Projectiles
    for (const pp of this.playerProjectiles) {
      pp.draw(ctx, camera);
    }

    // 6. Companions (Demon Cat & Demon Raven)
    if (this.companions) {
      this.companions.draw(ctx, spriteRenderer, camera);
    }

    // 7. Rightmost Golden Concert Stage Clear Goal Gate
    this.drawGoalGate(ctx, camera);
  }

  drawGoalGate(ctx, camera) {
    const screenX = Math.round(this.goalX - camera.x);
    const groundY = Math.round(10 * 32 - camera.y);

    ctx.save();

    // Pulsing Rainbow Glow
    const glow = Math.abs(Math.sin(this.animTimer * 4)) * 10;
    ctx.shadowBlur = 12 + glow;

    // Left & Right Neon Concert Truss Pillars
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.fillRect(screenX - 24, groundY - 80, 8, 80);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.fillRect(screenX + 24, groundY - 80, 8, 80);

    // Cross Beams & LED Bulbs
    ctx.fillStyle = '#ffe600';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(screenX - 22, groundY - 16 - i * 14, 4, 4);
      ctx.fillRect(screenX + 26, groundY - 16 - i * 14, 4, 4);
    }

    // Top Marquee Arch Header
    ctx.fillStyle = '#18022a';
    ctx.fillRect(screenX - 32, groundY - 96, 72, 20);
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX - 32, groundY - 96, 72, 20);

    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#ffd700';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.fillText("★ GOAL ★", screenX + 4, groundY - 82);

    // Center Spinning Hologram Portal
    const bob = Math.sin(this.animTimer * 5) * 4;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.arc(screenX + 4, groundY - 40 + bob, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + 2, groundY - 42 + bob, 4, 4);

    // If Boss is Defeated, Draw Flashing Neon Arrow Guiding Player to the Goal!
    if (this.bossDefeated && !this.isStageCleared) {
      const arrowFlash = Math.sin(this.animTimer * 8) > 0;
      if (arrowFlash) {
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.fillText("▶ ▶ GO TO GOAL ▶ ▶", screenX + 4, groundY - 108);
      }
    }

    ctx.restore();
  }
}

window.LevelManager = LevelManager;
