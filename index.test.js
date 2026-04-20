import KonamiCode, {
  KonamiCode as NamedKonamiCode,
  SEQUENCES,
  defaultCallback,
} from './index.js';
import { KonamiCode as SourceKonamiCode } from './src/konami-code.js';
import { SEQUENCES as SourceSequences } from './src/sequences.js';
import { defaultCallback as sourceDefaultCallback } from './src/default-callback.js';

describe('public barrel (index.js)', () => {
  it('re-exports KonamiCode as the default export', () => {
    expect(KonamiCode).toBe(SourceKonamiCode);
  });

  it('re-exports KonamiCode as a named export equal to the default', () => {
    expect(NamedKonamiCode).toBe(KonamiCode);
  });

  it('re-exports SEQUENCES', () => {
    expect(SEQUENCES).toBe(SourceSequences);
  });

  it('re-exports defaultCallback', () => {
    expect(defaultCallback).toBe(sourceDefaultCallback);
  });
});
