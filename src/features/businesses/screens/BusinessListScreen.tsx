/**
 * Lista de negocios.
 *
 * En el v1 esta pantalla existía dos veces (una como pestaña y otra como
 * pantalla apilada, con el código casi duplicado). Aquí hay una sola: la
 * pestaña. El negocio activo se marca de forma explícita y se puede cambiar
 * desde aquí, además del selector del inicio.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { haptics } from '@/core/haptics';
import { routes } from '@/core/navigation/routes';
import { useBusinesses } from '@/features/businesses/state/BusinessProvider';
import {
  AppBar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Fab,
  IconBubble,
  ListSkeleton,
  PressableScale,
  Screen,
  Text,
} from '@/ui';
import { theme } from '@/theme';

export const BusinessListScreen = () => {
  const { businesses, activeBusinessId, isLoading, error, refresh, selectBusiness } =
    useBusinesses();

  const handleSelect = (businessId: string) => {
    haptics.select();
    selectBusiness(businessId);
  };

  return (
    <Screen>
      <AppBar title="Mis negocios" subtitle="Cada negocio lleva sus propios vales" large />

      {isLoading && businesses.length === 0 ? (
        <View style={styles.skeletonHost}>
          <ListSkeleton count={4} />
        </View>
      ) : error && businesses.length === 0 ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon="storefront-outline"
          title="Aún no tienes negocios"
          message="Crea tu tienda para empezar a registrar clientes y llevar sus vales."
          actionLabel="Crear negocio"
          onAction={() => router.push(routes.business.create)}
          tone="brand"
        />
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(business) => business.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={theme.color.brand}
              colors={[theme.color.brand]}
            />
          }
          renderItem={({ item: business }) => {
            const isActive = business.id === activeBusinessId;

            return (
              <View style={[styles.card, isActive ? styles.cardActive : null]}>
                <PressableScale
                  onPress={() => router.push(routes.tabs.clients)}
                  haptic="tap"
                  activeScale={0.99}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver los clientes de ${business.name}`}
                  style={styles.cardMain}
                >
                  <IconBubble
                    icon="storefront"
                    tone={isActive ? 'brand' : 'neutral'}
                    size={48}
                  />

                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text variant="bodyStrong" numberOfLines={1} style={styles.cardTitle}>
                        {business.name}
                      </Text>
                      {isActive ? <Badge label="Activo" tone="brand" /> : null}
                    </View>

                    {business.address ? (
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {business.address}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={theme.color.textSubtle} />
                </PressableScale>

                {!isActive ? (
                  <Button
                    label="Usar este negocio"
                    variant="ghost"
                    size="sm"
                    icon="swap-horizontal-outline"
                    onPress={() => handleSelect(business.id)}
                    fullWidth
                  />
                ) : null}
              </View>
            );
          }}
        />
      )}

      <Fab label="Nuevo negocio" onPress={() => router.push(routes.business.create)} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  skeletonHost: {
    paddingHorizontal: theme.layout.gutter,
  },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.color.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  cardActive: {
    borderColor: theme.color.brand,
    backgroundColor: theme.color.brandSoft,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardTitle: {
    flexShrink: 1,
  },
});
