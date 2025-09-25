/**
 * @jest-environment jsdom
 */

const KonamiCode = require('./index');
const { SEQUENCES, defaultCallback } = require('./index');

describe('KonamiCode', () => {
  let konami;
  let mockCallback;

  beforeEach(() => {
    mockCallback = jest.fn();
    konami = new KonamiCode(mockCallback);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (konami) {
      await konami.destroy();
    }
  });

  describe('Constructor', () => {
    it('should create instance with default callback', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const konamiDefault = new KonamiCode();
      
      expect(konamiDefault).toBeInstanceOf(KonamiCode);
      expect(konamiDefault.callback).toBe(defaultCallback);
      
      consoleSpy.mockRestore();
    });

    it('should create instance with custom callback', () => {
      expect(konami).toBeInstanceOf(KonamiCode);
      expect(konami.callback).toBe(mockCallback);
    });

    it('should accept custom options', () => {
      const customKonami = new KonamiCode(mockCallback, {
        sequence: SEQUENCES.simple,
        timeout: 2000,
        once: true,
        debug: true
      });

      expect(customKonami.config.sequence).toBe(SEQUENCES.simple);
      expect(customKonami.config.timeout).toBe(2000);
      expect(customKonami.config.once).toBe(true);
      expect(customKonami.config.debug).toBe(true);
    });

    it('should auto-enable if specified', async () => {
      const autoKonami = new KonamiCode(mockCallback, {
        autoEnable: true
      });

      expect(autoKonami.isEnabled()).toBe(true);
      await autoKonami.destroy();
    });
  });

  describe('Enable/Disable', () => {
    it('should enable listener', async () => {
      await konami.enable();
      expect(konami.isEnabled()).toBe(true);
    });

    it('should disable listener', async () => {
      await konami.enable();
      await konami.disable();
      expect(konami.isEnabled()).toBe(false);
    });

    it('should not double-enable', async () => {
      await konami.enable();
      const result = await konami.enable();
      expect(result).toBe(konami);
      expect(konami.isEnabled()).toBe(true);
    });

    it('should emit enabled event', async () => {
      const handler = jest.fn();
      konami.on('enabled', handler);
      
      await konami.enable();
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
    });

    it('should emit disabled event', async () => {
      const handler = jest.fn();
      konami.on('disabled', handler);
      
      await konami.enable();
      await konami.disable();
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('Sequence Detection', () => {
    beforeEach(async () => {
      await konami.enable();
    });

    it('should activate on correct sequence', async () => {
      for (const key of SEQUENCES.classic) {
        await konami.triggerKey(key);
      }
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(konami.isActivated()).toBe(true);
    });

    it('should reset on wrong key', async () => {
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('ArrowLeft'); // Wrong key
      
      const progress = konami.getProgress();
      expect(progress.current).toBe(0);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should emit progress events', async () => {
      const progressHandler = jest.fn();
      konami.on('progress', progressHandler);
      
      await konami.triggerKey('ArrowUp');
      
      expect(progressHandler).toHaveBeenCalledTimes(1);
      expect(progressHandler).toHaveBeenCalledWith({
        current: 1,
        total: 10,
        percentage: 10
      });
    });

    it('should emit failed event on wrong key', async () => {
      const failHandler = jest.fn();
      konami.on('failed', failHandler);
      
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('x'); // Wrong key
      
      expect(failHandler).toHaveBeenCalledTimes(1);
      expect(failHandler).toHaveBeenCalledWith({
        key: 'x',
        expected: 'arrowup'
      });
    });

    it('should work with custom sequence', async () => {
      await konami.destroy();
      konami = new KonamiCode(mockCallback, {
        sequence: SEQUENCES.simple
      });
      await konami.enable();
      
      for (const key of SEQUENCES.simple) {
        await konami.triggerKey(key);
      }
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle triggerSequence helper', async () => {
      await konami.triggerSequence();
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(konami.isActivated()).toBe(true);
    });

    it('should be case insensitive', async () => {
      await konami.triggerKey('arrowup');
      await konami.triggerKey('ARROWUP');
      await konami.triggerKey('ArrowDown');
      
      const progress = konami.getProgress();
      expect(progress.current).toBe(3);
    });
  });

  describe('Once Mode', () => {
    it('should only activate once', async () => {
      konami = new KonamiCode(mockCallback, { once: true });
      await konami.enable();
      
      await konami.triggerSequence();
      await konami.triggerSequence();
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should disable after activation in once mode', async () => {
      konami = new KonamiCode(mockCallback, { once: true });
      await konami.enable();
      
      await konami.triggerSequence();
      
      expect(konami.isEnabled()).toBe(false);
    });
  });

  describe('Cooldown', () => {
    it('should respect cooldown period', async () => {
      konami = new KonamiCode(mockCallback, { cooldown: 100 });
      await konami.enable();
      
      await konami.triggerSequence();
      await konami.triggerSequence(); // Should be blocked by cooldown
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      
      // Wait for cooldown to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      await konami.triggerSequence();
      
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should track cooldown in stats', async () => {
      konami = new KonamiCode(mockCallback, { cooldown: 1000 });
      await konami.enable();
      
      await konami.triggerSequence();
      const stats = konami.getStats();
      expect(stats.lastActivated).toBeTruthy();
    });
  });

  describe('Max Attempts', () => {
    it('should limit activations to maxAttempts', async () => {
      konami = new KonamiCode(mockCallback, { maxAttempts: 2 });
      await konami.enable();
      
      await konami.triggerSequence();
      await konami.triggerSequence();
      await konami.triggerSequence(); // Should be blocked
      
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event System', () => {
    it('should register and trigger event listeners', async () => {
      const handler = jest.fn();
      konami.on('activated', handler);
      
      await konami.enable();
      await konami.triggerSequence();
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
          activations: 1
        })
      );
    });

    it('should remove event listeners', async () => {
      const handler = jest.fn();
      konami.on('activated', handler);
      konami.off('activated', handler);
      
      await konami.enable();
      await konami.triggerSequence();
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      konami.on('activated', handler1);
      konami.on('activated', handler2);
      
      await konami.enable();
      await konami.triggerSequence();
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should support chaining', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      const result = konami
        .on('activated', handler1)
        .on('progress', handler2);
      
      expect(result).toBe(konami);
    });
  });

  describe('Statistics', () => {
    it('should track activations', async () => {
      await konami.enable();
      await konami.triggerSequence();
      await konami.triggerSequence();
      
      const stats = konami.getStats();
      expect(stats.activations).toBe(2);
    });

    it('should track failed attempts', async () => {
      await konami.enable();
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('x'); // Wrong
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('y'); // Wrong
      
      const stats = konami.getStats();
      expect(stats.attempts).toBe(2);
    });

    it('should reset statistics', async () => {
      await konami.enable();
      await konami.triggerSequence();
      
      konami.resetStats();
      const stats = konami.getStats();
      
      expect(stats.activations).toBe(0);
      expect(stats.attempts).toBe(0);
      expect(stats.lastActivated).toBeNull();
    });

    it('should return a copy of stats', () => {
      const stats1 = konami.getStats();
      const stats2 = konami.getStats();
      
      expect(stats1).not.toBe(stats2);
      expect(stats1).toEqual(stats2);
    });
  });

  describe('Methods', () => {
    it('should change callback', async () => {
      const newCallback = jest.fn();
      konami.setCallback(newCallback);
      
      await konami.enable();
      await konami.triggerSequence();
      
      expect(mockCallback).not.toHaveBeenCalled();
      expect(newCallback).toHaveBeenCalledTimes(1);
    });

    it('should change sequence', async () => {
      const customSequence = ['a', 'b', 'c'];
      konami.setSequence(customSequence);
      
      await konami.enable();
      await konami.triggerKey('a');
      await konami.triggerKey('b');
      await konami.triggerKey('c');
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should return progress', async () => {
      await konami.enable();
      await konami.triggerKey('ArrowUp');
      await konami.triggerKey('ArrowUp');
      
      const progress = konami.getProgress();
      expect(progress.current).toBe(2);
      expect(progress.total).toBe(10);
      expect(progress.percentage).toBe(20);
    });

    it('should wait for activation', async () => {
      await konami.enable();
      
      const activationPromise = konami.waitForActivation();
      await konami.triggerSequence();
      
      const result = await activationPromise;
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('activations', 1);
    });

    it('should support method chaining', () => {
      const result = konami
        .setCallback(jest.fn())
        .setSequence(['a', 'b'])
        .resetStats();
      
      expect(result).toBe(konami);
    });
  });

  describe('Destroy', () => {
    it('should clean up properly', async () => {
      const handler = jest.fn();
      konami.on('activated', handler);
      
      await konami.enable();
      await konami.destroy();
      
      expect(konami.isEnabled()).toBe(false);
      expect(konami.callback).toBeNull();
      
      // Try to trigger after destroy (should not work)
      await konami.triggerSequence();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should clear all listeners', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      konami.on('activated', handler1);
      konami.on('progress', handler2);
      
      await konami.destroy();
      
      // These should not be called
      await konami.triggerSequence();
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Default Callback', () => {
    it('should log default message when no callback provided', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const konamiDefault = new KonamiCode();
      
      await konamiDefault.enable();
      await konamiDefault.triggerSequence();
      
      expect(consoleSpy).toHaveBeenCalledWith('🎮 Konami Code Activated! ↑↑↓↓←→←→BA');
      expect(consoleSpy).toHaveBeenCalledWith('💫 You found the easter egg!');
      
      consoleSpy.mockRestore();
      await konamiDefault.destroy();
    });
  });

  describe('Debug Mode', () => {
    it('should log debug messages when debug is true', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      konami = new KonamiCode(mockCallback, { debug: true });
      await konami.enable();
      
      expect(consoleSpy).toHaveBeenCalledWith('[KonamiCode] Listener enabled');
      
      await konami.triggerKey('ArrowUp');
      expect(consoleSpy).toHaveBeenCalledWith('[KonamiCode] Progress: 1/10');
      
      consoleSpy.mockRestore();
    });

    it('should not log when debug is false', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      konami = new KonamiCode(mockCallback, { debug: false });
      await konami.enable();
      
      const calls = consoleSpy.mock.calls.filter(
        call => call[0] && call[0].includes('[KonamiCode]')
      );
      expect(calls.length).toBe(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid key presses', async () => {
      await konami.enable();
      
      // Rapidly trigger keys
      const promises = SEQUENCES.classic.map(key => konami.triggerKey(key));
      await Promise.all(promises);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle no target in non-browser environment', async () => {
      const konamiNoTarget = new KonamiCode(mockCallback, {
        target: null
      });
      
      await konamiNoTarget.enable();
      expect(konamiNoTarget.isEnabled()).toBe(true);
      
      // Should not throw
      await konamiNoTarget.triggerSequence();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle async callbacks', async () => {
      let asyncComplete = false;
      const asyncCallback = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        asyncComplete = true;
      });
      
      konami = new KonamiCode(asyncCallback);
      await konami.enable();
      await konami.triggerSequence();
      
      expect(asyncCallback).toHaveBeenCalledTimes(1);
      expect(asyncComplete).toBe(true);
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      konami = new KonamiCode(errorCallback);
      await konami.enable();
      await konami.triggerSequence();
      
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[KonamiCode] Error:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});

describe('SEQUENCES', () => {
  it('should export predefined sequences', () => {
    expect(SEQUENCES.classic).toEqual([
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'
    ]);
    expect(SEQUENCES.simple).toEqual(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    expect(SEQUENCES.debug).toEqual(['d', 'e', 'b', 'u', 'g']);
    expect(SEQUENCES.admin).toEqual(['a', 'd', 'm', 'i', 'n']);
  });

  it('should be frozen', () => {
    expect(Object.isFrozen(SEQUENCES)).toBe(true);
  });
});

describe('Exports', () => {
  it('should export as default', () => {
    expect(KonamiCode).toBeDefined();
    expect(typeof KonamiCode).toBe('function');
  });

  it('should export named exports', () => {
    const { KonamiCode: Named, SEQUENCES: Seqs, defaultCallback: DefCb } = require('./index');
    expect(Named).toBe(KonamiCode);
    expect(Seqs).toBe(SEQUENCES);
    expect(DefCb).toBe(defaultCallback);
  });
});