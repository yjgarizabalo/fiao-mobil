# Contexto de trabajo

El historial de decisiones de este proyecto: qué se migró, qué se refactorizó, cómo se
despliega y por qué cada cosa quedó como quedó.

La diferencia con los documentos de la raíz es el tiempo verbal. `CLAUDE.md` y `README.md`
describen **cómo está el proyecto hoy** y hay que mantenerlos al día. Lo de aquí describe
**qué pasó y por qué se decidió así**, y se lee para entender el presente sin tener que
reconstruirlo desde los commits.

---

## Qué hay

### [`migraciones/`](migraciones/)

Cambios grandes y planificados, con su antes y su después.

- [**v1-a-v2-arquitectura.md**](migraciones/v1-a-v2-arquitectura.md) — la refactorización
  de la rama `refactor/v2-arquitectura`: arquitectura por capas, design system propio,
  bugs corregidos por el camino y tabla de paridad funcional con el v1.

### [`despliegue/`](despliegue/)

Cómo sacar la app de la máquina de desarrollo.

- [**eas-build-android.md**](despliegue/eas-build-android.md) — cómo está configurado EAS
  Build: perfiles, variables de entorno, keystore, versionado y pendientes conocidos.
- [**probar-con-backend-local.md**](despliegue/probar-con-backend-local.md) — cómo probar
  el APK mientras el API solo corre en local. Incluye por qué un build de release no puede
  hablar por HTTP plano.

### [`bitacora/`](bitacora/)

Una entrada por sesión de trabajo relevante, con fecha: qué se encontró, qué se cambió,
qué se decidió y —sobre todo— **qué se verificó y qué no**.

- [**2026-09-17-configuracion-eas-build.md**](bitacora/2026-09-17-configuracion-eas-build.md)

---

## Convención

- **Español**, igual que el resto de la documentación del proyecto.
- Un documento explica **decisiones**, no repite lo que ya dice el código. Si algo se
  entiende leyendo el archivo fuente, no va aquí.
- Las entradas de bitácora llevan `AAAA-MM-DD-` al principio del nombre y **no se
  reescriben** después: son el registro de lo que se sabía ese día. Lo que cambie se
  corrige en el documento vigente (`CLAUDE.md`, o el de `despliegue/`), no en la bitácora.
- Todo documento nuevo se enlaza desde este índice. Si no está aquí, no existe.
- Lo que sea **regla** —algo que haya que cumplir en cada cambio— no va aquí: va a
  `CLAUDE.md`. Esta carpeta es el porqué; `CLAUDE.md` es el qué hacer.

---

Las reglas del proyecto están en [`../CLAUDE.md`](../CLAUDE.md) y la presentación de la app
en [`../README.md`](../README.md).
