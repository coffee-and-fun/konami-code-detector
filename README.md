# konami-code-detector

> A lightweight, zero-dependency JavaScript library for detecting the Konami Code sequence on your website. Add easter eggs and hidden features with style! 🎮

[![npm version](https://img.shields.io/npm/v/konami-code-detector.svg)](https://www.npmjs.com/package/konami-code-detector)
[![npm downloads](https://img.shields.io/npm/dm/konami-code-detector.svg)](https://www.npmjs.com/package/konami-code-detector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Size](https://img.shields.io/bundlephobia/minzip/konami-code-detector)](https://bundlephobia.com/package/konami-code-detector)

## Features

- 🚀 **Zero dependencies** - Pure JavaScript, no bloat
- 📦 **Tiny footprint** - Less than 4KB minified
- 🎯 **Multiple sequences** - Classic Konami, custom patterns, and presets
- ⚡ **Modern JavaScript** - ES6+ with async/await support
- 🔧 **Framework agnostic** - Works with React, Vue, Angular, or vanilla JS
- 📱 **Cross-platform** - Browser, Node.js, and Chrome extensions
- ✅ **Fully tested** - 100% test coverage with Jest
- 📝 **Well documented** - Comprehensive API documentation

## Installation

### NPM
```bash
npm install konami-code-detector
```

### Yarn
```bash
yarn add konami-code-detector
```

### CDN
```html
<script src="https://unpkg.com/konami-code-detector/src/index.js"></script>
```

## Quick Start

```javascript
const KonamiCode = require('konami-code-detector');
// or
import KonamiCode from 'konami-code-detector';

// Initialize with default settings - it just works!
const konami = new KonamiCode();
konami.enable();

// That's it! Press ↑↑↓↓←→←→BA to see the magic ✨
```

## Usage Examples

### Default Behavior

When no callback is provided, the library logs a fun default message:

```javascript
const konami = new KonamiCode();
konami.enable();
// When activated: "🎮 Konami Code Activated! ↑↑↓↓←→←→BA"
```

### Custom Callback

```javascript
const konami = new KonamiCode(() => {
  document.body.style.background = 'linear-gradient(45deg, #ff006e, #8338ec)';
  alert('🎉 You found the secret!');
});
konami.enable();
```

### Async Operations

```javascript
const konami = new KonamiCode(async () => {
  const response = await fetch('/api/unlock-feature');
  const data = await response.json();
  console.log('Feature unlocked:', data);
});
konami.enable();
```

### Event System

```javascript
const konami = new KonamiCode();

konami
  .on('progress', ({ percentage }) => {
    document.querySelector('.progress-bar').style.width = `${percentage}%`;
  })
  .on('activated', () => {
    confetti(); // Trigger confetti animation
  })
  .on('failed', () => {
    document.body.style.animation = 'shake 0.5s';
  });

konami.enable();
```

### Custom Sequences

```javascript
const { SEQUENCES } = require('konami-code-detector');

// Use built-in sequences
const debugMode = new KonamiCode(unlockDebugPanel, {
  sequence: SEQUENCES.debug  // 'd', 'e', 'b', 'u', 'g'
});

// Or create your own
const customCode = new KonamiCode(activateFeature, {
  sequence: ['g', 'o', 'd', 'm', 'o', 'd', 'e']
});
```

## API Reference

### Constructor

```javascript
new KonamiCode(callback?, options?)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `callback` | `Function` | `defaultCallback` | Function to execute when code is activated |
| `options` | `Object` | `{}` | Configuration options |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sequence` | `string[]` | `SEQUENCES.classic` | Key sequence to detect |
| `timeout` | `number` | `1000` | Time in ms before sequence resets |
| `target` | `EventTarget` | `document` | Element to listen for keypresses |
| `once` | `boolean` | `false` | Only allow activation once |
| `debug` | `boolean` | `false` | Enable debug logging |
| `maxAttempts` | `number` | `Infinity` | Maximum number of activations |
| `cooldown` | `number` | `0` | Cooldown period between activations (ms) |
| `autoEnable` | `boolean` | `false` | Automatically enable on instantiation |
| `preventDefault` | `boolean` | `true` | Prevent default key behavior on activation |

### Methods

#### Core Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `enable()` | `Promise<KonamiCode>` | Start listening for keypresses |
| `disable()` | `Promise<KonamiCode>` | Stop listening for keypresses |
| `destroy()` | `Promise<void>` | Clean up and remove all listeners |
| `reset()` | `void` | Reset the current sequence progress |

#### Configuration Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setCallback(fn)` | `KonamiCode` | Update the activation callback |
| `setSequence(keys)` | `KonamiCode` | Change the key sequence |

#### State Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `isEnabled()` | `boolean` | Check if listener is active |
| `isActivated()` | `boolean` | Check if code has been activated |
| `getProgress()` | `Object` | Get current sequence progress |
| `getStats()` | `Object` | Get activation statistics |
| `resetStats()` | `KonamiCode` | Reset all statistics |

#### Event Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `on(event, handler)` | `KonamiCode` | Add event listener |
| `off(event, handler)` | `KonamiCode` | Remove event listener |
| `waitForActivation()` | `Promise` | Wait for next activation |

#### Testing Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `triggerKey(key)` | `Promise<void>` | Manually trigger a key press |
| `triggerSequence()` | `Promise<void>` | Manually trigger the full sequence |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `enabled` | `{ timestamp }` | Fired when listener is enabled |
| `disabled` | `{ timestamp }` | Fired when listener is disabled |
| `progress` | `{ current, total, percentage }` | Fired on sequence progress |
| `activated` | `{ timestamp, activations }` | Fired on successful activation |
| `failed` | `{ key, expected }` | Fired when wrong key is pressed |
| `error` | `{ error, timestamp }` | Fired when an error occurs |

### Built-in Sequences

```javascript
const { SEQUENCES } = require('konami-code-detector');

SEQUENCES.classic  // ↑ ↑ ↓ ↓ ← → ← → B A
SEQUENCES.simple   // ↑ ↓ ← →
SEQUENCES.debug    // D E B U G
SEQUENCES.admin    // A D M I N
```

## Framework Integration

### React

```javascript
import { useEffect, useRef } from 'react';
import KonamiCode from 'konami-code-detector';

function App() {
  const konamiRef = useRef(null);

  useEffect(() => {
    konamiRef.current = new KonamiCode(() => {
      console.log('Easter egg activated in React!');
    });
    
    konamiRef.current.enable();

    return () => {
      konamiRef.current?.destroy();
    };
  }, []);

  return <div>Your app content</div>;
}
```

### Vue 3

```javascript
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import KonamiCode from 'konami-code-detector';

const konami = ref(null);

onMounted(() => {
  konami.value = new KonamiCode(() => {
    console.log('Easter egg activated in Vue!');
  });
  konami.value.enable();
});

onUnmounted(() => {
  konami.value?.destroy();
});
</script>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import KonamiCode from 'konami-code-detector';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit, OnDestroy {
  private konami: any;

  ngOnInit() {
    this.konami = new KonamiCode(() => {
      console.log('Easter egg activated in Angular!');
    });
    this.konami.enable();
  }

  ngOnDestroy() {
    this.konami?.destroy();
  }
}
```

### Chrome Extension

```javascript
// content.js
const KonamiCode = require('konami-code-detector');

const konami = new KonamiCode(async () => {
  // Send message to background script
  const response = await chrome.runtime.sendMessage({ 
    type: 'KONAMI_ACTIVATED'
  });
  console.log('Easter egg unlocked!', response);
});

konami.enable();
```

```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'KONAMI_ACTIVATED') {
    console.log('Konami code activated on:', sender.tab.url);
    sendResponse({ success: true });
  }
});
```

## Real-World Examples

### Gaming Website

```javascript
const konami = new KonamiCode(() => {
  document.body.classList.add('retro-mode');
  new Audio('/sounds/powerup.mp3').play();
  showSecretCharacter();
});
```

### Developer Tools

```javascript
const konami = new KonamiCode(() => {
  localStorage.setItem('debug_mode', 'true');
  console.log('Debug mode enabled!');
  window.location.reload();
}, {
  sequence: SEQUENCES.debug,
  once: true
});
```

### Fun Animation

```javascript
const konami = new KonamiCode(() => {
  const img = document.createElement('img');
  img.src = 'https://media.giphy.com/media/3o7aCPVr3uUiCdmYQE/giphy.gif';
  img.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
  `;
  document.body.appendChild(img);
  
  setTimeout(() => img.remove(), 3000);
});
```

### Progressive Enhancement

```javascript
const konami = new KonamiCode();
let level = 0;

konami.on('activated', () => {
  level++;
  switch(level) {
    case 1:
      console.log('Level 1: You found the first secret!');
      break;
    case 2:
      console.log('Level 2: You are persistent!');
      document.body.style.filter = 'hue-rotate(90deg)';
      break;
    case 3:
      console.log('Level 3: Ultimate Easter Egg Master!');
      activatePartyMode();
      break;
  }
});

konami.enable();
```

## Browser Support

Works in all modern browsers that support ES6+:

- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+
- Opera 38+

For older browsers, use a transpiler like Babel.

## Testing

The package includes comprehensive Jest tests:

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Advanced Configuration

### Multiple Instances

```javascript
// Different codes for different features
const debugMode = new KonamiCode(enableDebug, {
  sequence: SEQUENCES.debug
});

const godMode = new KonamiCode(enableGodMode, {
  sequence: ['g', 'o', 'd'],
  cooldown: 5000
});

const resetApp = new KonamiCode(resetApplication, {
  sequence: ['r', 'e', 's', 'e', 't'],
  once: true
});

debugMode.enable();
godMode.enable();
resetApp.enable();
```

### Conditional Activation

```javascript
const konami = new KonamiCode(async () => {
  const userRole = await getUserRole();
  
  if (userRole === 'admin') {
    showAdminPanel();
  } else if (userRole === 'developer') {
    showDebugTools();
  } else {
    showEasterEgg();
  }
});
```

### With State Management

```javascript
// Redux example
const konami = new KonamiCode(() => {
  store.dispatch({ type: 'KONAMI_ACTIVATED' });
});

// Vuex example
const konami = new KonamiCode(() => {
  store.commit('activateEasterEgg');
});

// Zustand example
const konami = new KonamiCode(() => {
  useStore.setState({ easterEggActive: true });
});
```

## Performance Considerations

- Event listeners are automatically cleaned up to prevent memory leaks
- Uses `AbortController` for efficient listener management
- Minimal CPU usage - only processes relevant keypress events
- No polling or continuous checks
- Lazy initialization of features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/konami-code-detector.git
cd konami-code-detector

# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

## Troubleshooting

### Code not detecting?
- Ensure the target element has focus
- Check that no other element is preventing event propagation
- Verify the sequence is correct (case-insensitive)

### Multiple activations?
- Use the `once: true` option
- Set a `cooldown` period between activations
- Implement `maxAttempts` limit

### Memory leaks?
- Always call `destroy()` when removing the component
- Use `AbortController` is automatically handled

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the classic Konami Code from the 1986 NES port of Gradius
- Thanks to all contributors and users of this library
- Special thanks to the JavaScript community

## Support

If you like this project, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📖 Improving documentation

## Changelog

### Version 1.0.0 (2024)
- Initial release
- Core functionality
- Event system
- Built-in sequences
- Full test coverage

---

Made with ❤️ and JavaScript