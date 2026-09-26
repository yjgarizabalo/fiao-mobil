# 2026-09-20 — El teclado tapaba los inputs (registro, login, crear cliente, hojas)

**Objetivo:** el usuario reportó que en Android, al tocar un input cerca del final de la
pantalla, el teclado se sobreponía y tapaba lo que escribía. Pasaba en registro de usuario,
a veces en login, y en crear cliente. Pidió resolverlo en las dos plataformas, por fases y
sin romper nada existente.

**Rama:** `refactor/v2-arquitectura`

---

## Qué se encontró

Dos causas distintas, las dos alrededor de `KeyboardAvoidingView` de React Native:

1. **`src/ui/Sheet.tsx` no tenía ningún manejo de teclado en Android.** La línea era
   `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` — en Android el
   `KeyboardAvoidingView` quedaba sin `behavior`, es decir, sin hacer nada. Las hojas con
   formulario (`AddDebtSheet` — fiar —, `RegisterPaymentSheet` — registrar pago —) nunca
   evitaban el teclado en Android.
2. **`src/ui/Screen.tsx` y `src/features/auth/screens/LoginScreen.tsx` usaban
   `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`.** El `'height'` de React
   Native en Android es conocido por ser poco fiable cuando `edgeToEdgeEnabled: true` está
   activo (`app.json`, obligatorio desde Android 15): al dibujar detrás de las barras del
   sistema, la altura del teclado que reporta React Native varía según el dispositivo y la
   versión de Android, lo que explica el "a veces sí, a veces no" reportado en login
   (`RegisterScreen`, `AddDebtorScreen`, `EditDebtorScreen`, etc. comparten `Screen`, así
   que sufrían lo mismo).

## Qué se cambió

| Archivo | Cambio |
| --- | --- |
| `package.json` / `package-lock.json` | Nueva dependencia `react-native-keyboard-controller@1.18.5`, instalada con `npx expo install` (no a mano) |
| `app/_layout.tsx` | `KeyboardProvider` envolviendo la app, con `statusBarTranslucent`, `navigationBarTranslucent` y `preserveEdgeToEdge` en `true` (coherente con el `edgeToEdgeEnabled` del proyecto) |
| `src/ui/Screen.tsx` | `KeyboardAvoidingView` de la librería en vez del nativo; `behavior="padding"` en las dos plataformas, sin ramificar por `Platform.OS` |
| `src/ui/Sheet.tsx` | Mismo cambio; corrige el caso de Android sin ningún `behavior` |
| `src/features/auth/screens/LoginScreen.tsx` | Mismo cambio (tiene su propio `KeyboardAvoidingView` porque el héroe va detrás de la hoja) |

## Decisiones y por qué

- **Se evaluaron dos caminos con el usuario:** ajustar solo configuración (sin nueva
  dependencia) o adoptar `react-native-keyboard-controller`. Se explicó el trade-off y el
  usuario eligió la librería. Es la solución estándar de la comunidad React Native para
  este problema exacto — depende de `react-native-is-edge-to-edge` para leer la altura real
  del teclado en vez de estimarla, que es justo lo que falla con `edgeToEdgeEnabled`.
- **No requiere config plugin de Expo.** Enlaza de forma nativa estándar (autolinking); no
  hay que tocar `app.json > plugins`.
- **`behavior="padding"` en ambas plataformas.** Con esta librería ya no hace falta el
  `Platform.OS === 'ios' ? 'padding' : 'height'` de antes: el comportamiento es confiable en
  las dos, así que se simplificó el código en los tres archivos.
- **`preserveEdgeToEdge` en el provider.** Sin él, la librería puede desactivar el
  edge-to-edge de Android mientras anima el teclado y volver a activarlo después, lo que
  con `edgeToEdgeEnabled: true` ya fijo en `app.json` podía causar un parpadeo de las barras
  del sistema.

## Verificado

`npm run typecheck` en 0, `npm run lint` en 0, `npx expo export --platform android --platform
ios` compila los dos bundles sin errores, `npx expo prebuild -p android` regenera `android/`
sin errores (enlaza el módulo nativo por autolinking estándar de React Native, sin plugin de
Expo). `npx expo-doctor` se mantiene en **17/18**, el mismo aviso preexistente de deriva de
parche en `expo-router`/`expo-splash-screen`/`expo-status-bar` — no se introdujo ningún
check nuevo en rojo. Los pines de `expo`/`react`/`react-native` y el bloque `overrides`
quedaron intactos.

## No verificado

**No se probó en un dispositivo real ni emulador, en ninguna de las dos plataformas.** Este
entorno de trabajo no tiene SDK de Android ni Xcode instalados (no hay `adb` ni
`xcodebuild`), así que no se pudo levantar la app ni confirmar visualmente que el teclado ya
no tapa los inputs. Falta:

- Probar en Android físico: registro, login, crear cliente, editar cliente, editar perfil,
  cambiar contraseña, y las hojas de fiar/registrar pago — tocando el campo más cercano al
  final de la pantalla, que es donde se reportó el problema.
- Probar lo mismo en iPhone (el `behavior="padding"` ya funcionaba ahí con el
  `KeyboardAvoidingView` nativo, pero ahora corre a través de la librería nueva y conviene
  confirmar que no cambió nada visualmente).
- Compilar un build real (`npm run prebuild:android` + `npm run android`, o un APK de EAS
  con `npm run build:android`) — `expo prebuild` sin Android SDK no ejercita Gradle ni
  confirma que el módulo nativo compila.
- iOS no se pudo ni prebuildear en este entorno (Linux): la Fase 8 ya documenta que
  `prebuild:ios` es solo macOS.

## Lo que sigue

1. Ejecutar `npm run prebuild:android && npm run android` en una máquina con Android SDK
   (o generar un APK de EAS con `npm run build:android`) y probar los formularios listados
   arriba en un dispositivo o emulador real.
2. En Mac, `npm run prebuild:ios && npm run ios` y repetir la misma prueba.
3. Si algo se ve distinto a lo esperado, revisar primero `behavior` (hay también
   `'height'` y `'translate-with-padding'` disponibles en la librería) antes de volver al
   `KeyboardAvoidingView` nativo.
