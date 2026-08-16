/**
 * K-POP DEMON HUNTERS - Input Manager
 * Handles Multi-Touch Screen Controls, Keyboard, and HTML5 Gamepad API.
 */

class InputManager {
  constructor() {
    this.keys = {};
    this.prevKeys = {};
    this.touchState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      slurp: false,
      pause: false
    };
    this.prevTouchState = { ...this.touchState };

    this.injectedState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      slurp: false,
      pause: false
    };
    this.prevInjectedState = { ...this.injectedState };

    this.activeTouches = new Map(); // id -> button element
    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Prevent browser scrolling on space and arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.resetTouch();
    });
  }

  initTouch() {
    const buttons = document.querySelectorAll('.touch-btn');

    buttons.forEach((btn) => {
      const handlePress = (e) => {
        e.preventDefault();
        const key = btn.dataset.key;
        this.setTouchKey(key, true);
        btn.classList.add('active');
      };

      const handleRelease = (e) => {
        e.preventDefault();
        const key = btn.dataset.key;
        this.setTouchKey(key, false);
        btn.classList.remove('active');
      };

      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('touchcancel', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', handleRelease);
    });

    // Touch screen swipe & virtual zone support on canvas directly
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => {
        // Resume Web Audio if suspended
        if (window.gameAudio && window.gameAudio.synth) {
          window.gameAudio.synth.resume();
        }
      }, { passive: true });
    }
  }

  setTouchKey(key, state) {
    if (key === 'ArrowLeft') this.touchState.left = state;
    if (key === 'ArrowRight') this.touchState.right = state;
    if (key === 'ArrowUp') this.touchState.up = state;
    if (key === 'ArrowDown') this.touchState.down = state;
    if (key === 'KeyX' || key === 'Space') this.touchState.jump = state;
    if (key === 'KeyZ') this.touchState.attack = state;
    if (key === 'KeyC') this.touchState.slurp = state;
    if (key === 'KeyP') this.touchState.pause = state;
  }

  resetTouch() {
    Object.keys(this.touchState).forEach(k => this.touchState[k] = false);
    document.querySelectorAll('.touch-btn').forEach(btn => btn.classList.remove('active'));
  }

  /**
   * Poll Gamepad API
   */
  pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gamepads || !gamepads[0]) return;

    const gp = gamepads[0];
    // D-Pad / Left Stick
    const stickX = gp.axes[0] || 0;
    const stickY = gp.axes[1] || 0;

    const padLeft = (gp.buttons[14] && gp.buttons[14].pressed) || stickX < -0.35;
    const padRight = (gp.buttons[15] && gp.buttons[15].pressed) || stickX > 0.35;
    const padUp = (gp.buttons[12] && gp.buttons[12].pressed) || stickY < -0.35;
    const padDown = (gp.buttons[13] && gp.buttons[13].pressed) || stickY > 0.35;

    // Face Buttons
    const btnJump = (gp.buttons[0] && gp.buttons[0].pressed); // A / Cross
    const btnAttack = (gp.buttons[2] && gp.buttons[2].pressed) || (gp.buttons[1] && gp.buttons[1].pressed); // X / Square / B
    const btnSlurp = (gp.buttons[3] && gp.buttons[3].pressed) || (gp.buttons[5] && gp.buttons[5].pressed); // Y / R1
    const btnPause = (gp.buttons[9] && gp.buttons[9].pressed); // Start / Options

    if (padLeft) this.touchState.left = true;
    if (padRight) this.touchState.right = true;
    if (padUp) this.touchState.up = true;
    if (padDown) this.touchState.down = true;
    if (btnJump) this.touchState.jump = true;
    if (btnAttack) this.touchState.attack = true;
    if (btnSlurp) this.touchState.slurp = true;
    if (btnPause) this.touchState.pause = true;
  }

  update() {
    this.prevKeys = { ...this.keys };
    this.prevTouchState = { ...this.touchState };
    this.prevInjectedState = { ...this.injectedState };
    this.pollGamepad();
  }

  // Direction checks
  isLeft() {
    return !!(this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchState.left || this.injectedState.left);
  }

  isRight() {
    return !!(this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchState.right || this.injectedState.right);
  }

  isUp() {
    return !!(this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchState.up || this.injectedState.up);
  }

  isDown() {
    return !!(this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchState.down || this.injectedState.down);
  }

  // Action checks (held)
  isJump() {
    return !!(this.keys['KeyX'] || this.keys['KeyK'] || this.keys['Space'] || this.touchState.jump || this.injectedState.jump);
  }

  isAttack() {
    return !!(this.keys['KeyZ'] || this.keys['KeyJ'] || this.touchState.attack || this.injectedState.attack);
  }

  isSlurp() {
    return !!(this.keys['KeyC'] || this.keys['KeyL'] || this.touchState.slurp || this.injectedState.slurp);
  }

  isPause() {
    return !!(this.keys['KeyP'] || this.keys['Escape'] || this.touchState.pause || this.injectedState.pause);
  }

  // Action checks (just pressed this frame)
  justLeft() {
    const now = this.isLeft();
    const prev = !!(this.prevKeys['ArrowLeft'] || this.prevKeys['KeyA'] || this.prevTouchState.left || this.prevInjectedState.left);
    return now && !prev;
  }

  justRight() {
    const now = this.isRight();
    const prev = !!(this.prevKeys['ArrowRight'] || this.prevKeys['KeyD'] || this.prevTouchState.right || this.prevInjectedState.right);
    return now && !prev;
  }

  justUp() {
    const now = this.isUp();
    const prev = !!(this.prevKeys['ArrowUp'] || this.prevKeys['KeyW'] || this.prevTouchState.up || this.prevInjectedState.up);
    return now && !prev;
  }

  justDown() {
    const now = this.isDown();
    const prev = !!(this.prevKeys['ArrowDown'] || this.prevKeys['KeyS'] || this.prevTouchState.down || this.prevInjectedState.down);
    return now && !prev;
  }

  justJump() {
    const now = this.isJump();
    const prev = !!(this.prevKeys['KeyX'] || this.prevKeys['KeyK'] || this.prevKeys['Space'] || this.prevTouchState.jump || this.prevInjectedState.jump);
    return now && !prev;
  }

  justAttack() {
    const now = this.isAttack();
    const prev = !!(this.prevKeys['KeyZ'] || this.prevKeys['KeyJ'] || this.prevTouchState.attack || this.prevInjectedState.attack);
    return now && !prev;
  }

  justSlurp() {
    const now = this.isSlurp();
    const prev = !!(this.prevKeys['KeyC'] || this.prevKeys['KeyL'] || this.prevTouchState.slurp || this.prevInjectedState.slurp);
    return now && !prev;
  }

  justPause() {
    const now = this.isPause();
    const prev = !!(this.prevKeys['KeyP'] || this.prevKeys['Escape'] || this.prevTouchState.pause || this.prevInjectedState.pause);
    return now && !prev;
  }

  // =========================================================================
  // Test Agent Input Injection Hooks
  // =========================================================================
  setInjectedInput(action, state) {
    if (this.injectedState.hasOwnProperty(action)) {
      this.injectedState[action] = !!state;
    }
  }

  clearInjectedInputs() {
    Object.keys(this.injectedState).forEach(k => {
      this.injectedState[k] = false;
    });
  }
}

window.InputManager = InputManager;
