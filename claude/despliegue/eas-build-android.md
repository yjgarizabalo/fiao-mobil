# EAS Build para Android

Referencia de cómo está configurado el build en la nube y cómo se usa. Las reglas
resumidas están en la **Fase 11 de [CLAUDE.md](../../CLAUDE.md)**; aquí está el detalle.

---

## Por qué EAS y no `npm run android`

`npm run android` compila en tu máquina y produce un build de desarrollo atado a ella.
EAS compila en los servidores de Expo y devuelve un **artefacto instalable con un link**,
que es lo que hace falta para ponerle la app en la mano a alguien. De paso resuelve el
build de iOS desde Windows: EAS pone el Mac.

Encaja con la CNG de la Fase 8 — EAS corre `expo prebuild` en el servidor a partir de
`app.json`, así que `android/` e `ios/` siguen fuera del repositorio.

---

## Preparación, una sola vez

```bash
npm install -g eas-cli
eas login      # la cuenta de expo.dev ES la cuenta de EAS: mismo usuario, mismo login
eas init       # vincula el proyecto y escribe extra.eas.projectId en app.json
```

`eas init` es el único paso que modifica `app.json`. Ese cambio **se commitea**: es lo que
identifica el proyecto ante EAS.

`eas-cli` va **global a propósito**. La Fase 0 congela las versiones del proyecto, y un
CLI de build no tiene por qué entrar en `package.json` ni tocar el `package-lock.json`.

---

## Los perfiles

| Perfil        | Android            | Distribución | Para qué                                    |
| ------------- | ------------------ | ------------ | ------------------------------------------- |
| `development` | APK debug          | interna      | Development client con Metro local          |
| `preview`     | **APK**            | interna      | **Demostración**: se instala desde un link  |
| `production`  | AAB (`app-bundle`) | tienda       | Subir a Google Play                         |

La diferencia que importa: un **APK** se instala directo desde el link; un **AAB** no se
puede instalar a mano, solo subir a Play. Para enseñarle la app a alguien, siempre
`preview`.

`development` necesita además `npx expo install expo-dev-client`, que hoy **no** está
instalado.

---

## Las variables de entorno ⚠️

**El `.env` no viaja a EAS.** Está en `.gitignore`, y EAS sube al servidor solo lo que git
conoce. Un build que dependa del `.env` local sale con la URL del API vacía y la app falla
en cuanto alguien intenta entrar.

Por eso las `EXPO_PUBLIC_*` están declaradas en el bloque `env` de cada perfil de
`eas.json`. Siguen sin poder contener secretos: `EXPO_PUBLIC_` significa que el valor
queda escrito dentro del bundle y se lee descompilando el APK.

**Si agregas o cambias una variable en `.env`, agrégala también en `eas.json`**, en
`preview` y en `production`. El `.env` es para `npm start`; `eas.json` es para la nube.

El perfil `development` es la excepción y no declara `env`: ese build carga el JavaScript
desde tu Metro local, así que aplica tu `.env` de la máquina en tiempo real.

---

## Compilar

```bash
npm run build:android        # APK de demostración (preview)
npm run build:android:prod   # AAB para Google Play (production)
npm run build:android:dev    # APK con development client
npm run build:ios            # IPA (preview) — compila en la nube, sin Mac
npm run builds               # últimos 10 builds, su estado y su link
```

La primera vez EAS pregunta por el **keystore**: deja que lo genere y lo guarde él
(`Generate new keystore`). Es la firma de la app — si se pierde, Google Play deja de
aceptar actualizaciones de `com.yair77.fiao`. Queda en tu cuenta de Expo y se consulta con
`eas credentials`.

Al terminar, EAS devuelve un link con QR. Quien lo abra en el celular descarga el APK, y
Android le pedirá permitir **«instalar apps de origen desconocido»**: es normal fuera de
Play y conviene avisarlo antes de la demo, porque asusta.

---

## Versionado

`eas.json` declara `appVersionSource: "remote"`: **EAS lleva la cuenta** del `versionCode`
de Android y del `buildNumber` de iOS, y el perfil `production` los incrementa solo
(`autoIncrement: true`). No los edites a mano en `app.json`.

Lo que sí se edita a mano es `expo.version` (`1.0.0`), que es la versión que ve el usuario.

---

## Pendientes conocidos

- **No hay backend público.** Los perfiles llevan el placeholder
  `https://REEMPLAZAR-CON-TU-API-PUBLICA/api`. El APK compila, pero no conecta hasta que
  se reemplace. Mientras tanto, ver
  [probar-con-backend-local.md](probar-con-backend-local.md).
- **El API debe ser HTTPS.** Android bloquea HTTP plano en builds de release.
- **EAS Update no está configurado** (no hay `expo-updates` ni canales): cada cambio exige
  recompilar, no hay actualizaciones por aire.
- **EAS Submit** tiene el bloque `production` vacío: falta la cuenta de servicio de Google
  Play para subir con `eas submit`.
- **iOS** compila desde Windows, pero exige cuenta de **Apple Developer de pago**
  (99 USD/año) y, para repartir la demo, registrar los UDID de los dispositivos
  (`eas device:create`) o pasar por TestFlight. Android no tiene ese requisito, por eso va
  primero.
