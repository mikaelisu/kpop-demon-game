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
          enemy.takeDamage(1, sfx, particles, collectibles);
          if (particles) particles.spawnSparkleBurst(p.x, p.y, 8, '#ff007f');
          p.life = 0;
          hit = true;
          break;
        }
      }

      // Hit Boss
      if (!hit && boss && !boss.isDefeated && !boss.isHit && this.checkOverlap(p.getHitbox(), boss.getHitbox())) {
        boss.takeDamage(1, sfx, particles, collectibles);
        if (particles) particles.spawnSparkleBurst(p.x, p.y, 10, '#00f0ff');
        p.life = 0;
      }
    }
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
        const ravenBox = { x: this.x, y: this.y, width: 20, height: 16 };
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
      this.diveProgress += dt * 2.2;
      const p = this.diveProgress;

      if (p >= 1.0 || !this.diveTarget) {
        this.isDiving = false;
        this.diveTarget = null;
      } else {
        const tx = this.diveTarget.x + 10;
        const ty = this.diveTarget.y + 10;

        // Quadratic Bezier Arc for swooping claw strike
        const arcY = Math.sin(p * Math.PI) * 20;
        this.x = (1 - p) * this.diveStartX + p * tx;
        this.y = (1 - p) * this.diveStartY + p * ty - arcY;
        this.facingRight = this.x < tx;

        // Hit trigger at bottom of swoop
        if (p > 0.45 && p < 0.65) {
          if (!this.diveTarget.isDefeated && !this.diveTarget.isHit) {
            this.diveTarget.takeDamage(1, sfx, particles);
            if (sfx) sfx.playSlash(3);
            if (particles) particles.spawnSparkleBurst(this.x, this.y, 12, '#cc00ff');
          }
        }
      }
    }
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
    this.width = 12;
    this.height = 12;
    this.life = 0.9;
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
    ctx.shadowBlur = 10;

    // Glowing Spirit Flame Star
    ctx.fillRect(3, 0, 6, 12);
    ctx.fillRect(0, 3, 12, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 4, 4);

    ctx.restore();
  }
}

window.CompanionManager = CompanionManager;
window.DemonCatCompanion = DemonCatCompanion;
window.DemonRavenCompanion = DemonRavenCompanion;
window.CompanionOrb = CompanionOrb;
