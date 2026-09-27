/**
 * Caché local de respuestas del servidor (estrategia stale-while-revalidate).
 *
 * Por qué existe: el backend corre en un plan gratuito (Render) que "duerme" el
 * servicio tras unos minutos de inactividad. El primer arranque en frío tarda
 * ~50s y la petición vence antes (timeout), así que al reabrir la app las
 * pantallas se quedaban sin datos. Guardando la última respuesta buena en disco,
 * la app pinta al instante lo último que vio y revalida en segundo plano; si la
 * red falla, se sigue mostrando lo guardado en vez de un error. De paso se
 * evita el "keep-alive" (hacer ping al servidor para que no duerma), que
 * consumiría las horas gratis del plan: justo lo que se quiere evitar.
 *
 * No se usa `StorageKeys` (el juego cerrado y tipado de `storage.ts`) porque las
 * llaves de caché son dinámicas: dependen del usuario, del negocio y del
 * cliente. Viven bajo su propio prefijo y con su propio envoltorio versionado,
 * y se barren todas de una vez al cerrar sesión.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createLogger } from '@/core/logger';

const log = createLogger('cache');

/** Prefijo de todas las llaves de caché, para poder barrerlas en el logout. */
const CACHE_PREFIX = 'fiao_cache:';

/**
 * Versión del formato del envoltorio. Si cambia la forma de lo que se guarda
 * (o de los modelos que contiene, para no leer basura vieja tras un cambio de
 * mappers), se sube este número y las entradas viejas se descartan solas.
 */
const CACHE_VERSION = 1;

interface CacheEnvelope<T> {
  /** Versión del formato; si no coincide, la entrada se descarta. */
  v: number;
  /** Epoch en ms del momento en que se guardó. */
  savedAt: number;
  data: T;
}

export interface CacheHit<T> {
  data: T;
  /** Epoch ms en que se guardó; sirve para un "actualizado hace X". */
  savedAt: number;
}

const fullKey = (key: string) => `${CACHE_PREFIX}${key}`;

/** Lee una entrada. Devuelve `null` si no existe, está corrupta o es de otra versión. */
export const readCache = async <T>(key: string): Promise<CacheHit<T> | null> => {
  try {
    const raw = await AsyncStorage.getItem(fullKey(key));
    if (raw === null) return null;

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (parsed.v !== CACHE_VERSION) {
      await AsyncStorage.removeItem(fullKey(key));
      return null;
    }
    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch (error) {
    log.warn(`Caché ilegible en "${key}", se descarta`, error);
    return null;
  }
};

/** Guarda (o reemplaza) una entrada. Nunca lanza: un fallo de disco no debe romper la app. */
export const writeCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    const envelope: CacheEnvelope<T> = { v: CACHE_VERSION, savedAt: Date.now(), data };
    await AsyncStorage.setItem(fullKey(key), JSON.stringify(envelope));
  } catch (error) {
    log.warn(`No se pudo guardar la caché "${key}"`, error);
  }
};

/** Borra una entrada concreta. */
export const removeCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(fullKey(key));
  } catch (error) {
    log.warn(`No se pudo borrar la caché "${key}"`, error);
  }
};

/**
 * Borra TODA la caché. Se llama al cerrar sesión: los datos de un tendero no
 * deben quedar disponibles para la siguiente cuenta que entre en el dispositivo.
 */
export const clearCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (ours.length > 0) await AsyncStorage.multiRemove(ours);
  } catch (error) {
    log.error('No se pudo limpiar la caché', error);
  }
};
