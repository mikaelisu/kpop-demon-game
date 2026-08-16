/**
 * K-POP DEMON HUNTERS - Test Agent QA Dashboard UI
 * Rich retro-cyberpunk overlay for autonomous testing, cheat controls, and diagnostics.
 */

class TestAgentUI {
  constructor(gameApp, testAgent) {
    this.game = gameApp;
    this.agent = testAgent;
    this.isOpen = false;
    this.currentTab = 'autopilot'; // 'autopilot', 'tests', 'cheats', 'diagnostics'
    
    this.initDOM();
    this.initKeyboardShortcuts();
  }

  initDOM() {
    // 1. Floating Launch Button
    const floatBtn = document.createElement('button');
    floatBtn.id = 'btn-test-agent-toggle';
    floatBtn.className = 'test-agent-float-btn';
    floatBtn.innerHTML = '🤖 <span>TEST AGENT</span>';
    floatBtn.title = 'Open QA Test Agent & Autopilot (Shortcut: T or F2)';
    floatBtn.addEventListener('click', () => this.toggleModal());
    document.body.appendChild(floatBtn);

    // 2. Modal Overlay Container
    const modal = document.createElement('div');
    modal.id = 'test-agent-modal';
    modal.className = 'test-agent-modal hidden';
    modal.innerHTML = `
      <div class="test-agent-box">
        <div class="test-agent-header">
          <div class="header-left">
            <span class="qa-badge">QA AGENT v2.0</span>
            <span class="qa-title">🤖 K-POP QA & AUTOPILOT AGENT</span>
          </div>
          <div class="header-right">
            <span id="qa-live-fps" class="fps-tag">60 FPS</span>
            <button id="qa-btn-close" class="qa-close-btn">✖</button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="test-agent-tabs">
          <button class="qa-tab-btn active" data-tab="autopilot">🤖 AI AUTOPILOT</button>
          <button class="qa-tab-btn" data-tab="tests">🧪 TEST SUITE (50+)</button>
          <button class="qa-tab-btn" data-tab="cheats">⚡ QA CHEATS</button>
          <button class="qa-tab-btn" data-tab="diagnostics">📊 DIAGNOSTICS & BUGS</button>
        </div>

        <!-- Tab 1: Autopilot -->
        <div id="qa-tab-autopilot" class="qa-tab-content active">
          <div class="qa-panel">
            <h3>🎮 AUTONOMOUS GAMEPLAYER AI</h3>
            <p class="qa-desc">The Test Agent will autonomously control the idol hunter, navigate platforms, defeat monsters, collect ramen, and beat bosses!</p>
            
            <div class="qa-control-row">
              <button id="qa-btn-toggle-autopilot" class="qa-action-btn pulse-glow">▶ START AI AUTOPILOT</button>
              <div class="qa-status-pill" id="qa-autopilot-status">STATUS: IDLE</div>
            </div>

            <div class="qa-sub-section">
              <h4>🎯 AI BEHAVIOR MODE:</h4>
              <div class="qa-btn-group">
                <button class="qa-btn mode-btn active" data-mode="AUTOPILOT">🌟 SMART AUTOPILOT</button>
                <button class="qa-btn mode-btn" data-mode="CHAOS_MONKEY">🐒 CHAOS MONKEY (FUZZING)</button>
                <button class="qa-btn mode-btn" data-mode="MINIGAME_BOT">🍜 RAMEN CATCH BOT</button>
                <button class="qa-btn mode-btn" data-mode="ALBUM_BOT">📸 ALBUM BROWSER</button>
              </div>
            </div>

            <div class="qa-sub-section">
              <h4>⚡ SIMULATION SPEED:</h4>
              <div class="qa-btn-group">
                <button class="qa-btn speed-btn active" data-speed="1">1X (NORMAL)</button>
                <button class="qa-btn speed-btn" data-speed="2">2X SPEED</button>
                <button class="qa-btn speed-btn" data-speed="5">5X TURBO</button>
                <button class="qa-btn speed-btn" data-speed="10">10X WARP</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Test Suite -->
        <div id="qa-tab-tests" class="qa-tab-content">
          <div class="qa-panel">
            <div class="test-header-row">
              <div>
                <h3>🧪 AUTOMATED REGRESSION & INTEGRATION TESTS</h3>
                <p class="qa-desc">Runs 50+ assertions across Physics, Combos, Power-Ups, Bosses, Stages, Audio, and UI.</p>
              </div>
              <button id="qa-btn-run-tests" class="qa-action-btn">▶ RUN ALL TESTS</button>
            </div>

            <div id="qa-test-summary-badge" class="test-summary-badge">
              <span>Ready to run test suite...</span>
            </div>

            <div class="qa-test-results-scroll" id="qa-test-results-container">
              <div class="qa-empty-hint">Click "RUN ALL TESTS" above to execute all 50+ verification assertions.</div>
            </div>
          </div>
        </div>

        <!-- Tab 3: QA Cheats & Warps -->
        <div id="qa-tab-cheats" class="qa-tab-content">
          <div class="qa-panel">
            <h3>⚡ GOD MODE & QUICK STAGE WARPS</h3>
            
            <div class="qa-toggle-grid">
              <button id="qa-cheat-godmode" class="qa-toggle-btn">🛡️ GOD MODE: OFF</button>
              <button id="qa-cheat-infslurp" class="qa-toggle-btn">🍜 INFINITE SLURP: OFF</button>
              <button id="qa-cheat-spicy" class="qa-toggle-btn">🔥 SPICY FIRE SWORD</button>
              <button id="qa-cheat-rainbow" class="qa-toggle-btn">🌈 RAINBOW FEVER</button>
            </div>

            <div class="qa-sub-section">
              <h4>🚀 STAGE HOPPER:</h4>
              <div class="qa-btn-group">
                <button class="qa-btn warp-btn" data-stage="0">STAGE 1 (MARKET)</button>
                <button class="qa-btn warp-btn" data-stage="1">STAGE 2 (CONCERT)</button>
                <button class="qa-btn warp-btn" data-stage="2">STAGE 3 (TEMPLE)</button>
                <button class="qa-btn warp-btn" data-stage="3">STAGE 4 (CASTLE)</button>
                <button class="qa-btn warp-btn" data-stage="minigame">🍜 MINIGAME</button>
                <button class="qa-btn warp-btn" data-stage="album">📸 ALBUM</button>
              </div>
            </div>

            <div class="qa-sub-section">
              <h4>⭐ SWITCH IDOL HUNTER:</h4>
              <div class="qa-btn-group">
                <button class="qa-btn idol-btn" data-idol="luna">🌙 LUNA (CYAN)</button>
                <button class="qa-btn idol-btn" data-idol="minho">🔥 MINHO (GOLD)</button>
                <button class="qa-btn idol-btn" data-idol="hana">🌸 HANA (PINK)</button>
                <button class="qa-btn idol-btn" data-idol="felix">⚡ FELIX (VIOLET)</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Diagnostics & Bugs -->
        <div id="qa-tab-diagnostics" class="qa-tab-content">
          <div class="qa-panel">
            <h3>📊 LIVE ENGINE TELEMETRY</h3>
            
            <div class="qa-telemetry-grid">
              <div class="telemetry-card">
                <span class="label">STATE</span>
                <span id="qa-diag-state" class="value">PLAYING</span>
              </div>
              <div class="telemetry-card">
                <span class="label">PLAYER POS</span>
                <span id="qa-diag-pos" class="value">X: 64, Y: 180</span>
              </div>
              <div class="telemetry-card">
                <span class="label">HEARTS / HP</span>
                <span id="qa-diag-hp" class="value">4 / 4</span>
              </div>
              <div class="telemetry-card">
                <span class="label">SLURP GAUGE</span>
                <span id="qa-diag-slurp" class="value">30%</span>
              </div>
              <div class="telemetry-card">
                <span class="label">ENTITIES</span>
                <span id="qa-diag-entities" class="value">8 Enemies</span>
              </div>
              <div class="telemetry-card">
                <span class="label">PARTICLES</span>
                <span id="qa-diag-particles" class="value">14 Active</span>
              </div>
            </div>

            <div class="qa-sub-section">
              <div class="test-header-row">
                <h4>🐞 BUG WATCHDOG LOG:</h4>
                <button id="qa-btn-copy-report" class="qa-btn tiny">📋 COPY REPORT</button>
              </div>
              <div class="qa-bug-log" id="qa-bug-log-container">
                <div class="bug-entry clean">✅ 0 bugs detected. Engine stability optimal.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    // Attach Event Handlers
    this.attachModalEvents();
  }

  attachModalEvents() {
    // Close button
    const closeBtn = document.getElementById('qa-btn-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggleModal());

    // Tab switching
    const tabBtns = document.querySelectorAll('.qa-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        document.querySelectorAll('.qa-tab-content').forEach(c => c.classList.remove('active'));
        const targetContent = document.getElementById(`qa-tab-${targetTab}`);
        if (targetContent) targetContent.classList.add('active');
      });
    });

    // Autopilot toggle
    const autoBtn = document.getElementById('qa-btn-toggle-autopilot');
    const autoStatus = document.getElementById('qa-autopilot-status');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        const active = this.agent.toggleAutopilot(this.agent.mode);
        autoBtn.textContent = active ? '⏸ STOP AI AUTOPILOT' : '▶ START AI AUTOPILOT';
        autoBtn.classList.toggle('active', active);
        if (autoStatus) {
          autoStatus.textContent = active ? `STATUS: RUNNING (${this.agent.mode})` : 'STATUS: IDLE';
          autoStatus.classList.toggle('running', active);
        }
      });
    }

    // AI Mode buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.agent.mode = btn.dataset.mode;
        if (this.agent.enabled && autoStatus) {
          autoStatus.textContent = `STATUS: RUNNING (${this.agent.mode})`;
        }
      });
    });

    // Speed buttons
    const speedBtns = document.querySelectorAll('.speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.game.gameSpeed = parseFloat(btn.dataset.speed);
      });
    });

    // Run All Tests button
    const runTestsBtn = document.getElementById('qa-btn-run-tests');
    if (runTestsBtn) {
      runTestsBtn.addEventListener('click', async () => {
        runTestsBtn.disabled = true;
        runTestsBtn.textContent = '⏳ RUNNING TESTS...';
        const stats = await this.agent.runAllTests();
        this.renderTestResults();
        runTestsBtn.disabled = false;
        runTestsBtn.textContent = '▶ RUN ALL TESTS';
      });
    }

    // Cheats
    const godBtn = document.getElementById('qa-cheat-godmode');
    if (godBtn) {
      godBtn.addEventListener('click', () => {
        this.game.godMode = !this.game.godMode;
        godBtn.textContent = `🛡️ GOD MODE: ${this.game.godMode ? 'ON' : 'OFF'}`;
        godBtn.classList.toggle('active', this.game.godMode);
      });
    }

    const slurpBtn = document.getElementById('qa-cheat-infslurp');
    if (slurpBtn) {
      slurpBtn.addEventListener('click', () => {
        this.game.infiniteSlurp = !this.game.infiniteSlurp;
        slurpBtn.textContent = `🍜 INFINITE SLURP: ${this.game.infiniteSlurp ? 'ON' : 'OFF'}`;
        slurpBtn.classList.toggle('active', this.game.infiniteSlurp);
      });
    }

    const spicyBtn = document.getElementById('qa-cheat-spicy');
    if (spicyBtn) {
      spicyBtn.addEventListener('click', () => {
        if (this.game.player) this.game.player.activateSpicyMode(30);
      });
    }

    const rainbowBtn = document.getElementById('qa-cheat-rainbow');
    if (rainbowBtn) {
      rainbowBtn.addEventListener('click', () => {
        if (this.game.player) this.game.player.activateRainbowFever(30);
      });
    }

    // Stage Warp buttons
    const warpBtns = document.querySelectorAll('.warp-btn');
    warpBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const stage = btn.dataset.stage;
        if (stage === 'minigame') {
          this.game.state = 'ramen_game';
          this.game.ramenGame.start();
        } else if (stage === 'album') {
          this.game.state = 'album';
        } else {
          this.game.startStage(parseInt(stage, 10));
        }
      });
    });

    // Idol Character Switch buttons
    const idolBtns = document.querySelectorAll('.idol-btn');
    idolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idol = btn.dataset.idol;
        if (this.game.player) this.game.player.setCharacter(idol);
      });
    });

    // Copy Report
    const copyBtn = document.getElementById('qa-btn-copy-report');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const report = JSON.stringify(this.agent.generateReport(), null, 2);
        navigator.clipboard.writeText(report).then(() => {
          copyBtn.textContent = '✅ COPIED!';
          setTimeout(() => copyBtn.textContent = '📋 COPY REPORT', 1500);
        });
      });
    }
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Toggle QA overlay on 'T', 'F2', or 'Backquote' (~)
      if (e.code === 'KeyT' || e.code === 'F2' || e.code === 'Backquote') {
        // Prevent typing into inputs if user is typing
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        this.toggleModal();
      }
    });
  }

  toggleModal() {
    this.isOpen = !this.isOpen;
    if (this.modalEl) {
      if (this.isOpen) {
        this.modalEl.classList.remove('hidden');
        this.modalEl.style.display = 'flex';
      } else {
        this.modalEl.classList.add('hidden');
        this.modalEl.style.display = 'none';
      }
    }
  }

  renderTestResults() {
    const summaryBadge = document.getElementById('qa-test-summary-badge');
    const container = document.getElementById('qa-test-results-container');
    if (!container || !summaryBadge) return;

    const stats = this.agent.testStats;
    const isAllPass = stats.failed === 0;

    summaryBadge.className = `test-summary-badge ${isAllPass ? 'pass' : 'fail'}`;
    summaryBadge.innerHTML = `
      <span>${isAllPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}</span>
      <span>${stats.passed} / ${stats.total} Passed (${stats.duration}ms)</span>
    `;

    // Group results by suite
    const grouped = {};
    this.agent.testResults.forEach(r => {
      if (!grouped[r.suite]) grouped[r.suite] = [];
      grouped[r.suite].push(r);
    });

    let html = '';
    for (const [suiteName, items] of Object.entries(grouped)) {
      html += `<div class="test-suite-group"><div class="suite-title">📂 ${suiteName}</div>`;
      items.forEach(item => {
        html += `
          <div class="test-item ${item.passed ? 'pass' : 'fail'}">
            <span class="test-status-icon">${item.passed ? '✓' : '✗'}</span>
            <span class="test-name">${item.name}</span>
            ${item.details ? `<span class="test-details">${item.details}</span>` : ''}
          </div>
        `;
      });
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  draw(ctx, width, height) {
    // Update live telemetry display in modal if open
    if (this.isOpen) {
      const fpsEl = document.getElementById('qa-live-fps');
      if (fpsEl) fpsEl.textContent = `${this.agent.telemetry.fps} FPS`;

      const diagState = document.getElementById('qa-diag-state');
      if (diagState) diagState.textContent = (this.game.state || '').toUpperCase();

      const diagPos = document.getElementById('qa-diag-pos');
      if (diagPos && this.game.player) {
        diagPos.textContent = `X: ${Math.round(this.game.player.x)}, Y: ${Math.round(this.game.player.y)}`;
      }

      const diagHp = document.getElementById('qa-diag-hp');
      if (diagHp && this.game.player) {
        diagHp.textContent = `${this.game.player.hp} / ${this.game.player.maxHp} (${this.game.player.assistInvincible ? 'Assist ON' : 'Normal'})`;
      }

      const diagSlurp = document.getElementById('qa-diag-slurp');
      if (diagSlurp && this.game.player) {
        diagSlurp.textContent = `${Math.round(this.game.player.slurpMeter)}%`;
      }

      const diagEntities = document.getElementById('qa-diag-entities');
      if (diagEntities && this.game.levelManager) {
        const eCount = this.game.levelManager.enemies.filter(e => !e.isDefeated).length;
        const cCount = this.game.levelManager.collectibles.filter(c => !c.collected).length;
        diagEntities.textContent = `${eCount} Foes, ${cCount} Items`;
      }

      const diagParticles = document.getElementById('qa-diag-particles');
      if (diagParticles && this.game.particles) {
        diagParticles.textContent = `${this.game.particles.particles.length} FX Active`;
      }
    }

    // If Autopilot is enabled, draw an authentic glowing retro AI watermark badge
    if (this.agent.enabled) {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 0, 25, 0.85)';
      ctx.fillRect(8, height - 34, 155, 26);
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, height - 34, 155, 26);

      ctx.fillStyle = '#39ff14';
      ctx.font = "7px 'Press Start 2P', monospace";
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 6;
      ctx.fillText(`🤖 AI AGENT: ${this.agent.mode}`, 14, height - 20);

      const speedStr = (this.game.gameSpeed || 1) + 'X';
      ctx.fillStyle = '#ffe600';
      ctx.fillText(`SPEED: ${speedStr}`, 14, height - 12);
      ctx.restore();
    }
  }
}

window.TestAgentUI = TestAgentUI;
