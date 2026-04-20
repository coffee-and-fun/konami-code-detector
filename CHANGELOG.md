# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1](https://github.com/coffee-and-fun/konami-code-detector/compare/v1.0.0...v1.0.1) (2026-04-20)


### Bug Fixes

* version 1.0.0 ([4114cfc](https://github.com/coffee-and-fun/konami-code-detector/commit/4114cfc78774b42da6bc23e391a6efd7d898838e))

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added

- Initial release.
- `KonamiCode` class with a configurable sequence, timeout, cooldown, `once` mode, `maxAttempts`, debug logging, and `autoEnable`.
- Event system: `enabled`, `disabled`, `progress`, `activated`, `failed`, `error`.
- Bubbling `konamicode` `CustomEvent` dispatched on the configured target on activation.
- Built-in `SEQUENCES`: `classic`, `simple`, `debug`, `admin`.
- `defaultCallback` export.
- Testing helpers: `triggerKey`, `triggerSequence`.
- Jest test suite.
