# Probar el APK contra el backend local (mientras no hay URL pública)

Cómo enseñarle la app a alguien **hoy**, con `fiao-backend` corriendo en tu PC y sin
esperar a que el API esté desplegado.

La pregunta de fondo es: el celular del que mira la demo, ¿cómo alcanza un servidor que
vive en `localhost:3000` de tu máquina? Hay tres respuestas, y no sirven para lo mismo.

---

## La trampa que hay que conocer primero: HTTP plano

Un APK de **release** (los perfiles `preview` y `production`) **no puede hablar por
`http://`**. Android bloquea el tráfico en claro desde Android 9, y Expo SDK 54 compila
contra un `targetSdk` donde eso está apagado por defecto. Solo el build de **debug**
(perfil `development`) lo permite.

Consecuencia práctica: meter `http://192.168.1.12:3000/api` en el perfil `preview` no
funciona. Las peticiones fallan y en la app se ven como error de red, sin más pistas.

Se puede abrir esa puerta instalando `expo-build-properties` y activando
`usesCleartextTraffic`, pero es debilitar la app entera para salir del paso. La opción B
de abajo evita el problema en vez de rodearlo.

---

## Opción A — Development build + Metro local

El perfil `development` de `eas.json` genera un APK de debug que **no trae el JavaScript
adentro**: lo pide a tu `npm start` por la red. Por eso ese perfil es el único sin bloque
`env` — usa el `.env` de tu máquina en tiempo real, y cambiarlo solo exige reiniciar
Metro, no recompilar.

```bash
npx expo install expo-dev-client   # hoy NO está instalado; sin esto el perfil no sirve
npm run build:android:dev
npm start
```

- **Sirve para:** que tú pruebes en un celular físico y para iterar rápido.
- **No sirve para:** dejarle la app a un cliente. Sin tu Metro encendido, no abre.
- **Requiere:** que el celular esté en tu misma red WiFi, y `EXPO_PUBLIC_API_BASE_URL`
  con tu IP LAN (no `localhost`).

Para esto, `npm start` con **Expo Go** ya hace lo mismo y sin instalar nada: el proyecto
no tiene módulos nativos propios. El development build solo gana si más adelante se
agrega alguno.

---

## Opción B — Túnel HTTPS (la recomendada) ✅

Un túnel le pone a tu backend local una URL pública **con HTTPS**. Con eso el APK de
`preview` funciona **en cualquier celular y en cualquier red**, sin tocar la
configuración nativa ni dejar tu Metro prendido.

Además es el mejor ensayo posible: valida el pipeline completo de EAS, así que cuando
llegue la URL real solo hay que cambiar una línea y recompilar.

### 1. Levanta el backend

```bash
cd ../fiao-backend
npm run start:local        # queda en http://localhost:3000 (usa .env.local)
```

### 2. Abre el túnel

Cualquiera de los tres sirve. Los tres se probaron contra este backend y responden igual:

```bash
# VS Code dev tunnel — el más cómodo si ya trabajas en VS Code
# Panel «Ports» → Forward a Port → 3000 → clic derecho → Port Visibility: Public
# URL tipo: https://xxxxxxxx-3000.use2.devtunnels.ms

# ngrok (ya instalado y autenticado en esta máquina)
ngrok http 3000

# cloudflared (gratis, sin cuenta)
cloudflared tunnel --url http://localhost:3000
```

⚠️ **El dev tunnel de VS Code nace privado.** En privado exige un login de Microsoft y la
app recibe HTML en vez de JSON. Hay que ponerlo en **Public** a mano; si no, la demo falla
con errores de red que no explican nada. Se comprueba en un segundo:

```bash
curl -s -o /dev/null -w "%{http_code}
" https://TU-TUNEL/api/business -A "okhttp/4.9.2"
```

Debe responder **401** (el API diciendo «sin token», que es lo correcto). Si devuelve 200
con HTML, sigue privado.

### 3. Pon esa URL en el perfil `preview` de `eas.json`

```json
"EXPO_PUBLIC_API_BASE_URL": "https://xxxx-yyyy.trycloudflare.com/api"
```

El `/api` del final es obligatorio: es el `setGlobalPrefix('api')` de
`fiao-backend/src/main.ts`.

### 4. Compila y reparte

```bash
npm run build:android
```

### Lo que hay que tener en cuenta

- **La URL cambia cada vez que reinicias el túnel**, y el APK la lleva quemada adentro:
  reiniciar el túnel obliga a recompilar. Para una demo de una tarde no molesta; si va a
  ser algo recurrente, el dev tunnel de VS Code conserva la URL entre reinicios mientras no
  se borre el túnel, y ngrok la conserva con dominio fijo (plan gratuito).
- **El backend tiene que seguir corriendo.** El túnel solo reenvía a `localhost:3000`: si se
  cierra la terminal del `npm run start:local`, la URL sigue existiendo pero ya no responde
  nada.
- **Mientras el túnel esté abierto, tu backend está en internet.** La base es tu Postgres
  local y `main.ts` tiene `enableCors()` sin restricción. Ciérralo al terminar la demo.
- Los datos que vea el cliente son los de tu base local: vale la pena sembrarla con
  clientes y deudas creíbles antes de mostrarla.
- El CORS no es problema aquí: una app nativa no aplica política de origen. Solo
  importaría en la versión web.
- **El interstitial de ngrok no afecta a la app.** El plan gratuito interpone una página de
  advertencia, pero solo cuando el `User-Agent` es de navegador. Comprobado contra este
  backend: con `User-Agent: okhttp/4.9.2` —el que usa Android— la petición pasa directo y
  el API responde normal; con un `User-Agent` de Chrome devuelve el HTML de la advertencia.
  No hay que tocar el cliente HTTP de la app ni mandar el header
  `ngrok-skip-browser-warning`. Si alguna vez abres la URL en un navegador para probar, esa
  página es esperada y no significa que el túnel esté mal.

---

## Opción C — IP LAN en el APK

Compilar `preview` apuntando a `http://192.168.1.12:3000/api`, con el celular en tu WiFi.

Exige instalar `expo-build-properties` y habilitar `usesCleartextTraffic` (ver la trampa
de arriba), y aun así solo funciona dentro de tu red. Es más trabajo y más frágil que la
opción B. **No la uses** salvo que no puedas abrir un túnel.

---

## Cuando llegue la URL real

1. Reemplazar `https://REEMPLAZAR-CON-TU-API-PUBLICA/api` en los perfiles `preview` y
   `production` de `eas.json`.
2. Confirmar que responde por **HTTPS** (si es `http://`, no sirve: vuelve la trampa).
3. `npm run build:android`.
4. Probar el APK antes de repartirlo: entrar con un usuario real, crear un cliente,
   registrar una deuda y un abono. Si el API no responde, la app lo muestra como error
   de red y ahí se nota de una.
