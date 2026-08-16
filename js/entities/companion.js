/**
 * K-POP DEMON HUNTERS - Companion Assist System
 * Demon Cat (Bogi) & Demon Raven (Karasu) magical familiars that assist the player.
 */

class CompanionManager {
  constructor() {
    this.cat = new DemonCatCompanion();
    this.raven = new DemonRavenCompanion();
    this.projectiles = [];
  }

  update(dt, player, enemies, boss, collectibles, enemyProjectiles, sfx, particles) {
    this.cat.update(dt, player, enemies, boss, collectibles, this.projectiles, sfx, particles);
    this.raven.update(dt, player, enemies, boss, enemyProjectiles, sfx, particles);

    // Update Companion Projectiles (Cat Spirit Flame Orbs)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit Enemies
      let hit = false;
      for (const enemy of enemies) {
        if (!enemy.isDefeated && !enemy.isHit && this.checkOverlap(p.getHitbox(), enemy.getHitbox())) {
          enemy.takeDamage(p.isSuper ? 3 : 1, sfx, particles, collectibles);
          if (particles) particles.spawnSparkleBurst(p.x, p.y, p.isSuper ? 14 : 8, p.color);
          p.life = 0;
          hit = true;
          break;
        }
      }

      // Hit Boss
      if (!hit && boss && !boss.isDefeated && !boss.isHit && this.checkOverlap(p.getHitbox(), boss.getHitbox())) {
        boss.takeDamage(p.isSuper ? 2 : 1, sfx, particles, collectibles);
        if (particles) particles.spawnSparkleBurst(p.x, p.y, p.isSuper ? 16 : 10, '#00f0ff');
        p.life = 0;
      }
    }
  }

  triggerSlurpSynergy(player, enemies, boss, collectibles, sfx, particles) {
    if (this.cat) {
      this.cat.triggerSuperCat(player, this.projectiles, sfx, particles);
    }
    if (this.raven) {
      this.raven.triggerSuperRaven(player, enemies, boss, collectibles, sfx, particles);
    }
  }

  handleTap(touchX, touchY, camera, sfx, particles) {
    const worldX = touchX + camera.x;
    const worldY = touchY + camera.y;

    if (Math.hypot(worldX - this.cat.x, worldY - this.cat.y) < 32) {
      this.cat.cheer(sfx, particles);
      return true;
    }
    if (Math.hypot(worldX - this.raven.x, worldY - this.raven.y) < 32) {
      this.raven.cheer(sfx, particles);
      return true;
    }
    return false;
  }

  checkOverlap(box1, box2) {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  draw(ctx, spriteRenderer, camera) {
    this.cat.draw(ctx, spriteRenderer, camera);
    this.raven.draw(ctx, spriteRenderer, camera);

    // Draw companion projectiles
    for (const p of this.projectiles) {
      p.draw(ctx, camera);
    }
  }
}

// ===========================================================================
// DEMON CAT COMPANION (BOGI)
// ===========================================================================
class DemonCatCompanion {
  constructor() {
    this.x = 40;
    this.y = 100;
    this.targetX = 40;
    this.targetY = 100;
    this.facingRight = true;
    this.animTimer = 0;
    this.attackTimer = 1.8; // Fires spirit orb every 1.8s
    this.pawSwipeTimer = 0;
  }

  update(dt, player, enemies, boss, collectibles, projectiles, sfx, particles) {
    this.animTimer += dt;
    if (this.pawSwipeTimer > 0) this.pawSwipeTimer -= dt;

    this.facingRight = player.facingRight;

    // Hover gently above player's rear shoulder
    const offsetX = player.facingRight ? -22 : 22;
    const hoverBob = Math.sin(this.animTimer * 5) * 5;
    this.targetX = player.x + offsetX;
    this.targetY = player.y - 10 + hoverBob;

    // Smooth Lerp Follow
    this.x += (this.targetX - this.x) * (dt * 7);
    this.y += (this.targetY - this.y) * (dt * 7);

    // 1. Item Magnet Ability: Pull stars & ramen toward player
    if (collectibles) {
      for (const c of collectibles) {
        if (c.collected) continue;
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 75) {
          c.x += (dx / dist) * 3.5;
          c.y += (dy / dist) * 3.5;
          if (Math.random() < 0.1 && particles) {
            particles.spawnSparkleBurst(c.x + 8, c.y + 8, 2, '#ff007f');
          }
        }
      }
    }

    // 2. Auto-Attack Nearby Demons
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      // Find closest enemy or boss
      let target = null;
      let closestDist = 180; // Detection radius

      for (const enemy of enemies) {
        if (enemy.isDefeated) continue;
        const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (d < closestDist) {
          closestDist = d;
          target = enemy;
        }
      }

      if (!target && boss && !boss.isDefeated) {
        const d = Math.hypot(boss.x - this.x, boss.y - this.y);
        if (d < closestDist) target = boss;
      }

      if (target) {
        this.attackTimer = 1.8;
        this.pawSwipeTimer = 0.3;
        const angle = Math.atan2(target.y + 10 - this.y, target.x + 10 - this.x);
        projectiles.push(new CompanionOrb(this.x + 8, this.y + 4, Math.cos(angle) * 4.2, Math.sin(angle) * 4.2, '#ff007f'));
        if (sfx) sfx.playSlash(1);
        if (particles) particles.spawnSparkleBurst(this.x + 8, this.y + 4, 6, '#ff007f');
      }
    }
  }

  triggerSuperCat(player, projectiles, sfx, particles) {
    this.pawSwipeTimer = 0.8;
    if (sfx) sfx.playSlash(3);
    if (particles) particles.spawnSparkleBurst(this.x + 8, this.y + 4, 25, '#ff007f');

    // Launch 10-way 360 Rainbow Spirit Flame Star Ring!
    const colors = ['#ff007f', '#00f0ff', '#ffe600', '#cc00ff', '#ff6b00'];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const speed = 4.8;
      const orb = new CompanionOrb(
        this.x + 6,
        this.y + 4,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        colors[i % colors.length]
      );
      orb.isSuper = true;
      orb.life = 1.4;
      projectiles.push(orb);
    }
  }

  cheer(sfx, particles) {
    this.pawSwipeTimer = 0.5;
    if (sfx) sfx.playStar();
    if (particles) particles.spawnSparkleBurst(this.x + 8, this.y + 4, 15, '#ff77bb');
  }

  draw(ctx, spriteRenderer, camera) {
    spriteRenderer.drawDemonCat(ctx, {
      x: this.x - camera.x,
      y: this.y - camera.y,
      facingRight: this.facingRight,
      animTimer: this.animTimer,
      isAttacking: this.pawSwipeTimer > 0
    }, 1.5);
  }
}

// ===========================================================================
// DEMON RAVEN COMPANION (KARASU)
// ===========================================================================
class DemonRavenCompanion {
  constructor() {
    this.x = 50;
    this.y = 80;
    this.targetX = 50;
    this.targetY = 80;
    this.facingRight = true;
    this.animTimer = 0;
    this.diveTimer = 3.0;
    this.isDiving = false;
    this.isSuperDive = false;
    this.diveTarget = null;
    this.diveProgress = 0;
    this.diveStartX = 0;
    this.diveStartY = 0;
  }

  update(dt, player, enemies, boss, enemyProjectiles, sfx, particles) {
    this.animTimer += dt;

    if (!this.isDiving) {
      this.facingRight = player.facingRight;
      // Patrol flight above and in front of player
      const offsetX = player.facingRight ? 24 : -24;
      const waveY = Math.sin(this.animTimer * 4) * 8;
      this.targetX = player.x + offsetX;
      this.targetY = player.y - 28 + waveY;

      this.x += (this.targetX - this.x) * (dt * 6);
      this.y += (this.targetY - this.y) * (dt * 6);

      // Deflect nearby enemy projectiles in flight path
      if (enemyProjectiles) {
        for (const ep of enemyProjectiles) {
          if (ep.life > 0 && Math.hypot(ep.x - this.x, ep.y - this.y) < 24) {
            ep.life = 0;
            if (sfx) sfx.playSlash(2);
            if (particles) particles.spawnSparkleBurst(ep.x, ep.y, 8, '#9d4edd');
          }
        }
      }

      // Check Dive Bomb Trigger
      this.diveTimer -= dt;
      if (this.diveTimer <= 0) {
        let target = null;
        let closestDist = 220;

        for (const enemy of enemies) {
          if (enemy.isDefeated) continue;
          const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (d < closestDist) {
            closestDist = d;
            target = enemy;
          }
        }

        if (!target && boss && !boss.isDefeated) {
          const d = Math.hypot(boss.x - this.x, boss.y - this.y);
          if (d < closestDist) target = boss;
        }

        if (target) {
          this.isDiving = true;
          this.isSuperDive = false;
          this.diveTarget = target;
          this.diveProgress = 0;
          this.diveStartX = this.x;
          this.diveStartY = this.y;
          this.diveTimer = 3.2;
          if (sfx) sfx.playWallKick();
        }
      }
    } else {
      // Execute Swoop Dive-Bomb Arc
      const diveSpeed = this.isSuperDive ? 3.5 : 2.2;
      this.diveProgress += dt * diveSpeed;
      const p = this.diveProgress;

      if (p >= 1.0) {
        this.isDiving = false;
        this.isSuperDive = false;
        this.diveTarget = null;
      } else {
        const tx = this.diveTarget ? this.diveTarget.x + 10 : this.x + (this.facingRight ? 120 : -120);
        const ty = this.diveTarget ? this.diveTarget.y + 10 : this.y + 20;

        // Quadratic Bezier Arc for swooping claw strike
        const arcY = Math.sin(p * Math.PI) * (this.isSuperDive ? 35 : 20);
        this.x = (1 - p) * this.diveStartX + p * tx;
        this.y = (1 - p) * this.diveStartY + p * ty - arcY;
        this.facingRight = this.x < tx;

        // Hit trigger at bottom of swoop
        if (p > 0.4 && p < 0.7) {
          if (this.diveTarget && !this.diveTarget.isDefeated && !this.diveTarget.isHit) {
            this.diveTarget.takeDamage(this.isSuperDive ? 3 : 1, sfx, particles);
            if (sfx) sfx.playSlash(3);
            if (particles) particles.spawnSparkleBurst(this.x, this.y, this.isSuperDive ? 20 : 12, '#cc00ff');
          }
        }
      }
    }
  }

  triggerSuperRaven(player, enemies, boss, collectibles, sfx, particles) {
    this.isDiving = true;
    this.isSuperDive = true;
    this.diveProgress = 0;
    this.diveStartX = this.x;
    this.diveStartY = this.y;
    this.diveTarget = boss && !boss.isDefeated ? boss : (enemies.find(e => !e.isDefeated) || { x: this.x + 150, y: this.y + 20 });
    this.diveTimer = 4.0;
    if (sfx) sfx.playWallKick();
    if (particles) particles.spawnSparkleBurst(this.x, this.y, 25, '#9d4edd');
  }

  cheer(sfx, particles) {
    if (sfx) sfx.playStar();
    if (particles) particles.spawnSparkleBurst(this.x, this.y, 15, '#00f0ff');
  }

  draw(ctx, spriteRenderer, camera) {
    spriteRenderer.drawDemonRaven(ctx, {
      x: this.x - camera.x,
      y: this.y - camera.y,
      facingRight: this.facingRight,
      animTimer: this.animTimer,
      isDiving: this.isDiving
    }, 1.5);
  }
}

// ===========================================================================
// COMPANION PROJECTILE (GHOST FLAME ORB)
// ===========================================================================
class CompanionOrb {
  constructor(x, y, vx, vy, color = '#ff007f') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.width = 14;
    this.height = 14;
    this.life = 0.9;
    this.isSuper = false;
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
    const sx = Math.round(this.x - camera.x);
    const sy = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.isSuper ? 15 : 10;

    // Glowing Spirit Flame Star
    const sz = this.isSuper ? 16 : 12;
    ctx.fillRect(sz / 4, 0, sz / 2, sz);
    ctx.fillRect(0, sz / 4, sz, sz / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sz / 3, sz / 3, sz / 3, sz / 3);

    ctx.restore();
  }
}

window.CompanionManager = CompanionManager;
window.DemonCatCompanion = DemonCatCompanion;
window.DemonRavenCompanion = DemonRavenCompanion;
window.CompanionOrb = CompanionOrb;

