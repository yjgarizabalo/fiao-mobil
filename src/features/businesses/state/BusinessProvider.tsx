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
  useState,
} from 'react';

import { type AppError, toAppError } from '@/core/errors/AppError';
import { createLogger } from '@/core/logger';
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
  const { isAuthenticated } = useSession();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await businessApi.listAll();
      setBusinesses(items);

      // Se restaura el negocio guardado; si ya no existe (lo borraron), se
      // cae al primero disponible.
      const storedId = await getItem(StorageKeys.activeBusinessId);
      const preferred =
        items.find((business) => business.id === storedId) ?? items[0] ?? null;

      setActiveBusinessId(preferred?.id ?? null);
      if (preferred && preferred.id !== storedId) {
        await setItem(StorageKeys.activeBusinessId, preferred.id);
      }
    } catch (caught) {
      const appError = toAppError(caught);
      log.error('No se pudieron cargar los negocios', { code: appError.code });
      setError(appError);
      setBusinesses([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // Se cargan al autenticarse y se limpian al salir.
  useEffect(() => {
    if (isAuthenticated) {
      void load();
    } else {
      setBusinesses([]);
      setActiveBusinessId(null);
      setHasLoaded(false);
      setError(null);
    }
  }, [isAuthenticated, load]);

  const selectBusiness = useCallback((businessId: string) => {
    setActiveBusinessId(businessId);
    void setItem(StorageKeys.activeBusinessId, businessId);
  }, []);

  const createBusiness = useCallback(
    async (draft: BusinessDraft) => {
      const created = await businessApi.create(draft);
      setBusinesses((previous) => [...previous, created]);
      // El primer negocio pasa a ser el activo automáticamente: es lo que el
      // usuario espera justo después de crearlo.
      if (!activeBusinessId) selectBusiness(created.id);
      return created;
    },
    [activeBusinessId, selectBusiness],
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
