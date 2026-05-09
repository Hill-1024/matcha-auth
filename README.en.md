# Matcha Auth

[中文](./README.md) | English | [日本語](./README.ja.md)

<p align="center">
  <img src="ReadmeRes/icon.svg" alt="Matcha Auth icon" width="120">
</p>

Matcha Auth is a Material You styled 2FA/TOTP authenticator. Built with React and Capacitor, it supports QR import, manual token entry, live code refresh, batch import/export, and Android 12+ Monet dynamic colors.

The project came from a practical frustration: an authenticator should not trap users inside a closed migration flow. Matcha Auth aims to make token management more transparent and controllable while keeping the mobile experience smooth.

## Features

- **TOTP generation**: generates 6-digit codes from standard `otpauth://` URIs and Base32 secrets.
- **QR import**: supports ordinary TOTP QR codes.
- **Google Authenticator Migration**: parses `otpauth-migration://` batch migration QR codes.
- **Batch export**: generates migration QR codes for moving tokens between devices.
- **Local storage**: token data is stored locally and does not depend on a cloud account.
- **Search and management**: search, copy, delete, and edit token metadata.
- **Material You theming**: preset colors, custom colors, and Android 12+ Monet dynamic colors.
- **Mobile adaptation**: Capacitor support for Android camera permission, status bar, and hardware back button.

## Stack

- React 19
- Capacitor
- OTPAuth
- jsQR
- Framer Motion
- Android Dynamic Color / Monet
- Vite

## Quick Start

```bash
npm install
npm run dev
```

Web development mode is useful for UI and TOTP logic. QR scanning, status bar behavior, and Android back navigation should be verified on a device or emulator.

## Build

```bash
npm run build
npm run preview
```

Sync to the Capacitor project:

```bash
npm run cap:sync
```

Common scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Sync version metadata and build Web assets |
| `npm run preview` | Preview the build |
| `npm run cap:add` | Add a Capacitor platform |
| `npm run cap:sync` | Build and sync native projects |
| `npm run generate-icons` | Generate application icon assets |

## Project Structure

```text
.
├── App.tsx
├── components/
├── pages/
│   ├── ThemeSettings.tsx
│   └── TokenList.tsx
├── services/
│   ├── iconService.ts
│   ├── migrationService.ts
│   ├── monetService.ts
│   ├── themeService.ts
│   └── totpService.ts
├── assets/
├── public/
└── capacitor.config.ts
```

| Path | Purpose |
| --- | --- |
| `services/totpService.ts` | TOTP generation, `otpauth://` parsing, migration URI generation |
| `services/migrationService.ts` | Google Authenticator batch migration parsing |
| `services/monetService.ts` | Android Monet dynamic color access |
| `services/themeService.ts` | Theme generation and CSS variable application |
| `pages/TokenList.tsx` | Token list, search, import, export, and action menus |
| `pages/ThemeSettings.tsx` | Theme mode, presets, custom color, and dynamic color settings |

## Security Notes

- TOTP secrets are sensitive credentials. Anyone with the secret can generate verification codes.
- The current app is local-storage based and does not provide cloud sync or server backup.
- Show exported migration QR codes only on trusted devices in trusted environments.
- For higher assurance, consider system secure storage, biometric unlock, or encrypted backups.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](./LICENSE).
