# 2026-09-17 — Configuración de EAS Build para Android

**Objetivo:** poder entregarle un APK instalable a un cliente para mostrarle la app, sin
pasar por Google Play.

**Rama:** `refactor/v2-arquitectura`

---

## Qué se encontró

- `eas.json` existía y estaba commiteado, pero **vacío (0 bytes)**. Por eso cualquier
  comando de EAS fallaba.
- `eas-cli` no estaba instalado y `npx expo whoami` respondía `Not logged in`.
- **El hallazgo que importaba:** `.env` está en `.gitignore`, y EAS Build sube al servidor
  únicamente lo que git conoce. Cualquier build habría salido sin
  `EXPO_PUBLIC_API_BASE_URL` y la app habría fallado al primer login. Además apuntaba a
  `http://192.168.1.12:3000/api` — la IP LAN de la máquina de desarrollo.
- `fiao-backend` solo tiene `.env.local`, con Postgres local: **no hay API desplegado**.
- `app.json` declaraba `userInterfaceStyle: "automatic"` mientras `CLAUDE.md` afirmaba
  tema claro fijo. El design system no tiene modo oscuro, así que `automatic` era un bug
  latente: el sistema en oscuro contra una app que solo sabe pintarse en claro.
- `npx expo-doctor` reportaba **17/18**, no 18/18 como decía la documentación.

## Qué se cambió

| Archivo | Cambio |
| --- | --- |
| `eas.json` | Perfiles `development`, `preview` (APK) y `production` (AAB); `appVersionSource: remote`; las `EXPO_PUBLIC_*` dentro del bloque `env` de cada perfil |
| `package.json` | Cinco scripts de build. **Sin tocar `dependencies` ni `package-lock.json`** |
| `app.json` | `userInterfaceStyle`: `automatic` → `light` |
| `CLAUDE.md` | Fase 11 nueva (despliegue); Fase 8, comandos y checklist actualizados; estado real de `expo-doctor` |
| `README.md` | Sección de cómo compartir la app |

## Decisiones y por qué

- **`eas-cli` global, no como dependencia.** La Fase 0 congela las versiones del proyecto.
  Un CLI de build no pertenece a ese contrato y habría movido el `package-lock.json`.
- **Placeholder en vez de una URL inventada.** Sin backend público, poner cualquier cosa
  habría escondido el bloqueante. `https://REEMPLAZAR-CON-TU-API-PUBLICA/api` falla de
  forma evidente.
- **`preview` genera APK y `production` AAB.** Google Play solo acepta AAB, pero un AAB no
  se puede instalar a mano. Para una demo hace falta APK.
- **`appVersionSource: remote`.** EAS lleva el `versionCode`, que es un contador que no
  puede repetirse ni retroceder en Play. Llevarlo a mano en `app.json` es una fuente
  clásica de builds rechazados.
- **No se corrió `expo install --fix`** para los tres paquetes desfasados. La Fase 0 lo
  prohíbe sin autorización, y son avisos de parche que no rompen el build.

## Verificado

`npm run typecheck` en 0, `npm run lint` en 0, `npx expo config --type public` resuelve
correctamente, `eas.json` es JSON válido, los pines de `expo`/`react`/`react-native`
intactos y `package-lock.json` sin cambios.

## No verificado

**No se ejecutó ningún build en EAS**: requiere el login de la cuenta y la generación
interactiva del keystore. El APK no se probó en un dispositivo.

`npx expo-doctor` queda en **17/18**: falla el check de versiones por deriva de parche en
`expo-router`, `expo-splash-screen` y `expo-status-bar`. Es previo a estos cambios, no
rompe el build ni EAS, y quedó documentado en la Fase 0.1.

## Lo que sigue

1. `npm install -g eas-cli`, `eas login`, `eas init` — y commitear el `projectId`.
2. Mientras no llegue la URL pública del API: túnel HTTPS para probar contra el backend
   local (ver [probar-con-backend-local.md](../despliegue/probar-con-backend-local.md)).
3. Cuando llegue la URL real: reemplazarla en los perfiles `preview` y `production`,
   confirmar que es HTTPS y recompilar.
