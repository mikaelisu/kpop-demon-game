/**
 * K-POP DEMON HUNTERS - Smooth Scrolling Camera & Screen FX
 */

class Camera {
  constructor(viewportWidth = 384, viewportHeight = 216) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.targetX = 0;
    this.targetY = 0;
    this.minX = 0;
    this.maxX = 2000;
    this.minY = 0;
    this.maxY = 216;

    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  setBounds(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = Math.max(minX, maxX - this.width);
    this.maxY = Math.max(minY, maxY - this.height);
  }

  shake(duration = 0.3, intensity = 4) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  follow(target, dt) {
    if (!target) return;

    // Center on target with forward lookahead
    const lookAhead = target.facingRight ? 32 : -32;
    this.targetX = target.x + target.width / 2 - this.width / 2 + lookAhead;
    this.targetY = target.y + target.height / 2 - this.height / 2 - 16;

    // Smooth Lerp
    this.x += (this.targetX - this.x) * 6.5 * dt;
    this.y += (this.targetY - this.y) * 6.5 * dt;

    // Clamp inside stage bounds
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));

    // Handle Screen Shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.x += offsetX;
      this.y += offsetY;
    }
  }
}

window.Camera = Camera;
