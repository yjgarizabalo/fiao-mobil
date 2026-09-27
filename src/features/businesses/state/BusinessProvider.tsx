/**
 * Negocios del usuario y negocio activo.
 *
 * Es el único estado de dominio que sí merece ser global: casi todas las
 * peticiones necesitan un `businessId`, y el usuario espera que la app
 * recuerde con qué negocio estaba trabajando entre sesiones (se persiste en
 * AsyncStorage).
 *
 * El v1 tenía cinco providers anidados; clientes, deudas y pagos no
 * necesitaban estado compartido —cada pantalla carga sus propios datos— así
 * que aquí quedan solo dos: sesión y negocios.
 */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { type AppError, toAppError } from '@/core/errors/AppError';
import { createLogger } from '@/core/logger';
import { readCache, writeCache } from '@/core/storage/cache';
import { StorageKeys, getItem, setItem } from '@/core/storage/storage';
import type { Business, BusinessDraft } from '@/domain/models';
import { useSession } from '@/features/auth/session/SessionProvider';
import { businessApi } from '@/features/businesses/api/businessApi';

const log = createLogger('business');

interface BusinessContextValue {
  businesses: Business[];
  /** Negocio con el que se está trabajando. `null` si aún no hay ninguno. */
  activeBusiness: Business | null;
  activeBusinessId: string | null;
  isLoading: boolean;
  error: AppError | null;
  /** `true` cuando el usuario todavía no ha creado ningún negocio. */
  isEmpty: boolean;
  selectBusiness: (businessId: string) => void;
  refresh: () => Promise<void>;
  createBusiness: (draft: BusinessDraft) => Promise<Business>;
  getBusiness: (businessId: string) => Business | undefined;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useSession();
  const userId = user?.id ?? null;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  /**
   * Espejo síncrono de `businesses`: en el `catch` de `load` hay que saber si ya
   * hay negocios (de caché o de una carga previa) sin esperar a un re-render.
   */
  const businessesRef = useRef<Business[]>([]);
  const applyBusinesses = useCallback((items: Business[]) => {
    businessesRef.current = items;
    setBusinesses(items);
  }, []);

  /**
   * Restaura el negocio guardado; si ya no existe (lo borraron), cae al primero
   * disponible. Se ejecuta tanto al hidratar de caché como tras la red.
   */
  const resolveActiveBusiness = useCallback(async (items: Business[]) => {
    const storedId = await getItem(StorageKeys.activeBusinessId);
    const preferred = items.find((business) => business.id === storedId) ?? items[0] ?? null;
    setActiveBusinessId(preferred?.id ?? null);
    if (preferred && preferred.id !== storedId) {
      await setItem(StorageKeys.activeBusinessId, preferred.id);
    }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const cacheKey = userId ? `businesses:${userId}` : undefined;

    // Rehidratación: pinta los negocios guardados para que la app NO muestre
    // "crea tu primer negocio" mientras el backend gratuito despierta. Sin esto,
    // un arranque en frío que vence dejaba `businesses=[]` y disparaba esa
    // pantalla por error.
    if (cacheKey && businessesRef.current.length === 0) {
      const hit = await readCache<Business[]>(cacheKey);
      if (hit && hit.data.length > 0) {
        applyBusinesses(hit.data);
        await resolveActiveBusiness(hit.data);
        setHasLoaded(true);
      }
    }

    try {
      const items = await businessApi.listAll();
      applyBusinesses(items);
      await resolveActiveBusiness(items);
      if (cacheKey) void writeCache(cacheKey, items);
    } catch (caught) {
      const appError = toAppError(caught);
      log.error('No se pudieron cargar los negocios', { code: appError.code });
      // Si ya hay negocios que mostrar (caché o carga previa), no se borran: el
      // servidor dormido no debe mandar al usuario a "crea tu primer negocio".
      if (businessesRef.current.length === 0) {
        setError(appError);
        applyBusinesses([]);
      }
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [applyBusinesses, resolveActiveBusiness, userId]);

  // Se cargan al autenticarse y se limpian al salir.
  useEffect(() => {
    if (isAuthenticated) {
      void load();
    } else {
      applyBusinesses([]);
      setActiveBusinessId(null);
      setHasLoaded(false);
      setError(null);
    }
  }, [isAuthenticated, load, applyBusinesses]);

  const selectBusiness = useCallback((businessId: string) => {
    setActiveBusinessId(businessId);
    void setItem(StorageKeys.activeBusinessId, businessId);
  }, []);

  const createBusiness = useCallback(
    async (draft: BusinessDraft) => {
      const created = await businessApi.create(draft);
      const next = [...businessesRef.current, created];
      applyBusinesses(next);
      // Se refresca la caché para que el negocio recién creado sobreviva a un
      // reinicio aunque el backend se duerma antes de la siguiente carga.
      if (userId) void writeCache(`businesses:${userId}`, next);
      // El primer negocio pasa a ser el activo automáticamente: es lo que el
      // usuario espera justo después de crearlo.
      if (!activeBusinessId) selectBusiness(created.id);
      return created;
    },
    [activeBusinessId, applyBusinesses, selectBusiness, userId],
  );

  const getBusiness = useCallback(
    (businessId: string) => businesses.find((business) => business.id === businessId),
    [businesses],
  );

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === activeBusinessId) ?? null,
    [businesses, activeBusinessId],
  );

  const value = useMemo<BusinessContextValue>(
    () => ({
      businesses,
      activeBusiness,
      activeBusinessId,
      isLoading,
      error,
      isEmpty: hasLoaded && businesses.length === 0,
      selectBusiness,
      refresh: load,
      createBusiness,
      getBusiness,
    }),
    [
      businesses,
      activeBusiness,
      activeBusinessId,
      isLoading,
      error,
      hasLoaded,
      selectBusiness,
      load,
      createBusiness,
      getBusiness,
    ],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export const useBusinesses = (): BusinessContextValue => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinesses debe usarse dentro de un BusinessProvider');
  }
  return context;
};
