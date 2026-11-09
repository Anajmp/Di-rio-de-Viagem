# Diário de Viagem — arquivos

Copie `App.tsx` e a pasta `src/` para a raiz de um projeto Expo com TypeScript
(substituindo o `App.tsx` que já existe).

## Instalação

```bash
npx create-expo-app@latest diario-de-viagem --template blank-typescript
cd diario-de-viagem

npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install expo-camera expo-media-library expo-location expo-sensors
```

Depois rode `npx expo start` e abra no Expo Go.

## Estrutura

```
App.tsx                 -> Stack Navigator (Home e Camera)
src/types/navigation.ts -> tipagem das rotas
src/pages/Home.tsx      -> nome do app, botão de foto, GPS e acelerômetro
src/pages/Camera.tsx    -> câmera, preview e salvar na galeria
```
