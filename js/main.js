/**
 * K-POP DEMON HUNTERS: 8-BIT RAMEN RUSH - Main Game Controller
 */

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Internal virtual 8-bit resolution (16:9 NES Widescreen)
    this.virtualWidth = 384;
    this.virtualHeight = 216;

    // Subsystems
    this.synth = new ChiptuneSynth();
    this.sfx = new SoundEffects(this.synth);
    this.music = new MusicPlayer(this.synth);
    this.input = new InputManager();
    this.particles = new ParticleSystem();
    this.physics = new PhysicsEngine();
    this.camera = new Camera(this.virtualWidth, this.virtualHeight);
    this.spriteRenderer = new SpriteRenderer();

    // Entities & Levels
    this.player = new Player('luna');
    this.levelManager = new LevelManager();
    this.hud = new HUD();
    this.menus = new MenuManager();
    this.album = new PhotocardAlbum();
    this.ramenGame = new RamenMinigame();
    this.chopstickFeast = new ChopstickFeastGame();

    // Global Game Audio & App Ref
    window.gameAudio = { synth: this.synth, sfx: this.sfx, music: this.music };
    window.gameApp = this;

    // App State & Cheats/Speed for QA & Testing
    this.state = 'title';
    this.gameSpeed = 1.0;
    this.godMode = false;
    this.infiniteSlurp = false;

    this.lastTime = 0;
    this.isAudioStarted = false;

    this.initDOM();
  }

  initDOM() {
    // 1. Audio Start Prompt & Direct Game Launch
    const prompt = document.getElementById('audio-start-prompt');
    const startBtn = document.getElementById('btn-start-audio');

    const handleStartAudio = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      try {
        if (!this.isAudioStarted) {
          this.synth.init();
          this.synth.resume();
          this.isAudioStarted = true;
        }
        if (this.music) this.music.playTrack('title');
        if (this.sfx) this.sfx.playStar();
      } catch (err) {
        console.warn('Audio start error:', err);
      }

      if (prompt) prompt.style.display = 'none';

      // Advance directly from title screen into character selection!
      if (this.state === 'title') {
        this.state = 'character_select';
        this.menus.currentScreen = 'character_select';
      }
    };

    if (startBtn) {
      startBtn.addEventListener('click', handleStartAudio);
      startBtn.addEventListener('pointerdown', handleStartAudio);
      startBtn.addEventListener('touchstart', handleStartAudio, { passive: false });
    }

    if (prompt) {
      prompt.addEventListener('click', handleStartAudio);
      prompt.addEventListener('pointerdown', handleStartAudio);
      prompt.addEventListener('touchstart', handleStartAudio, { passive: false });
    }

    // 2. CRT Toggle
    const crtBtn = document.getElementById('toggle-crt');
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtBtn && crtOverlay) {
      crtBtn.addEventListener('click', () => {
        const isEnabled = crtOverlay.classList.toggle('crt-enabled');
        crtBtn.textContent = `CRT: ${isEnabled ? 'ON' : 'OFF'}`;
      });
    }

    // 3. Sound Toggle
    const soundBtn = document.getElementById('toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = this.synth.toggleMute();
        soundBtn.textContent = isMuted ? 'UNMUTE' : 'MUTE';
      });
    }

    // 4. Assist Toggle
    const assistBtn = document.getElementById('toggle-assist');
    if (assistBtn) {
      assistBtn.addEventListener('click', () => {
        this.player.assistInvincible = !this.player.assistInvincible;
        assistBtn.textContent = `👶 ASSIST: ${this.player.assistInvincible ? 'ON' : 'OFF'}`;
        assistBtn.classList.toggle('active', this.player.assistInvincible);
        if (this.sfx) this.sfx.playStar();
      });
    }

    // 5. Header Navigation Buttons (Game, Chopsticks, Ramen Minigame, Photocard Album)
    const btnGame = document.getElementById('btn-nav-game');
    const btnFeast = document.getElementById('btn-nav-feast');
    const btnMinigame = document.getElementById('btn-nav-minigame');
    const btnAlbum = document.getElementById('btn-nav-album');

    const updateNavActive = (activeBtn) => {
      [btnGame, btnFeast, btnMinigame, btnAlbum].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (btnGame) {
      btnGame.addEventListener('click', () => {
        updateNavActive(btnGame);
        if (this.state !== 'playing') {
          this.state = 'character_select';
          this.menus.currentScreen = 'character_select';
          if (this.music) this.music.playTrack('title');
        }
      });
    }

    if (btnFeast) {
      btnFeast.addEventListener('click', () => {
        updateNavActive(btnFeast);
        this.state = 'feast_select';
        this.menus.currentScreen = 'feast_select';
        if (this.music) this.music.playTrack('stage1');
      });
    }

    if (btnMinigame) {
      btnMinigame.addEventListener('click', () => {
        updateNavActive(btnMinigame);
        this.state = 'ramen_game';
        this.ramenGame.start();
        if (this.music) this.music.playTrack('stage1');
      });
    }

    if (btnAlbum) {
      btnAlbum.addEventListener('click', () => {
        updateNavActive(btnAlbum);
        this.state = 'album';
        if (this.music) this.music.playTrack('title');
      });
    }

    // Canvas click / tap handler for menus
    this.canvas.addEventListener('click', (e) => {
      this.handleCanvasClick(e);
    });

    // Direct Touch / Drag Tracking for Chopstick Feast
    const handlePointerMove = (e) => {
      if (this.state === 'chopstick_feast' && this.chopstickFeast) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.virtualWidth / rect.width;
        const scaleY = this.virtualHeight / rect.height;
        const pointerX = (e.clientX - rect.left) * scaleX;
        const pointerY = (e.clientY - rect.top) * scaleY;
        this.chopstickFeast.setPointerPos(pointerX, pointerY, e.buttons > 0);
      }
    };

    this.canvas.addEventListener('pointermove', handlePointerMove);
    this.canvas.addEventListener('pointerdown', (e) => {
      handlePointerMove(e);
      if (this.state === 'chopstick_feast' && this.chopstickFeast) {
        this.chopstickFeast.isPinched = true;
        this.chopstickFeast.tryGrabFood(this.sfx, this.particles);
      }
    });
    this.canvas.addEventListener('pointerup', () => {
      if (this.state === 'chopstick_feast' && this.chopstickFeast) {
        this.chopstickFeast.isPinched = false;
        if (this.chopstickFeast.heldItem) {
          if (this.chopstickFeast.chopstickY < 85) {
            this.chopstickFeast.executeSlurp(this.sfx, this.particles, this.player);
          } else {
            this.chopstickFeast.heldItem = null;
          }
        }
      }
    });
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  gameLoop(currentTime) {
    const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Cap delta time
    this.lastTime = currentTime;
    const dt = rawDt * (this.gameSpeed || 1.0);

    // Update Test Agent AI (if active)
    if (window.testAgent && window.testAgent.enabled) {
      window.testAgent.update(dt);
    }

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    this.input.update();

    // God Mode & Cheats for QA
    if (this.godMode) {
      this.player.hp = this.player.maxHp;
      this.player.invincibleTimer = 1.0;
    }
    if (this.infiniteSlurp) {
      this.player.slurpMeter = this.player.maxSlurpMeter;
    }

    // =========================================================================
    // STATE: TITLE SCREEN
    // =========================================================================
    if (this.state === 'title') {
      this.menus.update(dt);
      if (this.input.justAttack() || this.input.justJump() || this.input.justSlurp()) {
        if (!this.isAudioStarted) {
          this.synth.init();
          this.synth.resume();
          this.isAudioStarted = true;
        }
        this.state = 'character_select';
        this.menus.currentScreen = 'character_select';
        if (this.sfx) this.sfx.playSlash(1);
      }
    }

    // =========================================================================
    // STATE: CHARACTER SELECT
    // =========================================================================
    else if (this.state === 'character_select') {
      this.menus.update(dt);

      if (this.input.justLeft()) {
        this.menus.selectedCharIndex = (this.menus.selectedCharIndex - 1 + this.menus.characters.length) % this.menus.characters.length;
        if (this.sfx) this.sfx.playJump();
      } else if (this.input.justRight()) {
        this.menus.selectedCharIndex = (this.menus.selectedCharIndex + 1) % this.menus.characters.length;
        if (this.sfx) this.sfx.playJump();
      }

      if (this.input.justAttack() || this.input.justSlurp()) {
        const chosenChar = this.menus.characters[this.menus.selectedCharIndex];
        this.player.setCharacter(chosenChar.id);
        this.state = 'stage_select';
        this.menus.currentScreen = 'stage_select';
        if (this.sfx) this.sfx.playStar();
      }
    }

    // =========================================================================
    // STATE: STAGE SELECT
    // =========================================================================
    else if (this.state === 'stage_select') {
      this.menus.update(dt);

      if (this.input.justLeft()) {
        this.menus.selectedStageIndex = (this.menus.selectedStageIndex - 1 + STAGES_DATA.length) % STAGES_DATA.length;
        if (this.sfx) this.sfx.playJump();
      } else if (this.input.justRight()) {
        this.menus.selectedStageIndex = (this.menus.selectedStageIndex + 1) % STAGES_DATA.length;
        if (this.sfx) this.sfx.playJump();
      }

      if (this.input.justAttack() || this.input.justJump() || this.input.justSlurp()) {
        this.startStage(this.menus.selectedStageIndex);
      }
    }

    // =========================================================================
    // STATE: CHOPSTICK RAMEN FEAST SELECT (STANDALONE LEVEL SELECTOR)
    // =========================================================================
    else if (this.state === 'feast_select') {
      this.menus.update(dt);

      if (this.input.justLeft()) {
        this.menus.selectedFeastIndex = (this.menus.selectedFeastIndex - 1 + 4) % 4;
        if (this.sfx) this.sfx.playJump();
      } else if (this.input.justRight()) {
        this.menus.selectedFeastIndex = (this.menus.selectedFeastIndex + 1) % 4;
        if (this.sfx) this.sfx.playJump();
      }

      if (this.input.justAttack() || this.input.justJump() || this.input.justSlurp()) {
        this.state = 'chopstick_feast';
        this.chopstickFeast.startFeast(this.menus.selectedFeastIndex, this.player.charId, true, 1);
        if (this.sfx) this.sfx.playStar();
      }
    }

    // =========================================================================
    // STATE: CHOPSTICK RAMEN FEAST LEVEL (INTERACTIVE SLURP GAMEPLAY)
    // =========================================================================
    else if (this.state === 'chopstick_feast') {
      this.chopstickFeast.update(dt, this.input, this.sfx, this.particles, this.player);
      this.particles.update(dt);

      if (this.chopstickFeast.isCleared && this.chopstickFeast.clearTimer <= 0) {
        if (this.chopstickFeast.isStandalone) {
          this.state = 'feast_select';
          this.menus.currentScreen = 'feast_select';
        } else {
          // Story Mode: in-between feast finished, proceed to next combat stage!
          const nextStage = this.chopstickFeast.nextStageIndex;
          if (nextStage < STAGES_DATA.length) {
            this.startStage(nextStage);
          } else {
            // Game Win!
            this.state = 'game_win';
            this.menus.currentScreen = 'game_win';
            if (this.music) this.music.playTrack('victory');
          }
        }
      }
    }

    // =========================================================================
    // STATE: PLAYING
    // =========================================================================
    else if (this.state === 'playing') {
      // Check Pause
      if (this.input.justPause()) {
        this.state = 'pause';
        this.menus.currentScreen = 'pause';
        return;
      }

      this.hud.update(dt);
      this.particles.update(dt);

      // Update Player
      this.player.update(
        dt,
        this.input,
        this.physics,
        this.levelManager.tilemap,
        this.sfx,
        this.particles,
        this.camera,
        this.levelManager.playerProjectiles,
        this.levelManager
      );

      // Update Camera follow
      this.camera.follow(this.player, dt);

      // Update Level, Enemies, Boss, Collisions
      this.levelManager.update(
        dt,
        this.player,
        this.physics,
        this.sfx,
        this.particles,
        this.camera,
        this.music
      );

      // Check Stage Clear Transition -> Transitions into Delicious In-Between Chopstick Feast!
      if (this.levelManager.isStageCleared && this.levelManager.clearTimer <= 0) {
        this.state = 'chopstick_feast';
        this.chopstickFeast.startFeast(this.levelManager.currentStageIndex, this.player.charId, false, this.levelManager.currentStageIndex + 1);
        if (this.music) this.music.playTrack('stage1');
      }

      // Check Player Defeat (if Assist Mode Invincibility is OFF)
      if (this.player.hp <= 0) {
        this.state = 'game_over';
        this.menus.currentScreen = 'game_over';
        if (this.sfx) this.sfx.playPlayerHurt();
      }
    }

    // =========================================================================
    // STATE: PAUSE
    // =========================================================================
    else if (this.state === 'pause') {
      if (this.input.justPause()) {
        this.state = 'playing';
      } else if (this.input.justJump()) {
        this.state = 'title';
        this.menus.currentScreen = 'title';
        if (this.music) this.music.playTrack('title');
      }
    }

    // =========================================================================
    // STATE: ALBUM (K-POP PHOTOCARDS)
    // =========================================================================
    else if (this.state === 'album') {
      this.album.update(dt);
      if (this.input.justLeft()) {
        this.album.selectedCardIndex = (this.album.selectedCardIndex - 1 + this.album.cards.length) % this.album.cards.length;
        if (this.sfx) this.sfx.playJump();
      } else if (this.input.justRight()) {
        this.album.selectedCardIndex = (this.album.selectedCardIndex + 1) % this.album.cards.length;
        if (this.sfx) this.sfx.playJump();
      }

      if (this.input.justJump() || this.input.justAttack()) {
        this.state = 'title';
        this.menus.currentScreen = 'title';
      }
    }

    // =========================================================================
    // STATE: RAMEN CHEF MINIGAME
    // =========================================================================
    else if (this.state === 'ramen_game') {
      this.ramenGame.update(dt, this.input, this.sfx, this.particles, this.virtualWidth);
      this.particles.update(dt);

      if (this.ramenGame.isGameOver && (this.input.justAttack() || this.input.justJump() || this.input.justSlurp())) {
        this.state = 'title';
        this.menus.currentScreen = 'title';
        if (this.music) this.music.playTrack('title');
      }
    }

    // =========================================================================
    // STATE: GAME OVER / TRY AGAIN
    // =========================================================================
    else if (this.state === 'game_over') {
      this.menus.update(dt);
      if (this.input.justAttack() || this.input.justJump() || this.input.justSlurp()) {
        this.player.hp = this.player.maxHp;
        this.player.slurpMeter = 30;
        this.startStage(this.levelManager.currentStageIndex);
      }
    }

    // =========================================================================
    // STATE: GAME WIN
    // =========================================================================
    else if (this.state === 'game_win') {
      this.menus.update(dt);
      if (this.input.justAttack() || this.input.justJump() || this.input.justSlurp()) {
        this.state = 'title';
        this.menus.currentScreen = 'title';
        if (this.music) this.music.playTrack('title');
      }
    }
  }

  handleCanvasClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.virtualWidth / rect.width;
    const scaleY = this.virtualHeight / rect.height;
    const clickX = (e.clientX - rect.x) * scaleX;
    const clickY = (e.clientY - rect.y) * scaleY;

    // Spawn Neon Touch Ripple
    if (this.particles) {
      const worldX = clickX + (this.state === 'playing' && this.camera ? this.camera.x : 0);
      const worldY = clickY + (this.state === 'playing' && this.camera ? this.camera.y : 0);
      this.particles.spawnTouchRipple(worldX, worldY, '#00f0ff');
    }

    if (this.state === 'character_select') {
      if (clickX < this.virtualWidth * 0.3) {
        this.menus.selectedCharIndex = (this.menus.selectedCharIndex - 1 + this.menus.characters.length) % this.menus.characters.length;
        if (this.sfx) this.sfx.playJump();
      } else if (clickX > this.virtualWidth * 0.7) {
        this.menus.selectedCharIndex = (this.menus.selectedCharIndex + 1) % this.menus.characters.length;
        if (this.sfx) this.sfx.playJump();
      } else {
        const chosenChar = this.menus.characters[this.menus.selectedCharIndex];
        this.player.setCharacter(chosenChar.id);
        this.state = 'stage_select';
        this.menus.currentScreen = 'stage_select';
        if (this.sfx) this.sfx.playStar();
      }
    } else if (this.state === 'stage_select') {
      if (clickX < this.virtualWidth * 0.3) {
        this.menus.selectedStageIndex = (this.menus.selectedStageIndex - 1 + STAGES_DATA.length) % STAGES_DATA.length;
        if (this.sfx) this.sfx.playJump();
      } else if (clickX > this.virtualWidth * 0.7) {
        this.menus.selectedStageIndex = (this.menus.selectedStageIndex + 1) % STAGES_DATA.length;
        if (this.sfx) this.sfx.playJump();
      } else {
        this.startStage(this.menus.selectedStageIndex);
      }
    } else if (this.state === 'feast_select') {
      if (clickX < this.virtualWidth * 0.3) {
        this.menus.selectedFeastIndex = (this.menus.selectedFeastIndex - 1 + 4) % 4;
        if (this.sfx) this.sfx.playJump();
      } else if (clickX > this.virtualWidth * 0.7) {
        this.menus.selectedFeastIndex = (this.menus.selectedFeastIndex + 1) % 4;
        if (this.sfx) this.sfx.playJump();
      } else {
        this.state = 'chopstick_feast';
        this.chopstickFeast.startFeast(this.menus.selectedFeastIndex, this.player.charId, true, 1);
        if (this.sfx) this.sfx.playStar();
      }
    } else if (this.state === 'chopstick_feast') {
      this.chopstickFeast.setPointerPos(clickX, clickY, true);
    } else if (this.state === 'album') {
      if (clickX < this.virtualWidth * 0.3) {
        this.album.selectedCardIndex = (this.album.selectedCardIndex - 1 + this.album.cards.length) % this.album.cards.length;
        if (this.sfx) this.sfx.playJump();
      } else if (clickX > this.virtualWidth * 0.7) {
        this.album.selectedCardIndex = (this.album.selectedCardIndex + 1) % this.album.cards.length;
        if (this.sfx) this.sfx.playJump();
      } else {
        this.state = 'title';
        this.menus.currentScreen = 'title';
      }
    } else if (this.state === 'playing') {
      const scaleY = this.virtualHeight / rect.height;
      const clickY = (e.clientY - rect.y) * scaleY;

      // 1. Check if companion (Cat/Raven) was tapped directly
      if (this.levelManager && this.levelManager.companions) {
        if (this.levelManager.companions.handleTap(clickX, clickY, this.camera, this.sfx, this.particles)) {
          return;
        }
      }

      // 2. Direct screen taps for toddlers: tap right side to jump/slash!
      if (clickX > this.virtualWidth * 0.45) {
        if (clickX > this.virtualWidth * 0.72) {
          // Tap right -> Jump
          this.input.setTouchKey('KeyX', true);
          setTimeout(() => this.input.setTouchKey('KeyX', false), 120);
        } else {
          // Tap mid-right -> Slash
          this.input.setTouchKey('KeyZ', true);
          setTimeout(() => this.input.setTouchKey('KeyZ', false), 120);
        }
      }
    } else if (this.state === 'title') {
      this.state = 'character_select';
      this.menus.currentScreen = 'character_select';
      if (this.sfx) this.sfx.playSlash(1);
    }
  }

  startStage(stageIndex) {
    this.state = 'playing';
    this.particles.clear();
    this.levelManager.loadStage(stageIndex, this.player, this.camera, this.music);
    if (this.sfx) this.sfx.playStar();
  }

  render() {
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    if (this.state === 'playing') {
      // 1. Parallax Background
      this.levelManager.drawBackground(this.ctx, this.camera);

      // 2. Tilemap
      this.levelManager.drawTiles(this.ctx, this.spriteRenderer, this.camera);

      // 3. Entities (Enemies, Boss, Collectibles, Projectiles)
      this.levelManager.drawEntities(this.ctx, this.spriteRenderer, this.camera);

      // 4. Player
      this.player.draw(this.ctx, this.spriteRenderer, this.camera);

      // 5. Particles & FX
      this.particles.draw(this.ctx, this.camera);

      // 6. HUD
      this.hud.draw(this.ctx, this.player, this.levelManager, this.spriteRenderer, this.virtualWidth, this.virtualHeight);
    } else if (this.state === 'chopstick_feast') {
      this.chopstickFeast.draw(this.ctx, this.spriteRenderer, this.virtualWidth, this.virtualHeight);
      this.particles.draw(this.ctx, { x: 0, y: 0 });
    } else if (this.state === 'album') {
      this.album.draw(this.ctx, this.spriteRenderer, this.virtualWidth, this.virtualHeight);
    } else if (this.state === 'ramen_game') {
      this.ramenGame.draw(this.ctx, this.spriteRenderer, this.virtualWidth, this.virtualHeight);
      this.particles.draw(this.ctx, { x: 0, y: 0 });
    } else {
      // Render Menus (Title, Character Select, Stage Select, Feast Select, Game Over, Win)
      this.menus.draw(this.ctx, this.spriteRenderer, this.player, this.virtualWidth, this.virtualHeight);
    }

    // 7. Test Agent QA Dashboard HUD (if active)
    if (window.testAgentUI) {
      window.testAgentUI.draw(this.ctx, this.virtualWidth, this.virtualHeight);
    }
  }
}

// Launch Game on Load
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameApp();
  window.gameApp = game;
  game.start();

  // Initialize Test Agent & QA UI Dashboard if loaded
  if (typeof TestAgent !== 'undefined') {
    window.testAgent = new TestAgent(game);
    if (typeof TestAgentUI !== 'undefined') {
      window.testAgentUI = new TestAgentUI(game, window.testAgent);
    }
  }
});
