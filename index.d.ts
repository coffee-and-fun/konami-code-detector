export type KonamiCodeCallback = () => void | Promise<void>;

export interface KonamiCodeOptions {
  /** Key sequence to detect. Defaults to the classic Konami code. */
  sequence?: readonly string[];
  /** Milliseconds of inactivity before the sequence resets. Default 1000. */
  timeout?: number;
  /** Element to listen on. Defaults to `document` in the browser. */
  target?: EventTarget | null;
  /** Whether to call `event.preventDefault()` on the final matching keypress. Default true. */
  preventDefault?: boolean;
  /** Fire the callback at most once. Default false. */
  once?: boolean;
  /** Log internal state transitions to the console. Default false. */
  debug?: boolean;
  /** Maximum number of successful activations. Default Infinity. */
  maxAttempts?: number;
  /** Minimum ms between successful activations. Default 0 (no cooldown). */
  cooldown?: number;
  /** Call `enable()` automatically from the constructor. Default false. */
  autoEnable?: boolean;
}

export interface KonamiCodeProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface KonamiCodeStats {
  activations: number;
  attempts: number;
  lastActivated: number | null;
}

export interface KonamiCodeEventMap {
  enabled: { timestamp: number };
  disabled: { timestamp: number };
  progress: KonamiCodeProgress;
  activated: { timestamp: number; activations: number };
  failed: { key: string; expected: string };
  error: { error: unknown; timestamp: number };
}

export type KonamiCodeEvent = keyof KonamiCodeEventMap;

export type KonamiCodeEventHandler<E extends KonamiCodeEvent> = (
  payload: KonamiCodeEventMap[E],
) => void | Promise<void>;

export interface KonamiCodeResolvedConfig {
  sequence: readonly string[];
  timeout: number;
  target: EventTarget | null;
  preventDefault: boolean;
  once: boolean;
  debug: boolean;
  maxAttempts: number;
  cooldown: number;
}

export declare const SEQUENCES: {
  readonly classic: readonly string[];
  readonly simple: readonly string[];
  readonly debug: readonly string[];
  readonly admin: readonly string[];
};

export declare const defaultCallback: KonamiCodeCallback;

export declare class KonamiCode {
  constructor(callback?: KonamiCodeCallback, options?: KonamiCodeOptions);

  callback: KonamiCodeCallback | null;
  config: KonamiCodeResolvedConfig;
  attempts: number;
  stats: KonamiCodeStats;

  enable(): Promise<this>;
  disable(): Promise<this>;
  reset(): void;
  activate(): Promise<void>;
  destroy(): Promise<void>;

  setCallback(callback: KonamiCodeCallback): this;
  setSequence(sequence: readonly string[]): this;

  isEnabled(): boolean;
  isActivated(): boolean;
  getProgress(): KonamiCodeProgress;
  getStats(): KonamiCodeStats;
  resetStats(): this;

  on<E extends KonamiCodeEvent>(event: E, handler: KonamiCodeEventHandler<E>): this;
  off<E extends KonamiCodeEvent>(event: E, handler: KonamiCodeEventHandler<E>): this;
  waitForActivation(): Promise<KonamiCodeEventMap['activated']>;

  triggerKey(key: string): Promise<void>;
  triggerSequence(): Promise<void>;
}

export default KonamiCode;
