# SANAD

SANAD is a French-language React Native application for declaring, monitoring, and preventing Accidents d'Exposition au Sang (AES). Its welcome identity is **SANAD — Déclarer. Suivre. Prévenir.** The application includes synthetic demonstration roles and local SQLite-backed AES workflows.

## Quick start

```powershell
npm install
npm start
npm run android
```

## Project structure

- `src/features/aes-guardian/` contains the AES declaration, review, occupational-health coordination, surveillance, prevention, onboarding, and profile workflows.
- `src/core/` contains the local database, authorization boundaries, audit events, and domain services.
- `src/theme/` contains the shared SANAD theme and bilingual typography system.
- `android/app/` is the React Native Android application.

## Android JavaScript bundling

Build both Android variants through the React Native Gradle plugin:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
.\gradlew.bat :app:assembleRelease
```

The plugin bundles the root `index.js` entry point for debug and release. Do not place manually generated `index.android.bundle` files under `android/app/src/**/assets`; Gradle-generated bundles in `android/app/build/` are the build inputs.

The demo data is synthetic and is not connected to a production clinical system. Historical project reports and decision records are retained under `docs/`.
