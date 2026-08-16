/**
 * K-POP DEMON HUNTERS - Chopstick Ramen Eating Feast Level
 * An interactive, toddler-friendly feast where players control golden chopsticks
 * to pick up noodles and delicious toppings to feed their idol hunter!
 */

class ChopstickFeastGame {
  constructor() {
    this.isActive = false;
    this.feastIndex = 0; // 0 to 3
    this.isStandalone = false; // Whether launched directly from menu or in-between stages
    this.nextStageIndex = 1;
    this.charId = 'rumi';

    // Chopstick Cursor Position & State
    this.chopstickX = 192;
    this.chopstickY = 130;
    this.targetX = 192;
    this.targetY = 130;
    this.isPinched = false;
    this.pinchTimer = 0;

    // Grabbed Item State
    this.heldItem = null;
    this.slurpTimer = 0;
    this.isSlurping = false;
    this.slurpCount = 0;
    this.totalGoal = 10;
    this.isCleared = false;
    this.clearTimer = 0;
    this.animTimer = 0;

    // Food Items in the Bowl
    this.foodItems = [];

    // 4 Feast Course Definitions
    this.courses = [
      {
        id: 0,
        name: "FEAST 1: SEOUL NIGHT MARKET BOWL",
        broth: "Rich Tonkotsu Pork & Sesame Broth",
        color: '#ff9900',
        brothColor: '#fcd34d',
        bg: '#180a2a',
        toppings: ['noodle', 'egg', 'naruto', 'nori', 'star', 'dumpling'],
        desc: "Classic rich broth with bouncy noodles and golden soft-boiled eggs!"
      },
      {
        id: 1,
        name: "FEAST 2: CONCERT DOME GOLDEN EGG DELIGHT",
        broth: "Silky Butter Corn & Golden Miso",
        color: '#ffd700',
        brothColor: '#fef08a',
        bg: '#140326',
        toppings: ['noodle', 'golden_egg', 'naruto', 'chili', 'star', 'dumpling'],
        desc: "Triple golden soft eggs and sweet corn for maximum idol energy!"
      },
      {
        id: 2,
        name: "FEAST 3: MYSTIC CHERRY SHRINE RAINBOW RAMEN",
        broth: "Sparkling Rainbow Dragon Broth",
        color: '#00f0ff',
        brothColor: '#a7f3d0',
        bg: '#0a122c',
        toppings: ['noodle', 'rainbow_star', 'naruto', 'dumpling', 'nori', 'golden_egg'],
        desc: "Magical glowing broth infused with cherry blossoms and star power!"
      },
      {
        id: 3,
        name: "FEAST 4: OVERLORD SPICY VOLCANO FEAST",
        broth: "Royal Fiery Habanero Chili Broth",
        color: '#ff0055',
        brothColor: '#f87171',
        bg: '#1a001a',
        toppings: ['noodle', 'chili', 'golden_egg', 'naruto', 'dumpling', 'rainbow_star'],
        desc: "Ultra spicy demon-fire noodles for true Demon Hunter Champions!"
      }
    ];
  }

  startFeast(feastIndex = 0, charId = 'rumi', isStandalone = false, nextStageIndex = 1) {
    this.isActive = true;
    this.feastIndex = feastIndex % this.courses.length;
    this.charId = charId;
    this.isStandalone = isStandalone;
    this.nextStageIndex = nextStageIndex;

    this.chopstickX = 192;
    this.chopstickY = 135;
    this.targetX = 192;
    this.targetY = 135;
    this.isPinched = false;
    this.pinchTimer = 0;
    this.heldItem = null;
    this.isSlurping = false;
    this.slurpTimer = 0;
    this.slurpCount = 0;
    this.isCleared = false;
    this.clearTimer = 0;
    this.animTimer = 0;

    this.initBowlItems();
  }

  initBowlItems() {
    this.foodItems = [];
    const course = this.courses[this.feastIndex];
    const bowlCenterX = 192;
    const bowlCenterY = 145;

    // Spawn 12 Noodle Strands (Interlocking curved spring lines)
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
      const r = 15 + Math.random() * 32;
      this.foodItems.push({
        id: `noodle_${i}`,
        type: 'noodle',
        x: bowlCenterX + Math.cos(angle) * r,
        y: bowlCenterY + Math.sin(angle) * (r * 0.55),
        origX: bowlCenterX + Math.cos(angle) * r,
        origY: bowlCenterY + Math.sin(angle) * (r * 0.55),
        radius: 12,
        eaten: false,
        name: 'Springy Ramen Noodle'
      });
    }

    // Spawn signature toppings scattered in the bowl
    const toppingTypes = course.toppings;
    toppingTypes.forEach((type, idx) => {
      const angle = (Math.PI * 2 / toppingTypes.length) * idx + 0.4;
      const r = 24 + Math.random() * 20;
      this.foodItems.push({
        id: `topping_${idx}`,
        type: type,
        x: bowlCenterX + Math.cos(angle) * r,
        y: bowlCenterY + Math.sin(angle) * (r * 0.5),
        origX: bowlCenterX + Math.cos(angle) * r,
        origY: bowlCenterY + Math.sin(angle) * (r * 0.5),
        radius: 14,
        eaten: false,
        name: this.getToppingName(type)
      });
    });

    this.totalGoal = Math.min(10, this.foodItems.length);
  }

  getToppingName(type) {
    if (type === 'egg') return 'Soft-Boiled Ramen Egg';
    if (type === 'golden_egg') return 'Golden Molten Egg';
    if (type === 'naruto') return 'Pink Whirl Narutomaki';
    if (type === 'chili') return 'Spicy Red Kimchi Chili';
    if (type === 'nori') return 'Crisp Nori Seaweed';
    if (type === 'dumpling') return 'Golden Pork Gyoza';
    if (type === 'rainbow_star') return 'Rainbow Idol Star';
    return 'Gourmet Noodle';
  }

  update(dt, input, sfx, particles, player = null) {
    if (!this.isActive) return;
    this.animTimer += dt;

    if (this.isCleared) {
      this.clearTimer -= dt;
      if (Math.random() < 0.3 && particles) {
        particles.spawnSparkleBurst(192 + (Math.random() * 160 - 80), 120 + (Math.random() * 80 - 40), 12, '#ffe600');
      }
      return;
    }

    // Move Chopsticks via Keyboard / Gamepad (if not touch dragging)
    const moveSpeed = 160;
    if (input.isLeft()) this.targetX -= moveSpeed * dt;
    if (input.isRight()) this.targetX += moveSpeed * dt;
    if (input.isUp()) this.targetY -= moveSpeed * dt;
    if (input.isDown()) this.targetY += moveSpeed * dt;

    // Bounds Clamping (Keep inside dining view)
    this.targetX = Math.max(100, Math.min(284, this.targetX));
    this.targetY = Math.max(30, Math.min(185, this.targetY));

    // Smooth Lerp Chopstick Position
    this.chopstickX += (this.targetX - this.chopstickX) * (dt * 14);
    this.chopstickY += (this.targetY - this.chopstickY) * (dt * 14);

    // Chopstick Pinch Trigger (Attack Button, Jump Button, Slurp Button, or Direct Click)
    const isPinchingNow = input.isAttack() || input.isJump() || input.isSlurp() || input.isTouchPressed;

    if (isPinchingNow && !this.isPinched) {
      this.isPinched = true;
      this.tryGrabFood(sfx, particles);
    } else if (!isPinchingNow && this.isPinched) {
      this.isPinched = false;
      // If holding an item and moved it up towards idol mouth (Y < 75), slurp it!
      if (this.heldItem) {
        if (this.chopstickY < 85) {
          this.executeSlurp(sfx, particles, player);
        } else {
          // Drop back into bowl smoothly
          this.heldItem = null;
        }
      }
    }

    // Auto-Slurp when dragging food item directly up into mouth
    if (this.heldItem && this.chopstickY < 70 && !this.isSlurping) {
      this.executeSlurp(sfx, particles, player);
    }

    // Slurp Animation Timer
    if (this.isSlurping) {
      this.slurpTimer -= dt;
      if (this.slurpTimer <= 0) {
        this.isSlurping = false;
      }
    }
  }

  tryGrabFood(sfx, particles) {
    if (this.heldItem) return;

    // Check collision between chopstick tips and closest food item
    const tipX = this.chopstickX;
    const tipY = this.chopstickY;

    for (const item of this.foodItems) {
      if (item.eaten) continue;
      const dist = Math.hypot(item.x - tipX, item.y - tipY);
      if (dist < item.radius + 10) {
        this.heldItem = item;
        if (sfx) sfx.playSlash(1);
        if (particles) particles.spawnSparkleBurst(item.x, item.y, 6, '#ffe600');
        break;
      }
    }
  }

  executeSlurp(sfx, particles, player) {
    if (!this.heldItem) return;

    const item = this.heldItem;
    item.eaten = true;
    this.heldItem = null;
    this.isSlurping = true;
    this.slurpTimer = 0.45;
    this.slurpCount++;

    // Satisfying sound & sparkles
    if (sfx) {
      sfx.playSlurp();
      if (this.slurpCount % 3 === 0) sfx.playVocalDaebak();
      else sfx.playVocalHyeah();
    }

    if (particles) {
      particles.spawnRamenSlurpFX(192, 58);
      particles.spawnSparkleBurst(192, 58, 20, '#ff007f');
    }

    // Heal player if present
    if (player) {
      player.heal(1);
      player.addSlurpMeter(25);
      player.score += 250;
    }

    // Check Feast Cleaned / Cleared
    const remaining = this.foodItems.filter(f => !f.eaten).length;
    if (remaining <= 2 || this.slurpCount >= this.totalGoal) {
      this.isCleared = true;
      this.clearTimer = 3.5;
      if (sfx) sfx.playRainbowFever();
      if (particles) particles.spawnVictoryConfetti(192, 100, 384);
    }
  }

  setPointerPos(x, y, isDown = false) {
    this.targetX = x;
    this.targetY = y;
    if (isDown) {
      this.isPinched = true;
    }
  }

  draw(ctx, spriteRenderer, viewportWidth = 384, viewportHeight = 216) {
    if (!this.isActive) return;

    const course = this.courses[this.feastIndex];

    ctx.save();

    // 1. Cozy Ramen Restaurant Background
    ctx.fillStyle = course.bg;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Bamboo / Lantern Wooden Counter
    ctx.fillStyle = '#2b103c';
    ctx.fillRect(0, 115, viewportWidth, viewportHeight - 115);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(0, 115, viewportWidth, 3);

    // Warm Noren Curtains at Top
    ctx.fillStyle = '#ff0055';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 48 + 4, 0, 40, 22);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(i * 48 + 18, 6, 12, 10);
      ctx.fillStyle = '#ff0055';
    }

    // Top Bar (Course Name & Slurp Progress)
    ctx.fillStyle = 'rgba(8, 2, 18, 0.92)';
    ctx.fillRect(0, 0, viewportWidth, 24);
    ctx.fillStyle = course.color;
    ctx.fillRect(0, 23, viewportWidth, 1);

    ctx.fillStyle = '#ffe600';
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText(`🍜 ${course.name}`, 10, 15);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`YUMMY METER: ${this.slurpCount}/${this.totalGoal}`, viewportWidth - 10, 15);
    ctx.textAlign = 'left';

    // 2. Idol Hunter Eating Portrait Behind Counter
    this.drawIdolPortrait(ctx, spriteRenderer, 192, 48);

    // 3. Giant Ceramic Ramen Bowl with Broth & Ingredients
    this.drawFeastBowl(ctx, spriteRenderer, 192, 148, course);

    // 4. Food Items in the Bowl
    for (const item of this.foodItems) {
      if (item.eaten && item !== this.heldItem) continue;

      let drawX = item.x;
      let drawY = item.y;

      // If item is currently held by chopsticks, follow chopstick tips!
      if (item === this.heldItem) {
        drawX = this.chopstickX;
        drawY = this.chopstickY + 12;
      }

      this.drawFoodItem(ctx, spriteRenderer, item, drawX, drawY);
    }

    // 5. Golden Chopsticks Cursor
    this.drawChopsticks(ctx, this.chopstickX, this.chopstickY, this.isPinched);

    // 6. Victory Banner
    if (this.isCleared) {
      ctx.fillStyle = 'rgba(10, 2, 22, 0.94)';
      ctx.fillRect(35, 45, viewportWidth - 70, 125);
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2;
      ctx.strokeRect(35, 45, viewportWidth - 70, 125);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe600';
      ctx.font = "12px 'Press Start 2P', monospace";
      ctx.fillText("🍜 DELICIOUS BOWL FINISHED! 🍜", viewportWidth / 2, 75);

      ctx.fillStyle = '#00f0ff';
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.fillText("★ ALL NOODLES & TOPPINGS SLURPED! ★", viewportWidth / 2, 105);

      ctx.fillStyle = '#ffffff';
      ctx.font = "7px 'Press Start 2P', monospace";
      ctx.fillText("PRESS ANY BUTTON / TAP TO CONTINUE", viewportWidth / 2, 145);
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  drawIdolPortrait(ctx, spriteRenderer, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Character Face and Hair
    let hairColor = '#00f0ff';
    if (this.charId === 'mira') hairColor = '#ffaa00';
    if (this.charId === 'zoey') hairColor = '#ff1493';
    if (this.charId === 'jinu') hairColor = '#cc00ff';

    // Head
    ctx.fillStyle = '#ffd1b3';
    ctx.fillRect(-14, -14, 28, 26);

    // Hair Top
    ctx.fillStyle = hairColor;
    ctx.fillRect(-16, -18, 32, 10);
    ctx.fillRect(-16, -14, 6, 22);
    ctx.fillRect(10, -14, 6, 22);

    // Eyes (Happy blinking / starry eyes)
    if (this.isSlurping) {
      // Happy closed happy eye arcs
      ctx.fillStyle = '#1c0828';
      ctx.fillRect(-8, -4, 5, 2);
      ctx.fillRect(3, -4, 5, 2);
      // Pink blush cheeks
      ctx.fillStyle = '#ff77bb';
      ctx.fillRect(-12, 1, 6, 4);
      ctx.fillRect(6, 1, 6, 4);
      // Open Slurping Mouth!
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-4, 3, 8, 8);
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(-2, 4, 4, 3);
    } else {
      // Big sparkle anime eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-9, -6, 6, 7);
      ctx.fillRect(3, -6, 6, 7);
      ctx.fillStyle = '#1c0828';
      ctx.fillRect(-8, -5, 4, 5);
      ctx.fillRect(4, -5, 4, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8, -5, 2, 2);
      ctx.fillRect(4, -5, 2, 2);
      // Smile
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-3, 4, 6, 3);
    }

    ctx.restore();
  }

  drawFeastBowl(ctx, spriteRenderer, cx, cy, course) {
    ctx.save();
    // Bowl Outer Rim (Large Oval)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = course.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 95, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ceramic Design Rim Pattern
    ctx.strokeStyle = course.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Broth Fill
    ctx.fillStyle = course.brothColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 86, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Broth Shimmer & Steam
    const shimmer = Math.sin(this.animTimer * 4) * 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx - 30, cy - 10 + shimmer, 24, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawFoodItem(ctx, spriteRenderer, item, x, y) {
    ctx.save();
    ctx.translate(x, y);

    if (item.type === 'noodle') {
      // Curved Springy Noodle Strand
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.quadraticCurveTo(0, 8, 10, -4);
      ctx.stroke();
      ctx.strokeStyle = '#fff59d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (item.type === 'egg') {
      // Soft Boiled Egg
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'golden_egg') {
      // Golden Egg
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'naruto') {
      // Pink Swirl Narutomaki
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff007f';
      ctx.fillRect(-4, -2, 8, 4);
    } else if (item.type === 'nori') {
      // Dark Nori Sheet
      ctx.fillStyle = '#1e3a1e';
      ctx.fillRect(-8, -10, 16, 20);
    } else if (item.type === 'dumpling') {
      // Golden Gyoza Dumpling
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 9, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-8, 0, 16, 2);
    } else if (item.type === 'chili') {
      // Fiery Chili Pepper
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-4, -7, 8, 14);
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(-2, -9, 4, 3);
    } else if (item.type === 'rainbow_star' || item.type === 'star') {
      // Glowing Star
      spriteRenderer.drawStar(ctx, -8, -8, this.animTimer, 1.3);
    }

    ctx.restore();
  }

  drawChopsticks(ctx, x, y, isPinched) {
    ctx.save();
    ctx.translate(x, y);

    const pinchAngle = isPinched ? 0.08 : 0.28;

    // Glowing Golden Chopsticks Pair
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 10;

    // Left Chopstick
    ctx.save();
    ctx.rotate(-pinchAngle);
    ctx.fillRect(-2, -45, 4, 50);
    ctx.fillStyle = '#00f0ff'; // Neon grip
    ctx.fillRect(-2, -45, 4, 12);
    ctx.restore();

    // Right Chopstick
    ctx.save();
    ctx.rotate(pinchAngle);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-2, -45, 4, 50);
    ctx.fillStyle = '#ff007f'; // Neon grip
    ctx.fillRect(-2, -45, 4, 12);
    ctx.restore();

    // Pinch Grip Indicator Sparkle
    if (isPinched) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -2, 6, 6);
    }

    ctx.restore();
  }
}

window.ChopstickFeastGame = ChopstickFeastGame;
