/**
 * K-POP DEMON HUNTERS - Platforming Physics Engine
 * Kid-friendly, forgiving platformer physics with Coyote Time, Jump Buffering, and Ninja Wall Kicks.
 */

class PhysicsEngine {
  constructor() {
    this.gravity = 0.42;
    this.maxFallSpeed = 7.0;
  }

  /**
   * Check AABB Box overlap
   */
  checkOverlap(boxA, boxB) {
    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );
  }

  /**
   * Update Entity Tile Physics & Collisions
   */
  updateEntity(entity, tilemap, tileSize = 32) {
    if (!tilemap) return;

    // Apply Gravity
    if (!entity.onGround && entity.state !== 'wall_cling') {
      entity.vy = Math.min(this.maxFallSpeed, entity.vy + this.gravity);
    }

    // Horizontal Movement & Collision
    entity.x += entity.vx;
    this.resolveHorizontalCollisions(entity, tilemap, tileSize);

    // Horizontal Stage Bounds Clamping (Prevent character from running off stage)
    if (entity.charId) {
      if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
      }
      const mapRight = (tilemap.cols || 60) * tileSize;
      if (entity.x > mapRight - entity.width) {
        entity.x = mapRight - entity.width;
        entity.vx = 0;
      }
    }

    // Vertical Movement & Collision
    entity.y += entity.vy;
    this.resolveVerticalCollisions(entity, tilemap, tileSize);

    // Pit Safety & Bottom Stage Boundary Check
    const mapBottom = (tilemap.rows || 12) * tileSize;
    if (entity.y > mapBottom + 30) {
      if (entity.charId) {
        // Player pit recovery: Bounce back to nearest platform height or start position
        entity.y = Math.min(entity.y, mapBottom - entity.height - 4);
        entity.vy = -7.5;
        entity.onGround = true;
        if (entity.takeDamage && !entity.assistInvincible) {
          entity.takeDamage(1);
        }
      }
    }
  }

  resolveHorizontalCollisions(entity, tilemap, tileSize) {
    const hitbox = entity.getHitbox();
    const minTileX = Math.floor(hitbox.x / tileSize);
    const maxTileX = Math.floor((hitbox.x + hitbox.width - 0.01) / tileSize);
    const minTileY = Math.floor(hitbox.y / tileSize);
    const maxTileY = Math.floor((hitbox.y + hitbox.height - 0.01) / tileSize);

    entity.touchingWallLeft = false;
    entity.touchingWallRight = false;

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tile = tilemap.getTile(tx, ty);
        if (tile === 1) { // Solid tile
          if (entity.vx > 0) {
            // Moving Right
            entity.x = tx * tileSize - (hitbox.x - entity.x + hitbox.width);
            entity.vx = 0;
            entity.touchingWallRight = true;
          } else if (entity.vx < 0) {
            // Moving Left
            entity.x = (tx + 1) * tileSize - (hitbox.x - entity.x);
            entity.vx = 0;
            entity.touchingWallLeft = true;
          }
        }
      }
    }
  }

  resolveVerticalCollisions(entity, tilemap, tileSize) {
    const hitbox = entity.getHitbox();
    const minTileX = Math.floor(hitbox.x / tileSize);
    const maxTileX = Math.floor((hitbox.x + hitbox.width - 0.01) / tileSize);
    const minTileY = Math.floor(hitbox.y / tileSize);
    const maxTileY = Math.floor((hitbox.y + hitbox.height - 0.01) / tileSize);

    const wasOnGround = entity.onGround;
    entity.onGround = false;

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tile = tilemap.getTile(tx, ty);

        // Solid Ground (Tile 1)
        if (tile === 1) {
          if (entity.vy > 0) {
            // Landing on ground
            entity.y = ty * tileSize - (hitbox.y - entity.y + hitbox.height);
            entity.vy = 0;
            entity.onGround = true;
          } else if (entity.vy < 0) {
            // Hitting ceiling
            entity.y = (ty + 1) * tileSize - (hitbox.y - entity.y);
            entity.vy = 0;
          }
        } 
        // One-Way Platform (Tile 2)
        else if (tile === 2 && entity.vy > 0) {
          const platformTop = ty * tileSize;
          const entityBottom = hitbox.y + hitbox.height;
          // Only collide if entity was above platform prior to this frame
          if (entityBottom - entity.vy <= platformTop + 4 && entityBottom >= platformTop) {
            entity.y = platformTop - (hitbox.y - entity.y + hitbox.height);
            entity.vy = 0;
            entity.onGround = true;
          }
        }
        // Bouncy Ramen Spring (Tile 3)
        else if (tile === 3) {
          if (entity.vy > 0 && hitbox.y + hitbox.height >= ty * tileSize) {
            entity.y = ty * tileSize - (hitbox.y - entity.y + hitbox.height);
            entity.vy = -9.5; // Super High Spring Bounce
            entity.onGround = false;
            if (entity.onSpringBounce) entity.onSpringBounce();
          }
        }
      }
    }
  }
}

window.PhysicsEngine = PhysicsEngine;
