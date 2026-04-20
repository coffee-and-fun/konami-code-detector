# 🎮 @coffeeandfun/konami-code-detector

A tiny, modern library that watches for the Konami Code (↑ ↑ ↓ ↓ ← → ← → B A) — or any key sequence you pick — and runs a callback when the user finishes it.

- 🪶 Zero runtime dependencies
- 🚀 Ships as native ESM with TypeScript declarations
- 🧩 Works with React, Vue, Svelte, Angular, plain JavaScript, Chrome extensions — anywhere with a DOM
- ⚙️ Configurable: custom sequences, cooldowns, one-shot mode, max-attempts, progress events, async callbacks
- 🧪 Fully tested with Jest + jsdom

## 📦 Install

```bash
npm install @coffeeandfun/konami-code-detector
```

Requires Node.js 16+ to install. In the browser it works anywhere `AbortController` and modern classes are supported (Chrome 66+, Firefox 57+, Safari 11.1+, Edge 79+).

## ⚡ Quick start

```js
import KonamiCode from '@coffeeandfun/konami-code-detector';

const konami = new KonamiCode(() => {
  document.body.classList.add('party-mode');
});

await konami.enable();
// Press ↑ ↑ ↓ ↓ ← → ← → B A — the callback fires 🎉
```

That's it. Everything else in this README is optional.

## 🧠 Mental model

You create an instance, give it a callback, call `enable()`, and the detector listens for `keydown` events. Every correct key in the sequence fires a `progress` event. A wrong key resets progress and fires a `failed` event. When the user finishes the sequence:

1. Your callback runs (sync or async — both are awaited).
2. An `activated` event fires.
3. A bubbling `konamicode` `CustomEvent` is dispatched on your target, so code outside the instance can react too.

If you stop caring, call `destroy()` and it cleans itself up.

## 🖼️ What an instance looks like

```js
const konami = new KonamiCode(callback, options);
// →
{
  callback,               // the function you passed
  config: {
    sequence,             // resolved key list
    timeout,              // ms of inactivity before progress resets
    target,               // element the keydown listener is on
    preventDefault,       // whether to preventDefault on the final key
    once,                 // fire at most once?
    debug,                // log state transitions?
    maxAttempts,          // cap on activations
    cooldown,             // ms between activations
  },
  attempts: 0,            // successful activations
  stats: {
    activations: 0,
    attempts: 0,          // failed attempts (wrong keys)
    lastActivated: null,  // ms timestamp of last success
  },
  // plus the methods documented below
}
```

---

## 🧪 Examples by framework

Each example is self-contained and does the same thing: fires a callback when the Konami code is entered. Pick the one that matches your stack.

### 🟨 Vanilla JavaScript (with a bundler)

```js
import KonamiCode from '@coffeeandfun/konami-code-detector';

const konami = new KonamiCode(() => {
  alert('🎉 You found the secret!');
});

konami.enable();
```

### 🌐 Plain HTML, no bundler (ESM CDN)

```html
<!doctype html>
<html>
  <body>
    <h1>Try the Konami code 👀</h1>
    <script type="module">
      import KonamiCode from 'https://esm.sh/@coffeeandfun/konami-code-detector';

      const konami = new KonamiCode(() => {
        document.body.style.background = 'linear-gradient(45deg, #ff006e, #8338ec)';
      });

      konami.enable();
    </script>
  </body>
</html>
```

### ⚛️ React (hook version)

```jsx
import { useEffect, useRef } from 'react';
import KonamiCode from '@coffeeandfun/konami-code-detector';

export function App() {
  const konamiRef = useRef(null);

  useEffect(() => {
    konamiRef.current = new KonamiCode(() => {
      console.log('✨ activated in React!');
    });
    konamiRef.current.enable();

    return () => {
      konamiRef.current?.destroy();
    };
  }, []);

  return <div>Try the Konami code 🎮</div>;
}
```

### ⚛️ React (custom hook — reusable)

```jsx
import { useEffect, useRef } from 'react';
import KonamiCode from '@coffeeandfun/konami-code-detector';

export function useKonamiCode(callback, options) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const konami = new KonamiCode(() => callbackRef.current?.(), options);
    konami.enable();
    return () => { konami.destroy(); };
  }, []);
}

// Usage:
function PartyButton() {
  useKonamiCode(() => {
    document.body.classList.add('party-mode');
  });
  return <button>Keep trying… 🕹️</button>;
}
```

### 🟢 Vue 3 (Composition API)

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import KonamiCode from '@coffeeandfun/konami-code-detector';

const konami = ref(null);

onMounted(() => {
  konami.value = new KonamiCode(() => console.log('🎉 activated in Vue!'));
  konami.value.enable();
});

onUnmounted(() => {
  konami.value?.destroy();
});
</script>

<template>
  <p>Try the Konami code 🎮</p>
</template>
```

### 🟢 Vue 3 (reusable composable)

```js
// composables/useKonamiCode.js
import { onMounted, onUnmounted, ref } from 'vue';
import KonamiCode from '@coffeeandfun/konami-code-detector';

export function useKonamiCode(callback, options) {
  const instance = ref(null);

  onMounted(() => {
    instance.value = new KonamiCode(callback, options);
    instance.value.enable();
  });

  onUnmounted(() => {
    instance.value?.destroy();
  });

  return instance;
}
```

```vue
<script setup>
import { useKonamiCode } from './composables/useKonamiCode';

useKonamiCode(() => {
  document.body.classList.add('party-mode');
});
</script>
```

### 🔺 Svelte 4 / 5

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import KonamiCode from '@coffeeandfun/konami-code-detector';

  let konami;

  onMount(() => {
    konami = new KonamiCode(() => console.log('🎉 activated in Svelte!'));
    konami.enable();
  });

  onDestroy(() => {
    konami?.destroy();
  });
</script>

<p>Try the Konami code 🎮</p>
```

### 🅰️ Angular

```ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import KonamiCode from '@coffeeandfun/konami-code-detector';

@Component({
  selector: 'app-root',
  template: '<p>Try the Konami code 🎮</p>',
})
export class AppComponent implements OnInit, OnDestroy {
  private konami?: KonamiCode;

  ngOnInit() {
    this.konami = new KonamiCode(() => console.log('🎉 activated in Angular!'));
    this.konami.enable();
  }

  ngOnDestroy() {
    this.konami?.destroy();
  }
}
```

### ▲ Next.js (App Router — client component)

```tsx
'use client';

import { useEffect, useRef } from 'react';
import KonamiCode from '@coffeeandfun/konami-code-detector';

export function KonamiListener() {
  const ref = useRef<KonamiCode | null>(null);

  useEffect(() => {
    ref.current = new KonamiCode(() => {
      console.log('🎉 activated on the client');
    });
    ref.current.enable();

    return () => { ref.current?.destroy(); };
  }, []);

  return null;
}
```

Drop `<KonamiListener />` in your root layout. The `'use client'` directive keeps it out of SSR where there's no `document`.

### 🧩 Chrome extension (content script)

```js
import KonamiCode from '@coffeeandfun/konami-code-detector';

const konami = new KonamiCode(async () => {
  const response = await chrome.runtime.sendMessage({ type: 'KONAMI_ACTIVATED' });
  console.log('unlocked 🔓', response);
});

konami.enable();
```

```js
// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KONAMI_ACTIVATED') {
    console.log('🎮 Konami activated on', sender.tab?.url);
    sendResponse({ success: true });
  }
});
```

### 🧪 Node.js (headless testing)

The detector works without a DOM if you pass `target: null` and use the built-in `triggerKey` / `triggerSequence` helpers.

```js
import KonamiCode, { SEQUENCES } from '@coffeeandfun/konami-code-detector';

const konami = new KonamiCode(() => console.log('🎉 activated'), { target: null });
await konami.enable();
await konami.triggerSequence(); // → logs "🎉 activated"
```

---

## 🍳 Recipes

Real patterns people use this for.

### 🎨 Party mode (add a CSS class)

```js
const konami = new KonamiCode(() => {
  document.body.classList.add('party-mode');
});
konami.enable();
```

### 🐛 Hidden debug panel (custom sequence)

```js
import KonamiCode, { SEQUENCES } from '@coffeeandfun/konami-code-detector';

const konami = new KonamiCode(
  () => {
    document.querySelector('#debug-panel').hidden = false;
    localStorage.setItem('debugMode', 'true');
  },
  { sequence: SEQUENCES.debug, once: true },
);

konami.enable();
// Type D-E-B-U-G to reveal the panel, once per page load.
```

### 📊 Progress bar

```js
const konami = new KonamiCode();
const bar = document.querySelector('#konami-progress');

konami
  .on('progress', ({ percentage }) => { bar.style.width = `${percentage}%`; })
  .on('failed', () => { bar.style.width = '0%'; })
  .on('activated', () => { bar.style.width = '100%'; });

konami.enable();
```

### ⏱️ Cooldown between activations

```js
const konami = new KonamiCode(fireConfetti, { cooldown: 5000 });
await konami.enable();
// Subsequent activations inside 5s are silently dropped.
```

### 🔂 Fire only once

```js
const konami = new KonamiCode(unlockAchievement, { once: true });
await konami.enable();
// After the first activation, the instance disables itself automatically.
```

### 🧭 Track analytics on activation

```js
const konami = new KonamiCode();

konami.on('activated', ({ timestamp, activations }) => {
  analytics.track('konami_code_activated', { timestamp, activations });
});

konami.enable();
```

### 👂 Listen from outside the instance (DOM event)

```js
const konami = new KonamiCode();
konami.enable();

document.addEventListener('konamicode', (event) => {
  console.log('activated at', event.detail.timestamp);
  console.log('stats:', event.detail.stats);
});
```

### 🔐 Admin-only unlock (async check)

```js
const konami = new KonamiCode(async () => {
  const user = await fetchCurrentUser();
  if (user.role === 'admin') {
    showAdminPanel();
  }
});

konami.enable();
```

### 🎚️ Multiple codes, one page

```js
const debugMode = new KonamiCode(enableDebug, { sequence: SEQUENCES.debug });
const godMode   = new KonamiCode(enableGodMode, { sequence: ['g', 'o', 'd'], cooldown: 5000 });
const reset     = new KonamiCode(resetApp, { sequence: ['r', 'e', 's', 'e', 't'], once: true });

await Promise.all([debugMode.enable(), godMode.enable(), reset.enable()]);
```

---

## 📚 API reference

### Constructor

```js
new KonamiCode(callback?, options?)
```

| Parameter  | Type       | Default           | Description                                      |
| ---------- | ---------- | ----------------- | ------------------------------------------------ |
| `callback` | `Function` | `defaultCallback` | Runs when the sequence completes. May be async.  |
| `options`  | `Object`   | `{}`              | See below.                                       |

### Options

| Option           | Type          | Default             | Description                                                             |
| ---------------- | ------------- | ------------------- | ----------------------------------------------------------------------- |
| `sequence`       | `string[]`    | `SEQUENCES.classic` | Keys to detect, in order. Matched case-insensitively.                   |
| `timeout`        | `number`      | `1000`              | Ms of inactivity before the in-progress sequence resets.                |
| `target`         | `EventTarget` | `document`          | Element to listen on. Pass `null` for headless environments.            |
| `preventDefault` | `boolean`     | `true`              | Call `event.preventDefault()` on the final matching keypress.           |
| `once`           | `boolean`     | `false`             | Fire at most once, then auto-disable.                                   |
| `debug`          | `boolean`     | `false`             | Log internal state transitions to the console.                          |
| `maxAttempts`    | `number`      | `Infinity`          | Cap on successful activations.                                          |
| `cooldown`       | `number`      | `0`                 | Minimum ms between successful activations.                              |
| `autoEnable`     | `boolean`     | `false`             | Call `enable()` from the constructor.                                   |

### Methods

#### 🔌 Lifecycle

| Method        | Returns                 | Description                                        |
| ------------- | ----------------------- | -------------------------------------------------- |
| `enable()`    | `Promise<KonamiCode>`   | Attach the keydown listener.                       |
| `disable()`   | `Promise<KonamiCode>`   | Detach the listener and reset progress.            |
| `reset()`     | `void`                  | Reset sequence progress without disabling.         |
| `destroy()`   | `Promise<void>`         | Disable, clear event listeners, null the callback. |

#### ⚙️ Configuration

| Method              | Returns      | Description                                  |
| ------------------- | ------------ | -------------------------------------------- |
| `setCallback(fn)`   | `KonamiCode` | Replace the activation callback.             |
| `setSequence(keys)` | `KonamiCode` | Replace the key sequence and reset progress. |

#### 🔍 State inspection

| Method          | Returns                                    | Description                               |
| --------------- | ------------------------------------------ | ----------------------------------------- |
| `isEnabled()`   | `boolean`                                  | Whether the listener is attached.         |
| `isActivated()` | `boolean`                                  | Whether the code has fired at least once. |
| `getProgress()` | `{ current, total, percentage }`           | Current position in the sequence.         |
| `getStats()`    | `{ activations, attempts, lastActivated }` | Copy of stats.                            |
| `resetStats()`  | `KonamiCode`                               | Zero out all stats.                       |

#### 📣 Events

| Method                | Returns           | Description                                 |
| --------------------- | ----------------- | ------------------------------------------- |
| `on(event, handler)`  | `KonamiCode`      | Register an event handler.                  |
| `off(event, handler)` | `KonamiCode`      | Remove an event handler.                    |
| `waitForActivation()` | `Promise<object>` | Resolves on the next successful activation. |

#### 🧪 Testing helpers

| Method              | Returns         | Description                                        |
| ------------------- | --------------- | -------------------------------------------------- |
| `triggerKey(key)`   | `Promise<void>` | Simulate a single keypress (no-op if not enabled). |
| `triggerSequence()` | `Promise<void>` | Simulate the full configured sequence.             |

### Events

Fired via `on()` / `off()`. Handlers may be async; the emitter awaits them all.

| Event       | Payload                          | When it fires                             |
| ----------- | -------------------------------- | ----------------------------------------- |
| `enabled`   | `{ timestamp }`                  | After `enable()` attaches the listener.   |
| `disabled`  | `{ timestamp }`                  | After `disable()` detaches it.            |
| `progress`  | `{ current, total, percentage }` | On every correct key in the sequence.     |
| `activated` | `{ timestamp, activations }`     | When the sequence completes.              |
| `failed`    | `{ key, expected }`              | When a wrong key is pressed mid-sequence. |
| `error`     | `{ error, timestamp }`           | If the callback throws.                   |

A bubbling `konamicode` `CustomEvent` is also dispatched on the configured `target` when the code activates. Its `detail` is `{ timestamp, stats }`.

### Built-in sequences

```js
import { SEQUENCES } from '@coffeeandfun/konami-code-detector';

SEQUENCES.classic; // ↑ ↑ ↓ ↓ ← → ← → B A
SEQUENCES.simple;  // ↑ ↓ ← →
SEQUENCES.debug;   // D E B U G
SEQUENCES.admin;   // A D M I N
```

All sequences are frozen. Pass your own array to `sequence` if none of them fit.

---

## 🧪 Testing

```bash
npm test              # one run
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

Tests are written with Jest and jsdom. They run under native ESM via `--experimental-vm-modules`, so `jest` is imported from `@jest/globals` inside test files rather than being a global.

## 📜 License

MIT — see [LICENSE](LICENSE).
