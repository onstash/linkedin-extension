# LinkedIn++

A browser extension that highlights your 1st and 2nd degree connections in LinkedIn's reaction modals, making it easier to identify networking opportunities.

## Features

- 🟢 **1st degree connections** — Highlighted with green border
- 🟡 **2nd degree connections** — Highlighted with yellow border
- ⚡ **Real-time detection** — Works with dynamically loaded content
- 🎛️ **Toggle on/off** — Control highlighting via popup

## Installation

### Development

```bash
# Install dependencies
pnpm install

# Start dev mode (Chrome)
pnpm dev

# Start dev mode (Firefox)
pnpm dev:firefox
```

### Build

```bash
# Build for Chrome
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distributable ZIP
pnpm zip
```

## Usage

1. Navigate to LinkedIn
2. Click the extension icon
3. Click **"Start Highlighting"**
4. Open any post's reactions modal
5. 1st and 2nd degree connections will be visually highlighted

## Tech Stack

- [WXT](https://wxt.dev) — Next-gen browser extension framework
- [React 19](https://react.dev) — UI components
- [TypeScript](https://www.typescriptlang.org) — Type safety

## License

MIT
