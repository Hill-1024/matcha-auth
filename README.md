# Matcha Auth

中文 | [English](./README.en.md) | [日本語](./README.ja.md)

<p align="center">
  <img src="ReadmeRes/icon.svg" alt="Matcha Auth icon" width="120">
</p>

Matcha Auth 是一个 Material You 风格的 2FA/TOTP 验证器。它基于 React + Capacitor 构建，支持二维码导入、手动添加、动态验证码刷新、批量导入/导出和 Android 12+ Monet 动态取色。

项目诞生于一个很实际的不满：验证器应用不应该把用户的令牌困在封闭迁移流程里。Matcha Auth 希望让令牌管理更透明、更可控，同时保持移动端使用体验足够顺手。

## 核心特点

- **TOTP 生成**: 基于标准 `otpauth://` URI 和 Base32 secret 生成 6 位动态验证码。
- **二维码导入**: 支持普通 TOTP 二维码。
- **Google Authenticator Migration**: 支持解析 `otpauth-migration://` 批量迁移二维码。
- **批量导出**: 可生成迁移二维码，方便在设备之间转移令牌。
- **本地存储**: 令牌数据保存在本地存储中，不依赖云端账号。
- **搜索与管理**: 支持搜索、复制、删除和编辑令牌信息。
- **Material You 主题**: 支持预设色、自定义色和 Android 12+ Monet 动态色。
- **移动端适配**: 使用 Capacitor 支持 Android 相机权限、状态栏和系统返回键。

## 技术栈

- React 19
- Capacitor
- OTPAuth
- jsQR
- Framer Motion
- Android Dynamic Color / Monet
- Vite

## 快速开始

```bash
npm install
npm run dev
```

Web 开发模式适合调试界面和 TOTP 逻辑。二维码扫描、状态栏和 Android 返回键等能力请在真机或模拟器中验证。

## 构建

```bash
npm run build
npm run preview
```

同步到 Capacitor 项目：

```bash
npm run cap:sync
```

常用脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务 |
| `npm run build` | 同步版本信息并构建 Web 产物 |
| `npm run preview` | 预览构建产物 |
| `npm run cap:add` | 添加 Capacitor 平台 |
| `npm run cap:sync` | 构建并同步原生项目 |
| `npm run generate-icons` | 生成应用图标资源 |

## 项目结构

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

| 路径 | 说明 |
| --- | --- |
| `services/totpService.ts` | TOTP 生成、`otpauth://` 解析、迁移 URI 生成 |
| `services/migrationService.ts` | Google Authenticator 批量迁移解析 |
| `services/monetService.ts` | Android Monet 动态色读取 |
| `services/themeService.ts` | 主题生成与 CSS 变量写入 |
| `pages/TokenList.tsx` | 令牌列表、搜索、导入、导出和操作菜单 |
| `pages/ThemeSettings.tsx` | 主题模式、预设色、自定义色和动态色设置 |

## 安全说明

- TOTP secret 是敏感凭据，拥有 secret 的人可以生成验证码。
- 当前应用以本地存储为核心，不提供云同步或服务端备份。
- 导出迁移二维码时，请只在可信设备和可信环境中展示。
- 如果你需要更高安全级别，应考虑系统级安全存储、生物识别解锁或加密备份。

## 许可证

本项目使用 Apache License 2.0。详见 [LICENSE](./LICENSE)。
