/**
 * K-POP DEMON HUNTERS - Test Agent & QA Automation Engine
 * Autonomous AI bot, automated test runner (50+ assertions), bug watchdog & telemetry.
 */

class TestAgent {
  constructor(gameApp) {
    this.game = gameApp;
    this.enabled = false;
    this.mode = 'AUTOPILOT'; // 'AUTOPILOT', 'CHAOS_MONKEY', 'BOSS_RUSH', 'MINIGAME_BOT', 'ALBUM_BOT'
    
    // AI Decision timers
    this.aiTimer = 0;
    this.jumpCooldown = 0;
    this.attackCooldown = 0;
    this.slurpCooldown = 0;
    this.stuckTimer = 0;
    this.lastPlayerX = 0;
    this.targetStageIndex = 0;

    // Test Runner State
    this.isRunningTests = false;
    this.testResults = [];
    this.testStats = { total: 0, passed: 0, failed: 0, duration: 0 };
    this.lastTestReport = null;

    // Bug Watchdog
    this.detectedBugs = [];
    this.bugWatchdogActive = true;
    this.telemetry = {
      fps: 60,
      frameCount: 0,
      lastFpsUpdate: performance.now(),
      entityCount: 0,
      particleCount: 0,
      projectileCount: 0,
      playerPos: { x: 0, y: 0 },
      playerState: 'idle'
    };

    this.initWatchdog();
  }

  // =========================================================================
  // AUTOPILOT AI GAME CONTROLLER
  // =========================================================================

  toggleAutopilot(mode = 'AUTOPILOT') {
    if (this.enabled && this.mode === mode) {
      this.disableAutopilot();
    } else {
      this.enableAutopilot(mode);
    }
    return this.enabled;
  }

  enableAutopilot(mode = 'AUTOPILOT') {
    this.enabled = true;
    this.mode = mode;
    this.stuckTimer = 0;
    this.aiTimer = 0;
    if (this.game && this.game.input) {
      this.game.input.clearInjectedInputs();
    }
  }

  disableAutopilot() {
    this.enabled = false;
    if (this.game && this.game.input) {
      this.game.input.clearInjectedInputs();
    }
  }

  update(dt) {
    this.updateTelemetry(dt);
    if (this.bugWatchdogActive) this.runWatchdogCheck();

    if (!this.enabled || !this.game) return;

    this.aiTimer += dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.slurpCooldown > 0) this.slurpCooldown -= dt;

    const state = this.game.state;
    const input = this.game.input;

    // 1. Menu Auto-Navigation
    if (state === 'title') {
      input.setInjectedInput('jump', true);
      input.setInjectedInput('attack', true);
      return;
    } else if (state === 'character_select') {
      input.setInjectedInput('attack', true);
      return;
    } else if (state === 'stage_select') {
      input.setInjectedInput('attack', true);
      return;
    } else if (state === 'feast_select') {
      input.setInjectedInput('attack', true);
      return;
    } else if (state === 'chopstick_feast') {
      if (this.game.chopstickFeast) {
        const feast = this.game.chopstickFeast;
        if (feast.isCleared) {
          input.setInjectedInput('attack', true);
          input.setInjectedInput('jump', true);
        } else {
          const unEaten = feast.foodItems.find(f => !f.eaten);
          if (unEaten) {
            feast.setPointerPos(unEaten.x, unEaten.y, true);
            feast.tryGrabFood(this.game.sfx, this.game.particles);
            feast.chopstickY = 50;
            feast.executeSlurp(this.game.sfx, this.game.particles, this.game.player);
          }
        }
      }
      return;
    } else if (state === 'game_over' || state === 'game_win') {
      input.setInjectedInput('attack', true);
      input.setInjectedInput('jump', true);
      return;
    } else if (state === 'pause') {
      input.setInjectedInput('pause', true);
      return;
    }

    // 2. Mode-Specific AI Behavior
    if (this.mode === 'CHAOS_MONKEY') {
      this.runChaosMonkey(input);
    } else if (this.mode === 'MINIGAME_BOT' || state === 'ramen_game') {
      this.runMinigameBot(input);
    } else if (this.mode === 'ALBUM_BOT' || state === 'album') {
      this.runAlbumBot(input);
    } else {
      this.runAutopilot(dt, input);
    }
  }

  runAutopilot(dt, input) {
    const player = this.game.player;
    const level = this.game.levelManager;
    const tilemap = level.tilemap;
    if (!player || !tilemap) return;

    input.clearInjectedInputs();

    // Stuck detection: If player hasn't moved horizontally for 1.2s, perform jump/unstuck
    if (Math.abs(player.x - this.lastPlayerX) < 1.0) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.8) {
        input.setInjectedInput('jump', true);
        input.setInjectedInput('right', true);
        if (this.stuckTimer > 1.8) {
          input.setInjectedInput('left', true); // Try backing up
        }
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastPlayerX = player.x;

    // Normal progression: Walk towards the right
    input.setInjectedInput('right', true);

    const ts = tilemap.tileSize || 32;
    const forwardTileX = Math.floor((player.x + 36) / ts);
    const playerTileY = Math.floor((player.y + 16) / ts);
    const belowTileY = Math.floor((player.y + player.height + 4) / ts);

    // Platform Obstacle & Gap Lookahead
    const tileInFront = tilemap.getTile(forwardTileX, playerTileY);
    const tileBelowForward = tilemap.getTile(forwardTileX, belowTileY);

    // Jump over walls (solid tile 1) or pits (gap tile 0)
    if (tileInFront === 1 || (tileBelowForward === 0 && player.onGround)) {
      if (this.jumpCooldown <= 0) {
        input.setInjectedInput('jump', true);
        this.jumpCooldown = 0.35;
      }
    }

    // Ninja Wall Cling auto-kick
    if (player.state === 'wall_cling') {
      input.setInjectedInput('jump', true);
    }

    // Combat: Attack nearby enemies
    let closestEnemy = null;
    let closestDist = 9999;
    for (const enemy of level.enemies) {
      if (enemy.isDefeated) continue;
      const dist = Math.abs((enemy.x + enemy.width / 2) - (player.x + player.width / 2));
      if (dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy && closestDist < 75) {
      // Face towards enemy
      if (closestEnemy.x < player.x) {
        input.setInjectedInput('left', true);
        input.setInjectedInput('right', false);
      }
      if (this.attackCooldown <= 0) {
        input.setInjectedInput('attack', true);
        this.attackCooldown = 0.18;
      }
    }

    // Boss Combat Behavior
    if (level.boss && !level.boss.isDefeated && level.isArenaLocked) {
      const boss = level.boss;
      const bossDist = Math.abs((boss.x + boss.width / 2) - (player.x + player.width / 2));

      // Attack boss when close
      if (bossDist < 90 && this.attackCooldown <= 0) {
        input.setInjectedInput('attack', true);
        this.attackCooldown = 0.2;
      }

      // Dodge telegraphed attacks
      if (boss.state === 'telegraph' && this.jumpCooldown <= 0) {
        input.setInjectedInput('jump', true);
        this.jumpCooldown = 0.4;
      }
    }

    // Slurp Super Trigger when gauge ready and enemies/boss near
    if (player.slurpMeter >= 50 && (closestDist < 120 || (level.boss && !level.boss.isDefeated))) {
      if (this.slurpCooldown <= 0) {
        input.setInjectedInput('slurp', true);
        this.slurpCooldown = 2.0;
      }
    }
  }

  runChaosMonkey(input) {
    input.clearInjectedInputs();
    const actions = ['left', 'right', 'jump', 'attack', 'slurp', 'up', 'down'];
    // Random input bursts
    actions.forEach(act => {
      if (Math.random() < 0.35) {
        input.setInjectedInput(act, true);
      }
    });
  }

  runMinigameBot(input) {
    input.clearInjectedInputs();
    const minigame = this.game.ramenGame;
    if (!minigame || !minigame.isActive || minigame.isGameOver) return;

    // Find lowest falling ingredient
    let lowestItem = null;
    let maxItemY = -1;
    for (const item of minigame.ingredients) {
      if (item.y > maxItemY && item.y < minigame.bowlY + 20) {
        maxItemY = item.y;
        lowestItem = item;
      }
    }

    if (lowestItem) {
      const bowlCenter = minigame.bowlX + minigame.bowlWidth / 2;
      if (lowestItem.x < bowlCenter - 6) {
        input.setInjectedInput('left', true);
      } else if (lowestItem.x > bowlCenter + 6) {
        input.setInjectedInput('right', true);
      }
    }
  }

  runAlbumBot(input) {
    input.clearInjectedInputs();
    if (Math.floor(this.aiTimer * 2) % 2 === 0) {
      input.setInjectedInput('right', true);
    }
  }

  // =========================================================================
  // REAL-TIME BUG WATCHDOG & TELEMETRY
  // =========================================================================

  initWatchdog() {
    window.addEventListener('error', (e) => {
      this.logBug(`Uncaught Exception: ${e.message} at ${e.filename}:${e.lineno}`);
    });
    window.addEventListener('unhandledrejection', (e) => {
      this.logBug(`Unhandled Promise Rejection: ${e.reason}`);
    });
  }

  updateTelemetry(dt) {
    this.telemetry.frameCount++;
    const now = performance.now();
    if (now - this.telemetry.lastFpsUpdate >= 500) {
      this.telemetry.fps = Math.round((this.telemetry.frameCount * 1000) / (now - this.telemetry.lastFpsUpdate));
      this.telemetry.frameCount = 0;
      this.telemetry.lastFpsUpdate = now;
    }

    if (this.game && this.game.player) {
      this.telemetry.playerPos = { x: Math.round(this.game.player.x), y: Math.round(this.game.player.y) };
      this.telemetry.playerState = this.game.player.state;
      this.telemetry.particleCount = this.game.particles ? this.game.particles.particles.length : 0;
      this.telemetry.entityCount = this.game.levelManager ? this.game.levelManager.enemies.length + this.game.levelManager.collectibles.length : 0;
      this.telemetry.projectileCount = this.game.levelManager ? this.game.levelManager.playerProjectiles.length + this.game.levelManager.enemyProjectiles.length : 0;
    }
  }

  runWatchdogCheck() {
    if (!this.game || !this.game.player) return;
    const p = this.game.player;

    if (isNaN(p.x) || isNaN(p.y)) {
      this.logBug(`CRITICAL: Player coordinates became NaN! x=${p.x}, y=${p.y}`);
      p.x = 64; p.y = 180; p.vx = 0; p.vy = 0;
    }
    if (isNaN(p.vx) || isNaN(p.vy)) {
      this.logBug(`CRITICAL: Player velocity became NaN! vx=${p.vx}, vy=${p.vy}`);
      p.vx = 0; p.vy = 0;
    }

    if (p.hp < 0) {
      this.logBug(`Player health dropped below 0: ${p.hp}`);
      p.hp = 0;
    }
  }

  logBug(description) {
    const bug = {
      id: this.detectedBugs.length + 1,
      time: new Date().toLocaleTimeString(),
      description,
      state: this.game ? this.game.state : 'unknown'
    };
    this.detectedBugs.push(bug);
    console.warn(`[TEST AGENT BUG DETECTED]`, bug);
  }

  // =========================================================================
  // AUTOMATED TEST RUNNER (50+ ASSERTIONS)
  // =========================================================================

  async runAllTests() {
    this.isRunningTests = true;
    this.testResults = [];
    const startTime = performance.now();

    const assert = (suite, name, condition, details = '') => {
      const passed = Boolean(condition);
      this.testResults.push({ suite, name, passed, details });
      if (!passed) {
        this.logBug(`Test Failure [${suite} -> ${name}]: ${details}`);
      }
    };

    try {
      // -----------------------------------------------------------------------
      // SUITE 1: Engine Physics & Collisions
      // -----------------------------------------------------------------------
      const physics = new PhysicsEngine();
      assert('Physics Engine', 'PhysicsEngine instantiation', physics instanceof PhysicsEngine);
      assert('Physics Engine', 'Gravity constant is positive', physics.gravity > 0);
      assert('Physics Engine', 'Max fall speed is defined', physics.maxFallSpeed >= 5.0);

      // AABB overlap checks
      const boxA = { x: 10, y: 10, width: 20, height: 20 };
      const boxB = { x: 20, y: 20, width: 20, height: 20 };
      const boxC = { x: 100, y: 100, width: 20, height: 20 };
      assert('Physics Engine', 'AABB Overlap detects colliding boxes', physics.checkOverlap(boxA, boxB) === true);
      assert('Physics Engine', 'AABB Overlap detects non-colliding boxes', physics.checkOverlap(boxA, boxC) === false);

      // -----------------------------------------------------------------------
      // SUITE 2: Idol Demon Hunter Characters & Mechanics
      // -----------------------------------------------------------------------
      const pLuna = new Player('luna');
      const pMinho = new Player('minho');
      const pHana = new Player('hana');
      const pFelix = new Player('felix');

      assert('Player System', 'Luna character init', pLuna.charId === 'luna');
      assert('Player System', 'Minho character init', pMinho.charId === 'minho');
      assert('Player System', 'Hana character init', pHana.charId === 'hana');
      assert('Player System', 'Felix character init', pFelix.charId === 'felix');
      assert('Player System', 'Player default maxHp is 4', pLuna.maxHp === 4 && pLuna.hp === 4);
      assert('Player System', 'Player Assist Mode defaults to ON for 4-year-olds', pLuna.assistInvincible === true);

      // Character Sword Color Check
      assert('Player System', 'Luna sword glow is Cyan (#00f0ff)', pLuna.getSwordColor() === '#00f0ff');
      assert('Player System', 'Minho sword glow is Gold (#ffaa00)', pMinho.getSwordColor() === '#ffaa00');
      assert('Player System', 'Hana sword glow is Pink (#ff1493)', pHana.getSwordColor() === '#ff1493');
      assert('Player System', 'Felix sword glow is Violet (#cc00ff)', pFelix.getSwordColor() === '#cc00ff');

      // Mock Sound & Particle Systems with complete callback signatures
      const mockSFX = {
        playSlash: () => {},
        playJump: () => {},
        playBounce: () => {},
        playStar: () => {},
        playSlurp: () => {},
        playRainbowFever: () => {},
        playEnemyHit: () => {},
        playEnemyDefeat: () => {},
        playPlayerHurt: () => {},
        playBossRoar: () => {},
        playChopsticks: () => {},
        playWallKick: () => {}
      };
      const mockParticles = {
        spawnSlashTrail: () => {},
        spawnSparkleBurst: () => {},
        spawnRamenSlurpFX: () => {},
        spawnVictoryConfetti: () => {}
      };

      // Combo System
      const pCombat = new Player('luna');
      const projList = [];
      pCombat.executeAttack(mockSFX, mockParticles, projList);
      assert('Combat System', 'Player attack sets attack state and timer', pCombat.state === 'attack' && pCombat.attackTimer > 0);
      assert('Combat System', 'Player sword hitbox is active during attack', pCombat.getSwordHitbox() !== null);
      assert('Combat System', 'Player combo increments to 2', pCombat.combo === 2);

      // Spicy Fire Ramen Mode
      const pSpicy = new Player('luna');
      pSpicy.activateSpicyMode(10);
      assert('Power-Ups', 'Spicy mode is active', pSpicy.spicyTimer === 10);
      assert('Power-Ups', 'Spicy mode changes sword color to #ff3300', pSpicy.getSwordColor() === '#ff3300');
      const spicyProjList = [];
      pSpicy.executeAttack(mockSFX, mockParticles, spicyProjList);
      assert('Power-Ups', 'Spicy attack spawns PlayerSlashWave projectile', spicyProjList.length > 0 && spicyProjList[0] instanceof PlayerSlashWave);

      // Rainbow Golden Ramen Fever
      const pRainbow = new Player('luna');
      pRainbow.activateRainbowFever(12);
      assert('Power-Ups', 'Rainbow Fever activates invincibility', pRainbow.rainbowFeverTimer === 12 && pRainbow.invincibleTimer === 12);
      assert('Power-Ups', 'Rainbow Fever changes sword color to #ffe600', pRainbow.getSwordColor() === '#ffe600');

      // Slurp Super Strike
      const pSlurp = new Player('luna');
      pSlurp.slurpMeter = 50;
      const superProjList = [];
      pSlurp.triggerSlurpSuper(mockSFX, mockParticles, { shake: () => {} }, superProjList);
      assert('Combat System', 'Slurp Super triggers 360 shockwave (8 projectiles)', superProjList.length === 8);
      assert('Combat System', 'Slurp Super consumes slurp meter to 0', pSlurp.slurpMeter === 0);

      // Assist Mode Damage vs Normal Mode Damage
      const pAssist = new Player('luna');
      pAssist.assistInvincible = true;
      pAssist.invincibleTimer = 0;
      pAssist.takeDamage(1, mockSFX, mockParticles);
      assert('Assist Mode', 'Playful invincibility prevents HP loss', pAssist.hp === pAssist.maxHp);

      const pNormal = new Player('luna');
      pNormal.assistInvincible = false;
      pNormal.invincibleTimer = 0;
      pNormal.takeDamage(1, mockSFX, mockParticles);
      assert('Standard Mode', 'Non-assist mode deducts HP properly', pNormal.hp === pNormal.maxHp - 1);

      // -----------------------------------------------------------------------
      // SUITE 3: Enemies & Boss Battles
      // -----------------------------------------------------------------------
      const imp = new Enemy(100, 100, 'imp');
      const dokkaebi = new Enemy(100, 100, 'dokkaebi');
      const ghoul = new Enemy(100, 100, 'ghoul');
      const bat = new Enemy(100, 100, 'bat');
      const dumpling = new Enemy(100, 100, 'dumpling');

      assert('Enemy System', 'Imp enemy init', imp.type === 'imp' && imp.hp === 1);
      assert('Enemy System', 'Dokkaebi goblin has 2 HP', dokkaebi.type === 'dokkaebi' && dokkaebi.hp === 2);
      assert('Enemy System', 'Ghoul ghost init', ghoul.type === 'ghoul');
      assert('Enemy System', 'Bat enemy init', bat.type === 'bat');
      assert('Enemy System', 'Dumpling enemy init', dumpling.type === 'dumpling');

      // Enemy Damage & Drops
      const enemyDrops = [];
      imp.takeDamage(1, mockSFX, mockParticles, enemyDrops);
      assert('Enemy System', 'Enemy defeat drops collectible', imp.isDefeated === true && enemyDrops.length > 0);

      // Boss Battles
      const bossDJ = new Boss(200, 200, 'dj_dokkaebi');
      const bossRamen = new Boss(200, 200, 'ramen_fiend');
      const bossKing = new Boss(200, 200, 'shadow_king');

      assert('Boss System', 'DJ Dokkaebi boss init with 8 HP', bossDJ.type === 'dj_dokkaebi' && bossDJ.hp === 8);
      assert('Boss System', 'Giant Ramen Fiend boss init with 10 HP', bossRamen.type === 'ramen_fiend' && bossRamen.hp === 10);
      assert('Boss System', 'Shadow Demon King boss init with 12 HP', bossKing.type === 'shadow_king' && bossKing.hp === 12);

      // Boss Attack Telegraph
      bossDJ.attackTimer = 0;
      bossDJ.update(0.01, pNormal, [], mockParticles, mockSFX, { shake: () => {} });
      assert('Boss System', 'Boss transitions to telegraph state for kids', bossDJ.state === 'telegraph' && bossDJ.telegraphTimer > 0);

      // -----------------------------------------------------------------------
      // SUITE 4: Level Data & Stages
      // -----------------------------------------------------------------------
      assert('Level System', 'STAGES_DATA defines 4 stages', Array.isArray(STAGES_DATA) && STAGES_DATA.length === 4);
      STAGES_DATA.forEach((stage, idx) => {
        const grid = stage.buildTilemap();
        assert('Level System', `Stage ${idx + 1} (${stage.name}) tilemap generation`, grid.length === stage.heightTiles && grid[0].length === stage.widthTiles);
        assert('Level System', `Stage ${idx + 1} has valid enemy spawns`, stage.spawns.enemies.length > 0);
        assert('Level System', `Stage ${idx + 1} has valid collectibles`, stage.spawns.collectibles.length > 0);
      });

      // -----------------------------------------------------------------------
      // SUITE 5: Collectibles
      // -----------------------------------------------------------------------
      const colRamen = new Collectible(50, 50, 'ramen_normal');
      const colSpicy = new Collectible(50, 50, 'ramen_spicy');
      const colRainbow = new Collectible(50, 50, 'ramen_rainbow');
      const colStar = new Collectible(50, 50, 'star');
      const colChopsticks = new Collectible(50, 50, 'chopsticks');

      pLuna.hp = 2;
      colRamen.onCollect(pLuna, mockSFX, mockParticles);
      assert('Collectibles', 'Shoyu Ramen heals 1 heart & adds slurp', pLuna.hp === 3 && colRamen.collected);

      colStar.onCollect(pLuna, mockSFX, mockParticles);
      assert('Collectibles', 'Star increments starsCollected count', pLuna.starsCollected >= 1 && colStar.collected);

      colChopsticks.onCollect(pLuna, mockSFX, mockParticles);
      assert('Collectibles', 'Golden Chopsticks unlock golden chopsticks flag', pLuna.hasGoldenChopsticks === true);

      // -----------------------------------------------------------------------
      // SUITE 6: Audio Chiptune Synthesizer
      // -----------------------------------------------------------------------
      const synth = new ChiptuneSynth();
      assert('Audio Engine', 'ChiptuneSynth instantiation', synth instanceof ChiptuneSynth);
      assert('Audio Engine', 'Audio mute toggle works', synth.toggleMute() === true && synth.toggleMute() === false);

      const music = new MusicPlayer(synth);
      assert('Audio Engine', 'MusicPlayer defines Title track', music.getTrackData('title').tempo > 0);
      assert('Audio Engine', 'MusicPlayer defines Stage 1 track', music.getTrackData('stage1').tempo > 0);
      assert('Audio Engine', 'MusicPlayer defines Boss track', music.getTrackData('boss').tempo > 0);
      assert('Audio Engine', 'MusicPlayer defines Victory track', music.getTrackData('victory').tempo > 0);

      // -----------------------------------------------------------------------
      // SUITE 7: Photocard Album & Ramen Minigame
      // -----------------------------------------------------------------------
      const album = new PhotocardAlbum();
      assert('Photocard Album', 'Album has at least 6 collectible photocards', album.cards.length >= 6);

      const minigame = new RamenMinigame();
      minigame.start();
      assert('Ramen Minigame', 'Ramen minigame starts active with 40s timer', minigame.isActive && minigame.timeLeft === 40);
      minigame.bowlX = 100;
      minigame.ingredients = [{ x: 110, y: minigame.bowlY + 5, vy: 1, type: 'naruto', size: 16 }];
      minigame.update(0.01, { isLeft: () => false, isRight: () => false }, mockSFX, mockParticles, 384);
      assert('Ramen Minigame', 'Minigame catches falling ingredients and scores points', minigame.score === 35);

      // -----------------------------------------------------------------------
      // SUITE 8: Input Edge-Trigger & Injection
      // -----------------------------------------------------------------------
      const input = new InputManager();
      assert('Input System', 'InputManager has edge-trigger methods', typeof input.justLeft === 'function' && typeof input.justRight === 'function');
      input.setInjectedInput('jump', true);
      assert('Input System', 'Test Agent can inject simulated inputs', input.isJump() === true);
      input.clearInjectedInputs();
      assert('Input System', 'Injected inputs cleared', input.isJump() === false);

      // -----------------------------------------------------------------------
      // SUITE 9: Chopstick Ramen Feast Interactive Engine & Courses
      // -----------------------------------------------------------------------
      const feastGame = new ChopstickFeastGame();
      assert('Chopstick Feast', 'ChopstickFeastGame instantiation', feastGame instanceof ChopstickFeastGame);
      assert('Chopstick Feast', 'Defines 4 unique gourmet feast courses', feastGame.courses.length === 4);
      feastGame.startFeast(0, 'rumi', false, 1);
      assert('Chopstick Feast', 'Feast starts active with populated bowl items', feastGame.isActive && feastGame.foodItems.length >= 10);
      const testFood = feastGame.foodItems[0];
      feastGame.chopstickX = testFood.x;
      feastGame.chopstickY = testFood.y;
      feastGame.tryGrabFood(mockSFX, mockParticles);
      assert('Chopstick Feast', 'Golden chopsticks grab food items within range', feastGame.heldItem === testFood);
      feastGame.chopstickY = 50;
      feastGame.executeSlurp(mockSFX, mockParticles, pLuna);
      assert('Chopstick Feast', 'Idol slurps food item and increments yummy counter', feastGame.slurpCount === 1 && testFood.eaten);

    } catch (err) {
      assert('Execution Integrity', 'Uncaught test execution exception', false, err.message);
    }

    const duration = Math.round(performance.now() - startTime);
    const passedCount = this.testResults.filter(r => r.passed).length;
    const failedCount = this.testResults.filter(r => !r.passed).length;

    this.testStats = {
      total: this.testResults.length,
      passed: passedCount,
      failed: failedCount,
      duration: duration
    };

    this.isRunningTests = false;
    this.lastTestReport = this.generateReport();
    return this.testStats;
  }

  generateReport() {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      stats: this.testStats,
      results: this.testResults,
      detectedBugs: this.detectedBugs
    };
  }
}

window.TestAgent = TestAgent;
