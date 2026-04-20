import { SEQUENCES } from './sequences.js';

describe('SEQUENCES', () => {
  it('exports the classic Konami code', () => {
    expect(SEQUENCES.classic).toEqual([
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a',
    ]);
  });

  it('exports simple, debug, and admin presets', () => {
    expect(SEQUENCES.simple).toEqual(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    expect(SEQUENCES.debug).toEqual(['d', 'e', 'b', 'u', 'g']);
    expect(SEQUENCES.admin).toEqual(['a', 'd', 'm', 'i', 'n']);
  });

  it('freezes the top-level object', () => {
    expect(Object.isFrozen(SEQUENCES)).toBe(true);
  });

  it('freezes each inner sequence array', () => {
    expect(Object.isFrozen(SEQUENCES.classic)).toBe(true);
    expect(Object.isFrozen(SEQUENCES.simple)).toBe(true);
    expect(Object.isFrozen(SEQUENCES.debug)).toBe(true);
    expect(Object.isFrozen(SEQUENCES.admin)).toBe(true);
  });
});
