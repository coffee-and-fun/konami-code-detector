import { jest } from '@jest/globals';
import { defaultCallback } from './default-callback.js';

describe('defaultCallback', () => {
  it('logs the activation banner to the console', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    defaultCallback();

    expect(consoleSpy).toHaveBeenCalledWith('🎮 Konami Code Activated! ↑↑↓↓←→←→BA');
    expect(consoleSpy).toHaveBeenCalledWith('💫 You found the easter egg!');

    consoleSpy.mockRestore();
  });
});
