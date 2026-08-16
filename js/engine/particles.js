/**
 * K-POP DEMON HUNTERS - Particle & Special FX Engine
 * Manages 8-bit pixel sparkles, slash trails, ramen steam, and celebration confetti.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt;

      if (p.gravity) {
        p.vy += p.gravity * dt * 60;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    for (const p of this.particles) {
      const screenX = Math.round(p.x - camera.x);
      const screenY = Math.round(p.y - camera.y);

      ctx.save();
      ctx.fillStyle = p.color;

      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }

      if (p.type === 'star') {
        // 8-bit star particle
        const s = p.size;
        ctx.fillRect(screenX - s, screenY, s * 2, s);
        ctx.fillRect(screenX, screenY - s, s, s * 2);
      } else if (p.type === 'confetti') {
        // Rotating confetti square
        ctx.fillRect(screenX, screenY, p.size, p.size * 1.5);
      } else if (p.type === 'ripple') {
        // Expanding Neon Touch Ring
        p.radius += 2.5;
        p.alpha = Math.max(0, p.life / 0.4);
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else if (p.type === 'slash_arc') {
        // Glowing slash wave
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, p.startAngle, p.endAngle);
        ctx.stroke();
      } else {
        // Standard square pixel particle
        ctx.fillRect(screenX, screenY, p.size, p.size);
      }

      ctx.restore();
    }
  }

  /**
   * Spawn Expanding Neon Touch Ripple
   */
  spawnTouchRipple(x, y, color = '#00f0ff') {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 4,
      size: 2,
      color,
      life: 0.35,
      type: 'ripple',
      glow: true
    });
  }

  /**
   * Spawn Sparkle Burst on Demon Defeat / Item Collect
   */
  spawnSparkleBurst(x, y, count = 12, color = '#ffe600') {
    const colors = [color, '#ffffff', '#ff007f', '#00f0ff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.04,
        size: Math.random() > 0.5 ? 3 : 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.4 + Math.random() * 0.3,
        type: 'star',
        glow: true
      });
    }
  }

  /**
   * Spawn Steaming Ramen Broth & Noodle Sparkles
   */
  spawnRamenSlurpFX(x, y) {
    const colors = ['#fff0a3', '#ff6b00', '#ffffff', '#ff1493'];
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 3,
        gravity: 0.08,
        size: 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.6 + Math.random() * 0.4,
        type: 'pixel',
        glow: true
      });
    }
  }

  /**
   * Spawn Glowing Sword Slash Trail
   */
  spawnSlashTrail(x, y, color, facingRight, combo = 1) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (facingRight ? 16 + i * 4 : -16 - i * 4),
        y: y + Math.random() * 20 - 10,
        vx: (facingRight ? 1 : -1) * (1 + Math.random()),
        vy: (Math.random() - 0.5) * 2,
        gravity: 0,
        size: 3,
        color: i % 2 === 0 ? '#ffffff' : color,
        life: 0.2 + Math.random() * 0.15,
        type: 'star',
        glow: true
      });
    }
  }

  /**
   * Spawn Stage Victory Confetti Shower
   */
  spawnVictoryConfetti(x, y, width = 384) {
    const colors = ['#ff007f', '#00f0ff', '#ffe600', '#39ff14', '#ffffff', '#9d00ff'];
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x - width / 2 + Math.random() * width,
        y: y - 100 + Math.random() * 30,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 2,
        gravity: 0.03,
        size: 3 + Math.floor(Math.random() * 3),
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.8 + Math.random() * 1.0,
        type: 'confetti',
        glow: false
      });
    }
  }

  clear() {
    this.particles = [];
  }
}

window.ParticleSystem = ParticleSystem;
