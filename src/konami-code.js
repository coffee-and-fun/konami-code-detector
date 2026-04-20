import { SEQUENCES } from './sequences.js';
import { defaultCallback } from './default-callback.js';

export class KonamiCode {
  constructor(callback = defaultCallback, options = {}) {
    this._enabled = false;
    this._currentIndex = 0;
    this._resetTimer = null;
    this._activated = false;
    this._listeners = new Map();
    this._abortController = null;

    this.callback = callback;
    this.config = {
      sequence: options.sequence || SEQUENCES.classic,
      timeout: options.timeout || 1000,
      target: options.target !== undefined
        ? options.target
        : (typeof document !== 'undefined' ? document : null),
      preventDefault: options.preventDefault ?? true,
      once: options.once || false,
      debug: options.debug || false,
      maxAttempts: options.maxAttempts || Infinity,
      cooldown: options.cooldown || 0,
    };

    this.attempts = 0;
    this.stats = {
      activations: 0,
      attempts: 0,
      lastActivated: null,
    };

    this.handleKeydown = this.handleKeydown.bind(this);

    if (options.autoEnable) {
      this.enable().catch((error) => {
        console.error('[KonamiCode] autoEnable failed:', error);
      });
    }
  }

  async enable() {
    if (this._enabled) return this;

    this._enabled = true;

    if (this.config.target && typeof window !== 'undefined') {
      this._abortController = new AbortController();
      this.config.target.addEventListener(
        'keydown',
        this.handleKeydown,
        { signal: this._abortController.signal },
      );
    }

    this._log('Listener enabled');
    await this._emit('enabled', { timestamp: Date.now() });
    return this;
  }

  async disable() {
    if (!this._enabled) return this;

    this._enabled = false;

    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }

    this.reset();
    this._log('Listener disabled');
    await this._emit('disabled', { timestamp: Date.now() });
    return this;
  }

  async handleKeydown(event) {
    const key = event.key.toLowerCase();

    if (this._resetTimer) clearTimeout(this._resetTimer);
    this._resetTimer = setTimeout(() => this.reset(), this.config.timeout);

    const expected = this.config.sequence[this._currentIndex].toLowerCase();

    if (key === expected) {
      this._currentIndex++;
      this._log(`Progress: ${this._currentIndex}/${this.config.sequence.length}`);

      await this._emit('progress', {
        current: this._currentIndex,
        total: this.config.sequence.length,
        percentage: (this._currentIndex / this.config.sequence.length) * 100,
      });

      if (this._currentIndex === this.config.sequence.length) {
        if (this.config.preventDefault) event.preventDefault();
        await this.activate();
      }
    } else {
      this.stats.attempts++;
      await this._emit('failed', { key, expected });
      this.reset();
    }
  }

  reset() {
    this._currentIndex = 0;
    if (this._resetTimer) {
      clearTimeout(this._resetTimer);
      this._resetTimer = null;
    }
    this._log('Sequence reset');
  }

  async activate() {
    this.reset();

    if (this.config.cooldown > 0 && this.stats.lastActivated) {
      const elapsed = Date.now() - this.stats.lastActivated;
      if (elapsed < this.config.cooldown) {
        this._log(`Cooldown: ${this.config.cooldown - elapsed}ms remaining`);
        return;
      }
    }

    if (this.attempts >= this.config.maxAttempts) {
      this._log('Max attempts reached');
      return;
    }

    if (this.config.once && this._activated) {
      this._log('Already activated (once mode)');
      return;
    }

    this.attempts++;
    this._activated = true;
    this.stats.activations++;
    this.stats.lastActivated = Date.now();

    this._log('🎮 Activated!');

    try {
      if (typeof this.callback === 'function') {
        await Promise.resolve(this.callback());
      }

      await this._emit('activated', {
        timestamp: Date.now(),
        activations: this.stats.activations,
      });

      if (typeof CustomEvent !== 'undefined' && this.config.target) {
        this.config.target.dispatchEvent(new CustomEvent('konamicode', {
          bubbles: true,
          detail: { timestamp: Date.now(), stats: { ...this.stats } },
        }));
      }
    } catch (error) {
      console.error('[KonamiCode] Error:', error);
      await this._emit('error', { error, timestamp: Date.now() });
    }

    if (this.config.once) {
      await this.disable();
    }
  }

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
    return this;
  }

  async _emit(event, data) {
    const handlers = this._listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    await Promise.all(
      Array.from(handlers).map((handler) => Promise.resolve(handler(data))),
    );
  }

  setCallback(callback) {
    this.callback = callback;
    return this;
  }

  setSequence(sequence) {
    this.config.sequence = sequence;
    this.reset();
    return this;
  }

  isEnabled() {
    return this._enabled;
  }

  isActivated() {
    return this._activated;
  }

  getProgress() {
    return {
      current: this._currentIndex,
      total: this.config.sequence.length,
      percentage: (this._currentIndex / this.config.sequence.length) * 100,
    };
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { activations: 0, attempts: 0, lastActivated: null };
    this.attempts = 0;
    return this;
  }

  waitForActivation() {
    return new Promise((resolve) => this.on('activated', resolve));
  }

  _log(message) {
    if (this.config.debug) {
      console.log(`[KonamiCode] ${message}`);
    }
  }

  async destroy() {
    await this.disable();
    this.callback = null;
    this._listeners.clear();
    this._log('Destroyed');
  }

  async triggerKey(key) {
    if (!this._enabled) return;
    await this.handleKeydown({ key, preventDefault: () => {} });
  }

  async triggerSequence() {
    for (const key of this.config.sequence) {
      await this.triggerKey(key);
    }
  }
}
