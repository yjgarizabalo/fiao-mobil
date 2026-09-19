/**
 * Rutas de la aplicación, en un solo sitio.
 *
 * En el v1 las rutas estaban escritas como strings literales repartidos por 20
 * archivos (`router.push("/(client)/clientDetail?id=" + id)`), así que
 * renombrar una pantalla obligaba a buscar y reemplazar a mano y cualquier
 * typo solo se descubría al probar.
 *
 * Aquí cada ruta es una función o constante: el editor autocompleta y
 * renombrar una pantalla es cambiar una línea.
 *
 * Nota sobre la estructura de carpetas: los grupos entre paréntesis
 * (`(auth)`, `(app)`, `(tabs)`) no aparecen en la URL. Las subrutas usan
 * nombre en singular (`/client/new`) mientras las pestañas usan plural
 * (`/clients`) para que nunca coincidan dos archivos en la misma URL.
 */
import type { Href } from 'expo-router';

export const routes = {
  /** Puerta de entrada: decide entre login y home según la sesión. */
  root: '/' as Href,

  auth: {
    login: '/login' as Href,
    register: '/register' as Href,
  },

  tabs: {
    home: '/home' as Href,
    businesses: '/businesses' as Href,
    clients: '/clients' as Href,
    profile: '/profile' as Href,
  },

  business: {
    create: '/business/new' as Href,
  },

  client: {
    create: (businessId: string): Href =>
      ({ pathname: '/client/new', params: { businessId } }) as unknown as Href,
    detail: (debtorId: string, businessId: string): Href =>
      ({ pathname: '/client/[id]', params: { id: debtorId, businessId } }) as unknown as Href,
    edit: (debtorId: string, businessId: string): Href =>
      ({ pathname: '/client/edit', params: { id: debtorId, businessId } }) as unknown as Href,
  },

  settings: {
    profile: '/settings/profile' as Href,
    security: '/settings/security' as Href,
  },
} as const;
