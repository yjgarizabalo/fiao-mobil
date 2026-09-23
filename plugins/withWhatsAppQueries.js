/**
 * Declara la visibilidad del paquete de WhatsApp en el AndroidManifest.
 *
 * Desde Android 11 (API 30), el sistema oculta a una app qué otros paquetes
 * hay instalados a menos que se declaren en un bloque `<queries>`. Sin esto,
 * `Linking.canOpenURL('whatsapp://…')` responde siempre `false` aunque el
 * tendero sí tenga WhatsApp instalado — inutilizando la validación previa al
 * envío masivo de recordatorios (ver `core/utils/whatsapp.ts`).
 *
 * Se escribe como plugin local (usando `expo/config-plugins`, que ya viene
 * con el paquete `expo`) en vez de instalar un paquete de la comunidad: es
 * una sola declaración de manifest, no justifica una dependencia nueva.
 */
const { withAndroidManifest } = require('expo/config-plugins');

/** Paquete normal y el de WhatsApp Business, por si el tendero usa ese. */
const WHATSAPP_PACKAGES = ['com.whatsapp', 'com.whatsapp.w4b'];

const withWhatsAppQueries = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const queries = manifest.queries?.[0] ?? {};
    const existingNames = new Set((queries.package ?? []).map((item) => item.$['android:name']));

    queries.package = [
      ...(queries.package ?? []),
      ...WHATSAPP_PACKAGES.filter((name) => !existingNames.has(name)).map((name) => ({
        $: { 'android:name': name },
      })),
    ];
    manifest.queries = [queries];

    return config;
  });

module.exports = withWhatsAppQueries;
