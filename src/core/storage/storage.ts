// Wrapper tipado sobre AsyncStorage. Ninguna otra parte de la app debe importar
// @react-native-async-storage/async-storage directamente ni escribir el nombre de una
// llave a mano: todas viven en StorageKeys, así que renombrar una llave es un cambio en
// un solo sitio en vez de una búsqueda por el repo.
//
// Los nombres de las tres primeras llaves son el contrato de sesión heredado: una
// sesión guardada por versiones anteriores de la app sigue siendo válida.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  accessToken: 'auth_token',
  refreshToken: 'refresh_token',
  user: 'auth_user',
  activeBusinessId: 'active_business_id',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export async function getItem(key: StorageKey): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: StorageKey, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Un fallo de storage no debe tumbar la app.
  }
}

export async function removeItems(keys: StorageKey[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // ídem
  }
}

export async function getItems(keys: StorageKey[]): Promise<Record<string, string | null>> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    return Object.fromEntries(pairs);
  } catch {
    return Object.fromEntries(keys.map((key) => [key, null]));
  }
}

export async function getJson<T>(key: StorageKey): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJson<T>(key: StorageKey, value: T): Promise<void> {
  await setItem(key, JSON.stringify(value));
}
