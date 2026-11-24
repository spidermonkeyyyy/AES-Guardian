# SANAD — AES Guardian

SANAD is a French-language React Native application for declaring, monitoring, and preventing Accidents d'Exposition au Sang (AES). The application includes a synthetic demo onboarding flow and local SQLite-backed AES workflows.

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

The demo data is synthetic and is not connected to a production clinical system. Historical project reports and decision records are retained under `docs/`.
