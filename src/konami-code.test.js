/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { KonamiCode } from './konami-code.js';
import { SEQUENCES } from './sequences.js';
import { defaultCallback } from './default-callback.js';

describe('KonamiCode', () => {
  let konami;
  let mockCallback;

  beforeEach(() => {
    mockCallback = jest.fn();
    konami = new KonamiCode(mockCallback);
  });

  afterEach(async () => {
    if (konami) {
      await konami.destroy();
    }
  });

  describe('constructor', () => {
    it('creates an instance with the default callback when none is provided', () => {
      const instance = new KonamiCode();
      expect(instance).toBeInstanceOf(KonamiCode);
      expect(instance.callback).toBe(defaultCallback);
    });

    it('creates an instance with a custom callback', () => {
      expect(konami).toBeInstanceOf(KonamiCode);
      expect(konami.callback).toBe(mockCallback);
    });

    it('accepts custom options', () => {
      const custom = new KonamiCode(mockCallback, {
        sequence: SEQUENCES.simple,
        timeout: 2000,
        once: true,
        debug: true,
      });

      expect(custom.config.sequence).toBe(SEQUENCES.simple);
      expect(custom.config.timeout).toBe(2000);
      expect(custom.config.once).toBe(true);
      expect(custom.config.debug).toBe(true);
    });

    it('auto-enables when autoEnable is true', async () => {
      const auto = new KonamiCode(mockCallback, { autoEnable: true });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(auto.isEnabled()).toBe(true);
      await auto.destroy();
    });
  });

  describe('enable / disable', () => {
    it('enables the listener', async () => {
      await konami.enable();
      expect(konami.isEnabled()).toBe(true);
    });

    it('disables the listener', async () => {
      await konami.enable();
      await konami.disable();
      expect(konami.isEnabled()).toBe(false);
    });

    it('is idempotent when enable is called twice', async () => {
      await konami.enable();
      const result = await konami.enable();
      expect(result).toBe(konami);
      expect(konami.isEnabled()).toBe(true);
    });

    it('emits an enabled event', async () => {
      const handler = jest.fn();
      konami.on('enabled', handler);

      await konami.enable();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ timestamp: expect.any(Number) }),
      );
    });

    it('emits a disabled event', async () => {
      const handler = jest.fn();
      konami.on('disabled', handler);

      await konami.enable();
      await konami.disable();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ timestamp: expect.any(Number) }),
      );
    });
  });

  describe('sequence detection', () => {
    beforeEach(async () => {
      await konami.enable();
    });

    it('activates when the full sequence is entered', async () => {
      for (const key of SEQUENCES.classic) {
        await konami.triggerKey(key);
      }

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(konami.isActivated()).toBe(true);
    });

    it('resets when a wrong key is pressed mid-sequence', async () => {
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('ArrowLeft');

      expect(konami.getProgress().current).toBe(0);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('emits progress events with percentage', async () => {
      const progressHandler = jest.fn();
      konami.on('progress', progressHandler);

      await konami.triggerKey('ArrowUp');

      expect(progressHandler).toHaveBeenCalledTimes(1);
      expect(progressHandler).toHaveBeenCalledWith({
        current: 1,
        total: 10,
        percentage: 10,
      });
    });

    it('emits a failed event with the wrong key and expected key', async () => {
      const failHandler = jest.fn();
      konami.on('failed', failHandler);

      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('x');

      expect(failHandler).toHaveBeenCalledWith({ key: 'x', expected: 'arrowup' });
    });

    it('works with a custom sequence', async () => {
      await konami.destroy();
      konami = new KonamiCode(mockCallback, { sequence: SEQUENCES.simple });
      await konami.enable();

      for (const key of SEQUENCES.simple) {
        await konami.triggerKey(key);
      }

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('fires the full sequence via triggerSequence', async () => {
      await konami.triggerSequence();

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(konami.isActivated()).toBe(true);
    });

    it('matches keys case-insensitively', async () => {
      await konami.triggerKey('arrowup');
      await konami.triggerKey('ARROWUP');
      await konami.triggerKey('ArrowDown');

      expect(konami.getProgress().current).toBe(3);
    });

    it('resets sequence progress after the configured timeout', async () => {
      jest.useFakeTimers();
      konami = new KonamiCode(mockCallback, { timeout: 500 });
      await konami.enable();

      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('ArrowUp');
      expect(konami.getProgress().current).toBe(2);

      jest.advanceTimersByTime(600);

      expect(konami.getProgress().current).toBe(0);
      jest.useRealTimers();
    });
  });

  describe('preventDefault', () => {
    it('calls event.preventDefault on the final key by default', async () => {
      await konami.enable();

      const sequence = SEQUENCES.classic;
      for (let i = 0; i < sequence.length - 1; i++) {
        await konami.triggerKey(sequence[i]);
      }

      const finalEvent = { key: sequence[sequence.length - 1], preventDefault: jest.fn() };
      await konami.handleKeydown(finalEvent);

      expect(finalEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('does not call preventDefault when the option is false', async () => {
      konami = new KonamiCode(mockCallback, { preventDefault: false });
      await konami.enable();

      const sequence = SEQUENCES.classic;
      for (let i = 0; i < sequence.length - 1; i++) {
        await konami.triggerKey(sequence[i]);
      }

      const finalEvent = { key: sequence[sequence.length - 1], preventDefault: jest.fn() };
      await konami.handleKeydown(finalEvent);

      expect(finalEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('DOM CustomEvent', () => {
    it('dispatches a bubbling konamicode event on the target', async () => {
      const handler = jest.fn();
      document.addEventListener('konamicode', handler);

      await konami.enable();
      await konami.triggerSequence();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual(
        expect.objectContaining({
          timestamp: expect.any(Number),
          stats: expect.any(Object),
        }),
      );

      document.removeEventListener('konamicode', handler);
    });
  });

  describe('once mode', () => {
    it('only activates once', async () => {
      konami = new KonamiCode(mockCallback, { once: true });
      await konami.enable();

      await konami.triggerSequence();
      await konami.triggerSequence();

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('disables itself after activation', async () => {
      konami = new KonamiCode(mockCallback, { once: true });
      await konami.enable();

      await konami.triggerSequence();

      expect(konami.isEnabled()).toBe(false);
    });
  });

  describe('cooldown', () => {
    it('blocks activations inside the cooldown window', async () => {
      konami = new KonamiCode(mockCallback, { cooldown: 100 });
      await konami.enable();

      await konami.triggerSequence();
      await konami.triggerSequence();

      expect(mockCallback).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 150));
      await konami.triggerSequence();

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('records lastActivated in stats', async () => {
      konami = new KonamiCode(mockCallback, { cooldown: 1000 });
      await konami.enable();

      await konami.triggerSequence();
      expect(konami.getStats().lastActivated).toBeTruthy();
    });
  });

  describe('maxAttempts', () => {
    it('caps activations at maxAttempts', async () => {
      konami = new KonamiCode(mockCallback, { maxAttempts: 2 });
      await konami.enable();

      await konami.triggerSequence();
      await konami.triggerSequence();
      await konami.triggerSequence();

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('event system', () => {
    it('registers and fires event handlers', async () => {
      const handler = jest.fn();
      konami.on('activated', handler);

      await konami.enable();
      await konami.triggerSequence();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
          activations: 1,
        }),
      );
    });

    it('removes a previously registered handler', async () => {
      const handler = jest.fn();
      konami.on('activated', handler);
      konami.off('activated', handler);

      await konami.enable();
      await konami.triggerSequence();

      expect(handler).not.toHaveBeenCalled();
    });

    it('supports multiple handlers for the same event', async () => {
      const handlerA = jest.fn();
      const handlerB = jest.fn();

      konami.on('activated', handlerA);
      konami.on('activated', handlerB);

      await konami.enable();
      await konami.triggerSequence();

      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(handlerB).toHaveBeenCalledTimes(1);
    });

    it('silently ignores off() for unregistered handlers', () => {
      expect(() => konami.off('activated', () => {})).not.toThrow();
    });

    it('supports chaining on on/off', () => {
      const handler = jest.fn();
      const result = konami.on('activated', handler).on('progress', handler);
      expect(result).toBe(konami);
    });

    it('emits an error event when the callback throws', async () => {
      const errorHandler = jest.fn();
      const throwingCallback = jest.fn(() => { throw new Error('Boom'); });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      konami = new KonamiCode(throwingCallback);
      konami.on('error', errorHandler);

      await konami.enable();
      await konami.triggerSequence();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('statistics', () => {
    it('counts activations', async () => {
      await konami.enable();
      await konami.triggerSequence();
      await konami.triggerSequence();

      expect(konami.getStats().activations).toBe(2);
    });

    it('counts failed attempts', async () => {
      await konami.enable();
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('x');
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('y');

      expect(konami.getStats().attempts).toBe(2);
    });

    it('resets statistics', async () => {
      await konami.enable();
      await konami.triggerSequence();

      konami.resetStats();
      expect(konami.getStats()).toEqual({
        activations: 0,
        attempts: 0,
        lastActivated: null,
      });
    });

    it('returns a copy of stats, not a reference', () => {
      const a = konami.getStats();
      const b = konami.getStats();

      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('configuration methods', () => {
    it('swaps the callback with setCallback', async () => {
      const replacement = jest.fn();
      konami.setCallback(replacement);

      await konami.enable();
      await konami.triggerSequence();

      expect(mockCallback).not.toHaveBeenCalled();
      expect(replacement).toHaveBeenCalledTimes(1);
    });

    it('swaps the sequence with setSequence', async () => {
      konami.setSequence(['a', 'b', 'c']);

      await konami.enable();
      await konami.triggerKey('a');
      await konami.triggerKey('b');
      await konami.triggerKey('c');

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('reports progress correctly', async () => {
      await konami.enable();
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('ArrowUp');

      expect(konami.getProgress()).toEqual({ current: 2, total: 10, percentage: 20 });
    });

    it('resolves waitForActivation on next activation', async () => {
      await konami.enable();

      const waiter = konami.waitForActivation();
      await konami.triggerSequence();

      const payload = await waiter;
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('activations', 1);
    });

    it('supports chaining across configuration methods', () => {
      const result = konami.setCallback(jest.fn()).setSequence(['a', 'b']).resetStats();
      expect(result).toBe(konami);
    });
  });

  describe('destroy', () => {
    it('disables, nulls the callback, and clears listeners', async () => {
      const handler = jest.fn();
      konami.on('activated', handler);

      await konami.enable();
      await konami.destroy();

      expect(konami.isEnabled()).toBe(false);
      expect(konami.callback).toBeNull();

      await konami.triggerSequence();
      expect(handler).not.toHaveBeenCalled();
    });

    it('is safe to call twice', async () => {
      await konami.enable();
      await konami.destroy();
      await expect(konami.destroy()).resolves.not.toThrow();
    });
  });

  describe('debug mode', () => {
    it('logs progress messages when debug is true', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      konami = new KonamiCode(mockCallback, { debug: true });
      await konami.enable();
      expect(consoleSpy).toHaveBeenCalledWith('[KonamiCode] Listener enabled');

      await konami.triggerKey('ArrowUp');
      expect(consoleSpy).toHaveBeenCalledWith('[KonamiCode] Progress: 1/10');

      consoleSpy.mockRestore();
    });

    it('does not log when debug is false', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      konami = new KonamiCode(mockCallback, { debug: false });
      await konami.enable();

      const debugCalls = consoleSpy.mock.calls.filter(
        (call) => call[0] && call[0].includes('[KonamiCode]'),
      );
      expect(debugCalls).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('handles rapid parallel key presses', async () => {
      await konami.enable();

      await Promise.all(SEQUENCES.classic.map((key) => konami.triggerKey(key)));

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('works without a DOM target', async () => {
      const headless = new KonamiCode(mockCallback, { target: null });

      await headless.enable();
      expect(headless.isEnabled()).toBe(true);

      await headless.triggerSequence();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('awaits async callbacks', async () => {
      let finished = false;
      const asyncCallback = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        finished = true;
      });

      konami = new KonamiCode(asyncCallback);
      await konami.enable();
      await konami.triggerSequence();

      expect(asyncCallback).toHaveBeenCalledTimes(1);
      expect(finished).toBe(true);
    });

    it('catches synchronous callback errors', async () => {
      const errorCallback = jest.fn(() => { throw new Error('Test error'); });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      konami = new KonamiCode(errorCallback);
      await konami.enable();
      await konami.triggerSequence();

      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('[KonamiCode] Error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
