# CLAUDE.m

App móvil (Android + iPhone) para que tenderos lleven el control de los **vales / fiado**:
clientes que compran a crédito, deudas que se acumulan y pagos que abonan ese saldo.

Este proyecto es la **refactorización del v1** (`../fiao-mobil`), con el mismo backend y las
mismas funcionalidades, pero con arquitectura por capas, design system propio y las versiones
de React/Expo congeladas. El detalle de qué cambió y por qué está en
`claude/migraciones/v1-a-v2-arquitectura.md`.

> **Dónde va cada documento.** Este archivo son las **reglas**: lo que hay que cumplir en
> cada cambio. El **porqué** —migraciones, refactorizaciones, despliegue y la bitácora de
> cada sesión— vive en la carpeta [`claude/`](claude/README.md), con su propio índice.
> Un documento nuevo de contexto va ahí, no suelto en la raíz.

> **Documento organizado en fases.** Léelas en orden la primera vez; después ve a la que
> corresponda. Las **Fases 0 y 8** son de cumplimiento obligatorio en todo cambio.

---

## FASE 0 — Reglas no negociables

### 0.1 Las versiones están CONGELADAS 🔒

El trío que define la compatibilidad de dispositivos está **fijado a versión exacta**, igual
que en el v1, y declarado como intencional en `package.json > expo.install.exclude`:

```
expo          54.0.1
react         19.1.0
react-native  0.81.4
```

`npx expo-doctor` reporta hoy **17/18**: el único check que falla es «packages match versions
required by installed Expo SDK», por deriva de parche en `expo-router`, `expo-splash-screen` y
`expo-status-bar` (el registro avanzó, el proyecto no). Es un aviso, **no** rompe el build ni
EAS. No se arregla solo: subirlos exige autorización y volver a probar en las dos plataformas.

Está **prohibido** sin autorización explícita:

- `npm update`, `npx expo install --fix`, `npm audit fix`, bumps a mano en `package.json`.
- Subir el SDK de Expo o cualquier `expo-*` de forma individual.
- Quitar el bloque `overrides` que fija `react` / `react-dom` en `19.1.0`.
- Quitar `expo.install.exclude`: es lo que le dice a Expo que los pines son deliberados.
- Editar `package-lock.json` a mano.

Para instalar algo nuevo se usa **siempre** `npx expo install <paquete>`, que resuelve la
versión compatible con SDK 54, nunca `npm install <paquete>@latest`.

### 0.2 Android e iPhone son el objetivo

Todo cambio debe funcionar en las dos plataformas. Web existe en la configuración pero es
secundario. Ver **Fase 8**.

### 0.3 Idioma y moneda

- UI **en español** (Colombia). Moneda **COP**, locale `es-CO`.
- Código en inglés (variables, funciones, tipos); comentarios y textos de usuario en español.
- Todo el dinero se formatea con `formatMoney()`; ninguna pantalla llama a `Intl` directamente.

### 0.4 Sin hex, sin números mágicos

Ningún componente escribe un color, un padding, un radio o un tamaño de letra literal.
Todo sale de `@/theme`. Si falta un token, se agrega al tema, no a la pantalla.

---

## FASE 1 — Dominio

```
User (tendero)
 └── Business (negocio)              ← un usuario puede tener varios
      └── Debtor (cliente que fía)   ← en el API es "debtor", en la UI "cliente"
           └── Debt (deuda / vale)
                └── Payment (pago / abono)
```

Todo vive en `src/domain/`:

| Archivo        | Contenido                                                                               |
| -------------- | --------------------------------------------------------------------------------------- |
| `constants.ts` | `DocumentType`, `PaymentMethod`, `DebtStatus`, `TransactionType` + etiquetas en español |
| `models.ts`    | Entidades (`User`, `Business`, `Debtor`, `Debt`, `Payment`) y funciones de dominio      |
| `mappers.ts`   | Traducción de las respuestas del backend a los modelos                                  |

Funciones de dominio que hay que usar en vez de recalcular en la pantalla:

- `displayName(user)` — nombre a mostrar con degradación si faltan campos.
- `debtorBalance(debtor)` — saldo del negocio, con el consolidado como respaldo.
- `summarizeDebts(debts, serverBalance)` — total fiado, total pagado, saldo, deudas
  abiertas/pagadas y la vencida más antigua. Prioriza el saldo del servidor.
- `buildMovements(debts)` — extracto unificado de deudas + pagos ordenado por fecha.

**Multi-tenant:** clientes, deudas y pagos pertenecen a un negocio y viajan con el header
`x-business-id`. Nunca lo pongas a mano: usa `businessHeader(businessId)` de
`@/core/http/client`.

**Dos formas de pagar** (las dos se conservan del v1):

1. `POST /payments` — abono a **una** deuda concreta (`paymentApi.create`).
2. `POST /payments/global` — abono al **saldo total**; el backend reparte entre las deudas
   abiertas y devuelve `group.totalAmount` (`paymentApi.createGlobal`). **Es la que usa la
   pantalla de detalle**, igual que en el v1.

---

## FASE 2 — Arquitectura y estructura

Tres capas, con dependencias en una sola dirección: `app/` → `features/` → `domain/` → `core/`.
Nunca al revés (una feature no importa de otra feature; comparten a través de `domain` o `ui`).

```
fiao-mobil-v2/
├── app/                      # SOLO declaraciones de ruta (expo-router)
├── src/
│   ├── core/                 # infraestructura, sin nada de negocio
│   │   ├── config/env.ts     # variables de entorno validadas
│   │   ├── errors/           # AppError: un solo modelo de error
│   │   ├── http/             # cliente axios, refresh, normalización de payloads
│   │   ├── hooks/            # useForm, useAsyncData, usePagedList, useDebouncedValue
│   │   ├── navigation/       # routes.ts — todas las rutas en un sitio
│   │   ├── storage/          # AsyncStorage tipado
│   │   ├── logger/           # logs con niveles y redacción de tokens
│   │   ├── haptics.ts
│   │   └── utils/            # format.ts, validation.ts
│   ├── domain/               # entidades, constantes y mappers
│   ├── theme/                # tokens.ts (escala cruda) + index.ts (roles)
│   ├── ui/                   # design system (24 componentes)
│   └── features/             # una carpeta por área de negocio
│       ├── auth/             # api · session · screens
│       ├── businesses/       # api · state · components · screens
│       ├── debtors/          # api · components · screens
│       ├── debts/            # api · components
│       ├── payments/         # api · components
│       ├── home/             # screens
│       └── profile/          # screens
├── scripts/use-env.js        # cambio de entorno multiplataforma
└── assets/
```

Dentro de una feature el patrón es siempre el mismo: `api/` (peticiones), `model/` si hace
falta, `components/` (piezas de esa feature), `screens/` (pantallas), `state/` solo si el
estado debe ser global.

### Alias de imports

```
@/*      → ./src/*
@app/*   → ./app/*
```

Se importa **siempre** por alias, nunca con `../../..`. El design system se importa desde
el barril: `import { Button, Screen, Text } from '@/ui'`.

### Los archivos de `app/` son de una línea

```tsx
/** Ruta `/clients` — pestaña de clientes. */
export { DebtorListScreen as default } from "@/features/debtors/screens/DebtorListScreen";
```

Así la pantalla se puede mover, reutilizar o probar sin pelear con el enrutador.

---

## FASE 3 — Navegación

| URL                  | Archivo                           | Pantalla                                             |
| -------------------- | --------------------------------- | ---------------------------------------------------- |
| `/`                  | `app/index.tsx`                   | Puerta de entrada: splash + redirección según sesión |
| `/login`             | `app/(auth)/login.tsx`            | Login (correo **o** documento)                       |
| `/register`          | `app/(auth)/register.tsx`         | Registro                                             |
| `/home`              | `app/(app)/(tabs)/home.tsx`       | Inicio: total por cobrar y quién debe                |
| `/clients`           | `app/(app)/(tabs)/clients.tsx`    | Lista de clientes                                    |
| `/businesses`        | `app/(app)/(tabs)/businesses.tsx` | Lista de negocios                                    |
| `/profile`           | `app/(app)/(tabs)/profile.tsx`    | Perfil y ajustes                                     |
| `/client/[id]`       | `app/(app)/client/[id].tsx`       | **Detalle del cliente** (pantalla núcleo)            |
| `/client/new`        | `app/(app)/client/new.tsx`        | Registrar cliente                                    |
| `/business/new`      | `app/(app)/business/new.tsx`      | Crear negocio                                        |
| `/settings/profile`  | `app/(app)/settings/profile.tsx`  | Editar perfil                                        |
| `/settings/security` | `app/(app)/settings/security.tsx` | Cambiar contraseña                                   |
| —                    | `app/+not-found.tsx`              | Ruta inexistente (deep link roto)                    |

Reglas:

- **Nunca escribas una ruta como string.** Usa `routes` de `@/core/navigation/routes`:
  `router.push(routes.client.detail(id, businessId))`.
- Las subrutas usan **singular** (`/client/new`) y las pestañas **plural** (`/clients`), para
  que jamás coincidan dos archivos en la misma URL.
- Los grupos `(auth)`, `(app)`, `(tabs)` no aparecen en la URL; sirven para colgar layouts.
- `app/(app)/_layout.tsx` es la **guardia de sesión**: sin sesión redirige a `/login`.
  `app/(auth)/_layout.tsx` hace lo contrario. Ninguna pantalla debe comprobar la sesión.
- Los formularios se presentan como `modal` en iOS y `card` en Android (ya configurado).
- La barra de pestañas es propia: `src/ui/TabBar.tsx`.

---

## FASE 4 — Estado

**Dos providers globales**, montados en `app/_layout.tsx`:

| Provider           | Hook              | Para qué                                                                      |
| ------------------ | ----------------- | ----------------------------------------------------------------------------- |
| `SessionProvider`  | `useSession()`    | `status`, `user`, `login`, `register`, `logout`, `patchUser`                  |
| `BusinessProvider` | `useBusinesses()` | negocios, **negocio activo** (persistido), `selectBusiness`, `createBusiness` |

Todo lo demás **no** es estado global: clientes, deudas y pagos los carga cada pantalla con
los hooks del núcleo. Si necesitas datos en una pantalla nueva, el orden de preferencia es:

1. `useAsyncData(fetcher, { enabled, deps })` — un recurso: da `data`, `status`, `error`,
   `isLoading`, `isRefreshing`, `reload`, `refresh`, `setData`. Cancela resultados obsoletos.
2. `usePagedList(fetchPage, { pageSize, enabled, deps })` — listas con scroll infinito:
   `items`, `isLoading`, `isRefreshing`, `isLoadingMore`, `hasMore`, `loadMore`, `refresh`.
   Deduplica por `id` al concatenar páginas.
3. Un provider nuevo **solo** si el dato lo necesitan varias ramas del árbol a la vez.

`useSession().status` es `'loading' | 'authenticated' | 'unauthenticated'`. **Nunca** deduzcas
la sesión de otra cosa.

---

## FASE 5 — Datos y backend

### Entorno

Variables en `.env` (plantilla en `.env.example`), leídas y validadas **una vez** en
`src/core/config/env.ts`. Nunca uses `process.env` fuera de ese archivo.

| Variable                      | Uso                                                   |
| ----------------------------- | ----------------------------------------------------- |
| `EXPO_PUBLIC_ENVIRONMENT`     | `local` \| `dev` \| `prd` — controla el nivel de logs |
| `EXPO_PUBLIC_API_BASE_URL`    | Base del API incluyendo `/api`                        |
| `EXPO_PUBLIC_API_AUTH_PREFIX` | Prefijo de auth (default `/auth`)                     |
| `EXPO_PUBLIC_API_TIMEOUT_MS`  | Timeout HTTP (default 20000)                          |

Cambio de entorno: `npm run env:local` / `env:dev` / `env:prd` (script Node, funciona en
Windows **y** macOS, necesario porque el build de iOS se hace en Mac).

⚠️ En desarrollo la URL debe ser la **IP LAN** de tu máquina, no `localhost`: un celular
físico o el simulador de iOS no alcanzan el localhost del PC. `env.ts` te avisa si lo detecta.
Todo lo que empiece por `EXPO_PUBLIC_` **viaja en el bundle**: nunca metas secretos.

### Cliente HTTP

Un solo cliente: `http` en `src/core/http/client.ts` (axios). Hace:

- adjunta el `Bearer` leyéndolo **de memoria** (`tokenStore`), no de AsyncStorage por request;
- renueva la sesión en un 401 con patrón **single-flight** (una sola renovación compartida)
  y reintenta la petición original;
- si el refresh falla, limpia credenciales y avisa por `onSessionExpired`, que el
  `SessionProvider` escucha para volver al login;
- convierte **todo** error a `AppError` antes de propagarlo;
- registra con el logger, que **redacta** tokens y contraseñas.

Helpers: `businessHeader(businessId)` y `skipAuthRefresh` (para login/logout/registro, donde
un 401 no es una sesión vencida).

Normalización de respuestas (`src/core/http/payload.ts`) — el backend responde a veces
`{ data, meta }` y a veces el recurso pelado:

```ts
toList<T>(payload); // → T[], nunca undefined
toPage<T>(payload, page, limit); // → { items, meta } con meta completa
toItem<T>(payload); // → T | null
toAmount(value); // "15000.00" → 15000
```

### Errores

**Un** modelo: `AppError` con `code` cerrado (`NETWORK`, `TIMEOUT`, `UNAUTHORIZED`,
`FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION`, `SERVER`, `CANCELLED`, `UNKNOWN`),
`title` y `message` **ya escritos para el usuario**, más `fieldErrors` cuando el backend
dice qué campo falló. En un `catch`:

```ts
catch (caught) {
  const error = toAppError(caught);
  if (error.fieldErrors) { form.setFieldErrors(error.fieldErrors); return; }
  dialog.showError(error);   // título y mensaje ya resueltos
}
```

Nunca escribas un `switch` sobre códigos de error en una pantalla, y nunca dejes un error
solo en consola: si el usuario pidió algo y falla, el usuario debe verlo.

### Endpoints

| Método | Endpoint              | `x-business-id` | Módulo                                            |
| ------ | --------------------- | --------------- | ------------------------------------------------- |
| POST   | `/auth/login`         | —               | `authApi.login`                                   |
| POST   | `/auth/logout`        | —               | `authApi.logout` (header `x-refresh-token`)       |
| POST   | `/auth/refresh`       | —               | interceptor de `client.ts`                        |
| POST   | `/users`              | —               | `authApi.register`                                |
| PATCH  | `/users/:id`          | —               | `authApi.updateProfile` / `updatePassword`        |
| GET    | `/business`           | —               | `businessApi.list`                                |
| POST   | `/business`           | —               | `businessApi.create`                              |
| GET    | `/debtors`            | ✅              | `debtorApi.listByBusiness`                        |
| GET    | `/debtors/me/all`     | —               | `debtorApi.listAll`                               |
| GET    | `/debtors/:id`        | ✅              | `debtorApi.getById`                               |
| POST   | `/debtors`            | ✅              | `debtorApi.create`                                |
| GET    | `/debtors/:id/debts`  | ✅              | `debtApi.listByDebtor` (trae los pagos embebidos) |
| POST   | `/debts`              | ✅              | `debtApi.create`                                  |
| GET    | `/debts/:id/payments` | ✅              | `paymentApi.listByDebt`                           |
| POST   | `/payments`           | ✅              | `paymentApi.create`                               |
| POST   | `/payments/global`    | ✅              | `paymentApi.createGlobal`                         |

Llaves de AsyncStorage (contrato, compatible con el v1): `auth_token`, `refresh_token`,
`auth_user`, más `active_business_id`. Se acceden **solo** por `StorageKeys`.

---

## FASE 6 — Design system

Los tokens están en `src/theme/tokens.ts` (escala cruda: `brand[500]`, `ink[800]`) y los
**roles** en `src/theme/index.ts` (`text`, `textMuted`, `border`, `danger`, `brand`…).
Los componentes consumen **roles**, nunca la escala. Cuando se agregue modo oscuro, basta
cambiar lo que devuelve `useTheme()`.

Identidad visual: base de neutros fríos (`ink`) con verde marca `#00B26B` para dinero y
acciones primarias, rojo `#E14848` para deuda, ámbar para vencimientos. Los héroes usan el
degradado `theme.gradient.hero`.

### Componentes (`import { … } from '@/ui'`)

| Grupo         | Componentes                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Estructura    | `Screen`, `AppBar`, `TabBar`, `Card`, `Divider`, `Spacer`, `SectionHeader`                                |
| Texto         | `Text` (variantes de la escala), `AnimatedMoney` (cifra que cuenta)                                       |
| Acción        | `Button`, `IconButton`, `Fab`, `PressableScale`                                                           |
| Formulario    | `TextField`, `MoneyField`, `OptionPicker`, `SearchBar`, `SegmentedControl`                                |
| Datos         | `Avatar`, `Badge`, `ListRow`, `StatTile`, `IconBubble`                                                    |
| Superposición | `Sheet` (bottom sheet con gesto), `Dialog` + `useDialog`, `ToastProvider` + `useToast`                    |
| Estados       | `Skeleton`, `RowSkeleton`, `ListSkeleton`, `CardSkeleton`, `EmptyState`, `ErrorState`, `ListFooterLoader` |

Reglas de uso:

- Toda pantalla se envuelve en `<Screen>`. Nada de `SafeAreaView` a mano ni de calcular
  insets: `Screen` y `AppBar` ya los aplican.
- Formulario → `<Screen scroll padded keyboardAware footer={<Button …/>}>`.
- Zona táctil presionable → `PressableScale` (animación + vibración uniformes).
- Aviso sin decisión → `useToast()`. Aviso **con** decisión o error → `useDialog()`.
  Nunca `Alert.alert`.
- Lista → `FlatList` con `RowSkeleton` mientras carga y `EmptyState` / `ErrorState` según
  el caso. Nunca `ScrollView` + `.map()` para datos del servidor.
- Formularios → `useForm` de `@/core/hooks/useForm` con validadores de
  `@/core/utils/validation`. No hay react-hook-form ni zod; no los introduzcas.

### Movimiento y vibración

Animaciones con **Reanimated 4** (hilo de UI). Duraciones y springs vienen de
`theme.duration` y `theme.spring`. Vibración con `haptics` de `@/core/haptics`:
`select` (tocar), `tap` (abrir), `press` (acción primaria), `success`, `warning`, `error`.
Es un no-op en web y nunca lanza.

---

## FASE 7 — Convenciones de código

- **TypeScript `strict`** + `noUncheckedIndexedAccess`: acceder a `array[i]` da
  `T | undefined` y hay que manejarlo. Es a propósito.
- Componentes: `export const NombreScreen = () => …` (nombrados). El `default` solo existe
  en los archivos de `app/`.
- Props tipadas con una `interface` exportada (`export interface ButtonProps`).
- Nombres en inglés; comentarios y textos en español.
- Comentario de cabecera en cada archivo explicando **qué hace y por qué es así**.
  Los comentarios explican decisiones, no repiten el código.
- Secciones dentro de un archivo: `/* ── Título ─────── */`.
- Estilos siempre en `StyleSheet.create` al final del archivo, con tokens del tema.
- `console.log` está prohibido por lint: usa `createLogger('scope')`.
- Commits: prefijo `[fiao]` + mensaje corto en minúsculas.
- **No hay tests configurados.** La verificación es `npm run typecheck` + `npm run lint` +
  `npx expo export` + prueba manual. No afirmes que "los tests pasan".

---

## FASE 8 — Android + iOS (obligatorio en todo cambio)

### Proyectos nativos

Este proyecto usa **Continuous Native Generation**: `android/` e `ios/` **no** están en el
repo (a diferencia del v1, que tenía `android/` commiteado) y se generan con

```bash
npm run prebuild:android      # o: npx expo prebuild -p android
npm run prebuild:ios          # SOLO macOS
```

Ventaja: cambiar `app.json` (un plugin, un permiso, un icono) se refleja al regenerar, sin
editar Gradle a mano ni resolver conflictos en archivos nativos.

- `app.json`: `newArchEnabled: true`, `edgeToEdgeEnabled: true` (Android),
  `supportsTablet: true` (iOS), `orientation: portrait`, bundle/package `com.yair77.fiao`.
- **EAS Build ya está configurado** (`eas.json` con los perfiles `development`, `preview` y
  `production`). Es lo que permite compilar el APK de demostración, y compilar iOS desde
  Windows sin tener un Mac. El detalle está en la **Fase 11**.

### Reglas de paridad

1. **Áreas seguras**: nunca calcules insets a mano. `Screen` y `AppBar` usan
   `useSafeAreaInsets()`, y `Screen`/`Fab`/`TabBar` aplican el inset **inferior** (barra de
   gestos). Esto corrige el `44` fijo del v1, que se quedaba corto en iPhone con notch.
2. **Teclado**: `<Screen keyboardAware>` en formularios. `Sheet` ya lo trae.
3. **Sombras**: usa `theme.shadow.*`, que declara `shadow*` (iOS) y `elevation` (Android).
4. **Gestos dentro de un `Modal`**: en Android hay que re-montar `GestureHandlerRootView`
   dentro del modal. `Sheet` ya lo hace; si creas otra superposición con gestos, cópialo.
5. **Permisos**: si activas cámara, ubicación o notificaciones hay que añadir el config
   plugin y los textos de iOS (`NSCameraUsageDescription`, etc.) en `app.json` y **volver a
   hacer prebuild**.
6. **Push en iOS** requiere build nativo con EAS + APNs; no funciona en Expo Go.
7. **Tema claro fijo** (`userInterfaceStyle: light`). La estructura de roles está lista para
   modo oscuro, pero no está activado: no asumas que funciona.
8. Medidas relativas con `useWindowDimensions()`; nada de anchos de pantalla fijos (iPad).
9. **Prueba en las dos plataformas** antes de cerrar un cambio. Si no puedes probar una,
   **dilo explícitamente**.

---

## FASE 9 — Comandos

```bash
npm install              # instala exactamente lo del package-lock
npm start                # expo start
npm run start:clear      # expo start --clear (tras cambiar .env o alias)
npm run android          # build nativo Android (requiere Android SDK)
npm run ios              # build nativo iOS (SOLO macOS)
npm run typecheck        # tsc --noEmit          ← debe quedar en 0
npm run lint             # expo lint             ← debe quedar en 0
npm run env:dev          # activa .env.dev
npx expo export --platform android --platform ios   # compila los bundles: verificación real
npx expo-doctor          # 17/18: falla solo el check de versiones (ver Fase 0.1)

# EAS Build (requiere `npm install -g eas-cli` y `eas login`)
npm run build:android        # APK de demostración (perfil preview)
npm run build:android:prod   # AAB para Google Play (perfil production)
npm run build:android:dev    # APK con development client (perfil development)
npm run build:ios            # IPA (perfil preview) — compila en la nube, no hace falta Mac
npm run builds               # últimos 10 builds y su estado
```

---

## FASE 10 — Checklist antes de dar un cambio por terminado

- [ ] `npm run typecheck` en 0 errores.
- [ ] `npm run lint` en 0 problemas.
- [ ] ¿Funciona en **Android y iOS**? (insets, teclado, sombras, gestos en modales)
- [ ] ¿Textos en **español** y dinero con `formatMoney`?
- [ ] ¿Cero colores/paddings literales? ¿Todo desde `@/theme`?
- [ ] ¿Componentes desde `@/ui` en vez de primitivas sueltas de React Native?
- [ ] ¿Rutas desde `routes` en vez de strings?
- [ ] ¿La petición va por `http` de `@/core/http/client` y con `businessHeader` si toca
      clientes, deudas o pagos?
- [ ] ¿La respuesta pasa por un mapper de `@/domain/mappers`?
- [ ] ¿Los errores llegan al usuario (`useDialog` / `useToast`), no solo a la consola?
- [ ] ¿Hay estado de carga (skeleton), vacío y error?
- [ ] ¿Las versiones siguen intactas? (`dependencies` de `package.json` y `package-lock.json`
      sin tocar)
- [ ] Si el cambio toca `app.json`, `eas.json` o una variable `EXPO_PUBLIC_*`:
      ¿se actualizó también el bloque `env` del perfil correspondiente en `eas.json`?
      (el `.env` local **no** viaja a EAS — ver Fase 11)
- [ ] ¿Se dijo con claridad qué se probó y qué no?

---

## FASE 11 — Despliegue con EAS Build

Compilar en la nube de Expo en vez de en la máquina. Resuelve dos cosas que este proyecto
necesita: entregarle un **APK instalable** a un cliente sin pasar por Google Play, y compilar
**iOS desde Windows** (EAS tiene los Mac; aquí no hay ninguno).

Encaja con la CNG de la Fase 8: EAS corre `expo prebuild` en el servidor a partir de
`app.json`, así que `android/` e `ios/` siguen sin estar en el repo.

El detalle completo está en [`claude/despliegue/`](claude/despliegue/eas-build-android.md);
esta fase es el resumen operativo.

### 11.1 La regla que rompe todo si se olvida ⚠️

**El `.env` no viaja a EAS.** Está en `.gitignore`, y EAS Build sube al servidor solo lo que
git conoce. Un build que dependa del `.env` local sale con la URL del API vacía y la app
falla en cuanto el usuario intenta entrar.

Por eso las variables `EXPO_PUBLIC_*` están declaradas **dentro de `eas.json`**, en el bloque
`env` de cada perfil. Son las mismas que documenta la Fase 5 y siguen sin poder contener
secretos: `EXPO_PUBLIC_` significa que el valor queda escrito dentro del bundle y cualquiera
puede leerlo descompilando el APK.

Si agregas o cambias una variable en `.env`, **agrégala también en `eas.json`** en los
perfiles `preview` y `production`. El `.env` sirve para `npm start`; `eas.json` para los
builds de la nube.

El perfil `development` es la excepción y no declara `env`: ese build carga el JavaScript
desde tu Metro local, así que aplica tu `.env` de la máquina en tiempo real.

### 11.2 Requisitos, una sola vez

```bash
npm install -g eas-cli        # el CLI es global a propósito: no toca las versiones del proyecto
eas login                     # tu cuenta de expo.dev ES tu cuenta de EAS, es el mismo login
eas init                      # vincula el repo y escribe extra.eas.projectId en app.json
```

`eas init` es el único paso que modifica `app.json`: le añade el `projectId`. Ese cambio
**sí se commitea**, porque identifica el proyecto ante EAS.

`eas-cli` se instala global y **no** se agrega a `dependencies`: la Fase 0 congela las
versiones del proyecto y un CLI de build no tiene por qué entrar en ese contrato.

### 11.3 Los perfiles de `eas.json`

| Perfil        | Artefacto Android   | Para qué                                                    |
| ------------- | ------------------- | ----------------------------------------------------------- |
| `development` | APK (debug)         | Development client: probar en dispositivo con Metro local   |
| `preview`     | **APK**             | **Demostración a clientes**: se instala desde un link       |
| `production`  | AAB (`app-bundle`)  | Subir a Google Play (Play solo acepta AAB)                  |

`preview` y `production` usan `distribution: internal` / tienda respectivamente. Un **APK** se
instala directo desde el link que devuelve EAS; un **AAB** no se puede instalar a mano, solo
subir a Play. Para mostrarle la app a alguien, siempre `preview`.

`development` requiere además `npx expo install expo-dev-client`, que hoy **no** está
instalado: ese perfil no funcionará hasta que se agregue.

### 11.4 Compilar el APK de demostración (Android)

```bash
npm run build:android        # eas build --platform android --profile preview
```

EAS pregunta por el **keystore** la primera vez; deja que lo genere y lo guarde él
(`Generate new keystore`). Es la firma de la app: si se pierde, Google Play ya no acepta
actualizaciones de ese paquete. Queda en la cuenta de Expo y se recupera con
`eas credentials`.

Al terminar, EAS devuelve un link y un QR. El cliente abre el link en el celular, descarga el
APK y Android le pedirá permitir «instalar apps de origen desconocido» — es normal fuera de
Play y conviene avisarlo antes de la demostración.

`npm run builds` lista los últimos builds con su estado y su link, por si se cerró la terminal.

### 11.5 Versión y `versionCode`

`eas.json` declara `appVersionSource: "remote"`: **EAS lleva la cuenta** del `versionCode` de
Android y del `buildNumber` de iOS, y el perfil `production` los incrementa solo
(`autoIncrement: true`). No los edites a mano en `app.json`.

Lo que sí se edita a mano es `expo.version` de `app.json` (`1.0.0`), que es la versión que ve
el usuario. Súbela cuando el cambio lo amerite.

### 11.6 Pendientes conocidos

- **No hay backend público.** `eas.json` lleva el placeholder
  `https://REEMPLAZAR-CON-TU-API-PUBLICA/api`. Hasta que el API de `../fiao-backend` esté
  desplegado con HTTPS, el APK compila pero **no conecta**. Mientras tanto se puede probar
  contra el backend local a través de un túnel HTTPS: ver
  [`claude/despliegue/probar-con-backend-local.md`](claude/despliegue/probar-con-backend-local.md).
- **HTTPS obligatorio.** Android bloquea el tráfico HTTP plano desde Android 9. Si el API
  quedara en `http://`, hay que instalar `expo-build-properties` y habilitar
  `usesCleartextTraffic` en `app.json` — mejor desplegar con HTTPS que abrir ese agujero.
- **EAS Update no está configurado** (no hay `expo-updates` ni canales). Cada cambio exige
  recompilar; no hay actualizaciones por aire.
- **EAS Submit** tiene el bloque `production` vacío: falta la cuenta de servicio de Google
  Play para poder subir con `eas submit`.
- **iOS**: `npm run build:ios` funciona desde Windows, pero exige una cuenta de **Apple
  Developer de pago** (99 USD/año) y, para repartir la demo, registrar los UDID de los
  dispositivos (`eas device:create`) o pasar por TestFlight. Android no tiene ese requisito,
  por eso va primero.
