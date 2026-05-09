# Matcha Auth

[中文](./README.md) | [English](./README.en.md) | 日本語

<p align="center">
  <img src="ReadmeRes/icon.svg" alt="Matcha Auth icon" width="120">
</p>

Matcha Auth は、Material You 風の 2FA/TOTP 認証アプリです。React と Capacitor で構築され、QR インポート、手動追加、動的コード更新、バッチインポート/エクスポート、Android 12+ Monet 動的カラーに対応します。

このプロジェクトは、認証アプリがユーザーのトークンを閉じた移行フローに閉じ込めるべきではない、という実用的な不満から生まれました。Matcha Auth は、トークン管理をより透明で制御しやすくしながら、モバイルでの使いやすさも保つことを目指しています。

## 主な機能

- **TOTP 生成**: 標準 `otpauth://` URI と Base32 secret から 6 桁コードを生成します。
- **QR インポート**: 通常の TOTP QR コードに対応します。
- **Google Authenticator Migration**: `otpauth-migration://` のバッチ移行 QR コードを解析します。
- **バッチエクスポート**: デバイス間で移行するための migration QR コードを生成できます。
- **ローカル保存**: トークンデータはローカルに保存され、クラウドアカウントに依存しません。
- **検索と管理**: トークン情報の検索、コピー、削除、編集に対応します。
- **Material You テーマ**: プリセット色、カスタム色、Android 12+ Monet 動的カラーを利用できます。
- **モバイル対応**: Capacitor により、Android カメラ権限、ステータスバー、ハードウェア戻るボタンに対応します。

## 技術スタック

- React 19
- Capacitor
- OTPAuth
- jsQR
- Framer Motion
- Android Dynamic Color / Monet
- Vite

## クイックスタート

```bash
npm install
npm run dev
```

Web 開発モードは UI と TOTP ロジックの確認に向いています。QR スキャン、ステータスバー、Android 戻る操作は、実機またはエミュレーターで確認してください。

## ビルド

```bash
npm run build
npm run preview
```

Capacitor プロジェクトへ同期します。

```bash
npm run cap:sync
```

よく使うスクリプト：

| Command | 説明 |
| --- | --- |
| `npm run dev` | Vite 開発サーバーを起動 |
| `npm run build` | バージョン情報を同期し、Web 成果物をビルド |
| `npm run preview` | ビルド結果をプレビュー |
| `npm run cap:add` | Capacitor プラットフォームを追加 |
| `npm run cap:sync` | ビルドしてネイティブプロジェクトへ同期 |
| `npm run generate-icons` | アプリアイコン素材を生成 |

## プロジェクト構成

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

| Path | 説明 |
| --- | --- |
| `services/totpService.ts` | TOTP 生成、`otpauth://` 解析、migration URI 生成 |
| `services/migrationService.ts` | Google Authenticator バッチ移行解析 |
| `services/monetService.ts` | Android Monet 動的カラー取得 |
| `services/themeService.ts` | テーマ生成と CSS 変数の適用 |
| `pages/TokenList.tsx` | トークン一覧、検索、インポート、エクスポート、操作メニュー |
| `pages/ThemeSettings.tsx` | テーマモード、プリセット、カスタム色、動的カラー設定 |

## セキュリティメモ

- TOTP secret は機密資格情報です。secret を持つ人は認証コードを生成できます。
- 現在のアプリはローカル保存を中心としており、クラウド同期やサーバーバックアップは提供しません。
- エクスポートした migration QR コードは、信頼できるデバイスと環境でのみ表示してください。
- より高い安全性が必要な場合は、OS の安全なストレージ、生体認証ロック、暗号化バックアップを検討してください。

## ライセンス

このプロジェクトは Apache License 2.0 の下で公開されています。詳しくは [LICENSE](./LICENSE) を参照してください。
