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

    this.gamepadState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      slurp: false,
      pause: false
    };
    this.prevGamepadState = { ...this.gamepadState };

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
   * Poll Gamepad API with full PS4 DualShock 4 support and deadzone filtering
   */
  pollGamepad() {
    // Reset gamepad state fresh on every frame
    this.gamepadState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      slurp: false,
      pause: false
    };

    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || !gp.connected) continue;

      // Analog stick deadzone filtering (prevents stick drift from sticking)
      const stickX = (gp.axes && gp.axes.length > 0) ? gp.axes[0] : 0;
      const stickY = (gp.axes && gp.axes.length > 1) ? gp.axes[1] : 0;
      const deadzone = 0.25;

      // D-Pad buttons (PS4 Standard) or Left Analog Stick
      const padLeft = (gp.buttons[14] && gp.buttons[14].pressed) || stickX < -deadzone;
      const padRight = (gp.buttons[15] && gp.buttons[15].pressed) || stickX > deadzone;
      const padUp = (gp.buttons[12] && gp.buttons[12].pressed) || stickY < -deadzone;
      const padDown = (gp.buttons[13] && gp.buttons[13].pressed) || stickY > deadzone;

      // PS4 / DualShock 4 Buttons:
      // buttons[0] = Cross (✕) -> Jump
      // buttons[1] = Circle (◯) -> Special / Slurp
      // buttons[2] = Square (▢) -> Attack
      // buttons[3] = Triangle (▲) -> Super Slurp
      // buttons[4] = L1 -> Super Slurp
      // buttons[5] = R1 -> Attack
      // buttons[6] = L2 -> Super Slurp
      // buttons[7] = R2 -> Attack
      // buttons[8] = Share -> Pause
      // buttons[9] = Options -> Pause
      // buttons[16] = PS Button -> Pause
      const btnJump = (gp.buttons[0] && gp.buttons[0].pressed);
      const btnAttack = (gp.buttons[2] && gp.buttons[2].pressed) || 
                        (gp.buttons[5] && gp.buttons[5].pressed) || 
                        (gp.buttons[7] && gp.buttons[7].pressed);
      const btnSlurp = (gp.buttons[3] && gp.buttons[3].pressed) || 
                       (gp.buttons[1] && gp.buttons[1].pressed) || 
                       (gp.buttons[4] && gp.buttons[4].pressed) || 
                       (gp.buttons[6] && gp.buttons[6].pressed);
      const btnPause = (gp.buttons[9] && gp.buttons[9].pressed) || 
                       (gp.buttons[8] && gp.buttons[8].pressed) || 
                       (gp.buttons[16] && gp.buttons[16].pressed);

      if (padLeft) this.gamepadState.left = true;
      if (padRight) this.gamepadState.right = true;
      if (padUp) this.gamepadState.up = true;
      if (padDown) this.gamepadState.down = true;
      if (btnJump) this.gamepadState.jump = true;
      if (btnAttack) this.gamepadState.attack = true;
      if (btnSlurp) this.gamepadState.slurp = true;
      if (btnPause) this.gamepadState.pause = true;
    }
  }

  update() {
    this.prevKeys = { ...this.keys };
    this.prevTouchState = { ...this.touchState };
    this.prevGamepadState = { ...this.gamepadState };
    this.prevInjectedState = { ...this.injectedState };
    this.pollGamepad();
  }

  // Direction checks
  isLeft() {
    return !!(this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchState.left || this.gamepadState.left || this.injectedState.left);
  }

  isRight() {
    return !!(this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchState.right || this.gamepadState.right || this.injectedState.right);
  }

  isUp() {
    return !!(this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchState.up || this.gamepadState.up || this.injectedState.up);
  }

  isDown() {
    return !!(this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchState.down || this.gamepadState.down || this.injectedState.down);
  }

  // Action checks (held)
  isJump() {
    return !!(this.keys['KeyX'] || this.keys['KeyK'] || this.keys['Space'] || this.touchState.jump || this.gamepadState.jump || this.injectedState.jump);
  }

  isAttack() {
    return !!(this.keys['KeyZ'] || this.keys['KeyJ'] || this.touchState.attack || this.gamepadState.attack || this.injectedState.attack);
  }

  isSlurp() {
    return !!(this.keys['KeyC'] || this.keys['KeyL'] || this.touchState.slurp || this.gamepadState.slurp || this.injectedState.slurp);
  }

  isPause() {
    return !!(this.keys['KeyP'] || this.keys['Escape'] || this.touchState.pause || this.gamepadState.pause || this.injectedState.pause);
  }

  // Action checks (just pressed this frame)
  justLeft() {
    const now = this.isLeft();
    const prev = !!(this.prevKeys['ArrowLeft'] || this.prevKeys['KeyA'] || this.prevTouchState.left || this.prevGamepadState.left || this.prevInjectedState.left);
    return now && !prev;
  }

  justRight() {
    const now = this.isRight();
    const prev = !!(this.prevKeys['ArrowRight'] || this.prevKeys['KeyD'] || this.prevTouchState.right || this.prevGamepadState.right || this.prevInjectedState.right);
    return now && !prev;
  }

  justUp() {
    const now = this.isUp();
    const prev = !!(this.prevKeys['ArrowUp'] || this.prevKeys['KeyW'] || this.prevTouchState.up || this.prevGamepadState.up || this.prevInjectedState.up);
    return now && !prev;
  }

  justDown() {
    const now = this.isDown();
    const prev = !!(this.prevKeys['ArrowDown'] || this.prevKeys['KeyS'] || this.prevTouchState.down || this.prevGamepadState.down || this.prevInjectedState.down);
    return now && !prev;
  }

  justJump() {
    const now = this.isJump();
    const prev = !!(this.prevKeys['KeyX'] || this.prevKeys['KeyK'] || this.prevKeys['Space'] || this.prevTouchState.jump || this.prevGamepadState.jump || this.prevInjectedState.jump);
    return now && !prev;
  }

  justAttack() {
    const now = this.isAttack();
    const prev = !!(this.prevKeys['KeyZ'] || this.prevKeys['KeyJ'] || this.prevTouchState.attack || this.prevGamepadState.attack || this.prevInjectedState.attack);
    return now && !prev;
  }

  justSlurp() {
    const now = this.isSlurp();
    const prev = !!(this.prevKeys['KeyC'] || this.prevKeys['KeyL'] || this.prevTouchState.slurp || this.prevGamepadState.slurp || this.prevInjectedState.slurp);
    return now && !prev;
  }

  justPause() {
    const now = this.isPause();
    const prev = !!(this.prevKeys['KeyP'] || this.prevKeys['Escape'] || this.prevTouchState.pause || this.prevGamepadState.pause || this.prevInjectedState.pause);
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
