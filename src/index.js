/**
 * konami-code-detector
 * A lightweight, zero-dependency JavaScript library for detecting the Konami Code
 * @version 1.0.0
 * @license MIT
 */

/**
 * Predefined key sequences
 */
const SEQUENCES = Object.freeze({
  classic: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
  simple: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  debug: ['d', 'e', 'b', 'u', 'g'],
  admin: ['a', 'd', 'm', 'i', 'n']
});

/**
 * Default activation callback
 */
const defaultCallback = () => {
  console.log('🎮 Konami Code Activated! ↑↑↓↓←→←→BA');
  console.log('💫 You found the easter egg!');
};

/**
 * KonamiCode class - Main detector implementation
 */
class KonamiCode {
  /**
   * @param {Function} callback - Activation callback (optional)
   * @param {Object} options - Configuration options
   */
  constructor(callback = defaultCallback, options = {}) {
    // Private properties (using underscore convention)
    this._enabled = false;
    this._current = 0;
    this._timer = null;
    this._activated = false;
    this._listeners = new Map();
    this._abortController = null;
    
    // Public properties
    this.callback = callback;
    this.config = {
      sequence: options.sequence || SEQUENCES.classic,
      timeout: options.timeout || 1000,
      target: options.target || (typeof document !== 'undefined' ? document : null),
      preventDefault: options.preventDefault ?? true,
      once: options.once || false,
      debug: options.debug || false,
      maxAttempts: options.maxAttempts || Infinity,
      cooldown: options.cooldown || 0
    };
    
    this.attempts = 0;
    this.stats = {
      activations: 0,
      attempts: 0,
      lastActivated: null
    };
    
    // Bind methods
    this.handleKeydown = this.handleKeydown.bind(this);
    
    // Auto-enable if specified
    if (options.autoEnable) {
      this.enable();
    }
  }

  /**
   * Enable the Konami code listener
   * @returns {Promise<KonamiCode>}
   */
  async enable() {
    if (this._enabled) return this;
    
    this._enabled = true;
    
    // Only set up DOM listeners if we have a target and are in browser environment
    if (this.config.target && typeof window !== 'undefined') {
      this._abortController = new AbortController();
      this.config.target.addEventListener(
        'keydown',
        this.handleKeydown,
        { signal: this._abortController.signal }
      );
    }
    
    this.log('Listener enabled');
    await this.emit('enabled', { timestamp: Date.now() });
    return this;
  }

  /**
   * Disable the Konami code listener
   * @returns {Promise<KonamiCode>}
   */
  async disable() {
    if (!this._enabled) return this;
    
    this._enabled = false;
    
    // Abort all listeners
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    
    this.reset();
    this.log('Listener disabled');
    await this.emit('disabled', { timestamp: Date.now() });
    return this;
  }

  /**
   * Handle keydown events
   * @private
   */
  async handleKeydown(e) {
    const key = e.key.toLowerCase();
    
    // Clear existing timer
    if (this._timer) clearTimeout(this._timer);
    
    // Set new timer to reset sequence
    this._timer = setTimeout(() => this.reset(), this.config.timeout);
    
    // Check if key matches current position in sequence
    const expected = this.config.sequence[this._current].toLowerCase();
    
    if (key === expected) {
      this._current++;
      this.log(`Progress: ${this._current}/${this.config.sequence.length}`);
      
      // Emit progress event
      await this.emit('progress', {
        current: this._current,
        total: this.config.sequence.length,
        percentage: (this._current / this.config.sequence.length) * 100
      });
      
      // Check if sequence is complete
      if (this._current === this.config.sequence.length) {
        if (this.config.preventDefault) e.preventDefault();
        await this.activate();
      }
    } else {
      // Wrong key, reset
      this.stats.attempts++;
      await this.emit('failed', { key, expected });
      this.reset();
    }
  }

  /**
   * Reset the sequence progress
   */
  reset() {
    this._current = 0;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this.log('Sequence reset');
  }

  /**
   * Activate the Konami code
   * @returns {Promise<void>}
   */
  async activate() {
    this.reset();
    
    // Check cooldown
    if (this.config.cooldown > 0 && this.stats.lastActivated) {
      const elapsed = Date.now() - this.stats.lastActivated;
      if (elapsed < this.config.cooldown) {
        this.log(`Cooldown: ${this.config.cooldown - elapsed}ms remaining`);
        return;
      }
    }
    
    // Check max attempts
    if (this.attempts >= this.config.maxAttempts) {
      this.log('Max attempts reached');
      return;
    }
    
    // Check once mode
    if (this.config.once && this._activated) {
      this.log('Already activated (once mode)');
      return;
    }
    
    this.attempts++;
    this._activated = true;
    this.stats.activations++;
    this.stats.lastActivated = Date.now();
    
    this.log('🎮 Activated!');
    
    try {
      // Execute callback
      if (typeof this.callback === 'function') {
        await Promise.resolve(this.callback());
      }
      
      // Emit activation event
      await this.emit('activated', {
        timestamp: Date.now(),
        activations: this.stats.activations
      });
      
      // Dispatch DOM event if in browser
      if (typeof CustomEvent !== 'undefined' && this.config.target) {
        this.config.target.dispatchEvent(new CustomEvent('konamicode', {
          bubbles: true,
          detail: { timestamp: Date.now(), stats: { ...this.stats } }
        }));
      }
    } catch (error) {
      console.error('[KonamiCode] Error:', error);
      await this.emit('error', { error, timestamp: Date.now() });
    }
    
    // Auto-disable if once mode
    if (this.config.once) {
      await this.disable();
    }
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {KonamiCode}
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return this;
  }

  /**
   * Unregister an event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {KonamiCode}
   */
  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
    return this;
  }

  /**
   * Emit an event
   * @private
   */
  async emit(event, data) {
    const handlers = this._listeners.get(event);
    if (!handlers || handlers.size === 0) return;
    
    await Promise.all(
      Array.from(handlers).map(handler => Promise.resolve(handler(data)))
    );
  }

  /**
   * Set a new callback
   * @param {Function} callback - New callback function
   * @returns {KonamiCode}
   */
  setCallback(callback) {
    this.callback = callback;
    return this;
  }

  /**
   * Set a custom sequence
   * @param {Array<string>} sequence - New sequence
   * @returns {KonamiCode}
   */
  setSequence(sequence) {
    this.config.sequence = sequence;
    this.reset();
    return this;
  }

  /**
   * Check if listener is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this._enabled;
  }

  /**
   * Check if code has been activated
   * @returns {boolean}
   */
  isActivated() {
    return this._activated;
  }

  /**
   * Get current progress
   * @returns {Object}
   */
  getProgress() {
    return {
      current: this._current,
      total: this.config.sequence.length,
      percentage: (this._current / this.config.sequence.length) * 100
    };
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   * @returns {KonamiCode}
   */
  resetStats() {
    this.stats = { activations: 0, attempts: 0, lastActivated: null };
    this.attempts = 0;
    return this;
  }

  /**
   * Wait for activation
   * @returns {Promise}
   */
  waitForActivation() {
    return new Promise(resolve => this.on('activated', resolve));
  }

  /**
   * Debug logging
   * @private
   */
  log(message) {
    if (this.config.debug) {
      console.log(`[KonamiCode] ${message}`);
    }
  }

  /**
   * Destroy the instance and clean up
   * @returns {Promise<void>}
   */
  async destroy() {
    await this.disable();
    this.callback = null;
    this._listeners.clear();
    this.log('Destroyed');
  }

  /**
   * Manually trigger a key for testing
   * @param {string} key - Key to trigger
   * @returns {Promise<void>}
   */
  async triggerKey(key) {
    if (!this._enabled) return;
    await this.handleKeydown({ key, preventDefault: () => {} });
  }

  /**
   * Manually trigger the full sequence for testing
   * @returns {Promise<void>}
   */
  async triggerSequence() {
    for (const key of this.config.sequence) {
      await this.triggerKey(key);
    }
  }
}

// CommonJS exports
module.exports = KonamiCode;
module.exports.KonamiCode = KonamiCode;
module.exports.SEQUENCES = SEQUENCES;
module.exports.defaultCallback = defaultCallback;