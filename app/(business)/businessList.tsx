import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonText,
  Heading,
  HStack,
  Input,
  InputField,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList } from "react-native";
import Header from "../../components/Header";
import { BusinessSkeletonList } from "../../components/SkeletonLoader";
import { Colors } from "../../constants/Colors";
import { useBusiness } from "../../contexts/BusinessContext";

const normalizeText = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const getInitials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export default function BusinessListScreen() {
  const { businesses, pagination, isLoadingMore, fetchBusinesses, loadMoreBusinesses } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBusinesses().finally(() => setLoading(false));
    }, [])
  );

  const filteredBusinesses = businesses.filter((b) =>
    normalizeText(b.name).includes(normalizeText(searchText))
  );

  const handleBusinessPress = (businessId: string) => {
    router.push({
      pathname: "/(client)/clientList",
      params: { businessId },
    });
  };

  if (loading) {
    return (
      <Box flex={1} bg="$backgroundLight50">
        <Header showBack />
        <Box bg="$white" px="$4" pt="$4" pb="$3" borderBottomWidth={1} borderBottomColor="$borderLight100">
          <HStack justifyContent="space-between" alignItems="flex-end">
            <VStack space="xs">
              <Text size="xs" color="$textLight400" fontWeight="$medium" letterSpacing={1}>
                MIS NEGOCIOS
              </Text>
              <Heading size="xl" color={Colors.primary} fontWeight="$bold">Negocios</Heading>
            </VStack>
          </HStack>
        </Box>
        <BusinessSkeletonList />
      </Box>
    );
  }

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header showBack />

      {/* ── Encabezado ── */}
      <Box bg="$white" px="$4" pt="$4" pb="$3" borderBottomWidth={1} borderBottomColor="$borderLight100">
        <VStack space="sm">
          <HStack justifyContent="space-between" alignItems="flex-end">
            <VStack space="xs">
              <Text size="xs" color="$textLight400" fontWeight="$medium" letterSpacing={1}>
                MIS NEGOCIOS
              </Text>
              <Heading size="xl" color={Colors.primary} fontWeight="$bold">Negocios</Heading>
            </VStack>
            <Box px="$3" py="$1" borderRadius={20} bg={Colors.primary + "12"} mb="$1">
              <Text size="sm" color={Colors.primary} fontWeight="$bold">
                {pagination?.total ?? businesses.length} total
              </Text>
            </Box>
          </HStack>

          {/* Buscador */}
          <Box w="$full" borderRadius={12} borderWidth={1} borderColor="$borderLight200" bg="$backgroundLight50" overflow="hidden">
            <HStack alignItems="center" px="$3" h={46}>
              <Ionicons name="search-outline" size={18} color={Colors.primary} />
              <Input flex={1} variant="outline" size="sm" bg="transparent" borderWidth={0} ml="$2">
                <InputField
                  placeholder="Buscar negocio..."
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor="#9ca3af"
                />
              </Input>
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")} p="$1">
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </HStack>
          </Box>

          {searchText.length > 0 && (
            <Text size="xs" color="$textLight400" px="$1">
              {filteredBusinesses.length} resultado{filteredBusinesses.length !== 1 ? "s" : ""} para &ldquo;{searchText}&rdquo;
            </Text>
          )}
        </VStack>
      </Box>

      {/* ── Lista ── */}
      <FlatList
        data={filteredBusinesses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => { if (!searchText) loadMoreBusinesses(); }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <Box py="$12" alignItems="center">
            <VStack space="sm" alignItems="center">
              <Box w={56} h={56} borderRadius="$full" bg="$backgroundLight100" alignItems="center" justifyContent="center" mb="$2">
                <Ionicons name="storefront-outline" size={28} color="#9ca3af" />
              </Box>
              <Text size="md" fontWeight="$semibold" color="$textLight500">
                {searchText ? "Sin resultados" : "Sin negocios"}
              </Text>
              <Text size="sm" color="$textLight400" textAlign="center">
                {searchText
                  ? `No se encontró "${searchText}"`
                  : "Agrega tu primer negocio con el botón de abajo"}
              </Text>
            </VStack>
          </Box>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <Box py="$4" alignItems="center">
              <Text size="sm" color="$textLight400">Cargando más...</Text>
            </Box>
          ) : null
        }
        renderItem={({ item: business }) => {
          const avatarColor = getAvatarColor(business.name);
          const initials = getInitials(business.name);
          return (
            <Pressable onPress={() => handleBusinessPress(business.id)} style={{ marginBottom: 8 }}>
              <Box
                bg="$white" borderRadius={14} borderWidth={1} borderColor="$borderLight100" overflow="hidden"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
              >
                <HStack alignItems="center" px="$4" py="$3" space="md">
                  <Box w={44} h={44} borderRadius="$full" alignItems="center" justifyContent="center" style={{ backgroundColor: avatarColor + "22" }}>
                    <Text size="sm" fontWeight="$bold" style={{ color: avatarColor }}>{initials}</Text>
                  </Box>
                  <VStack flex={1} space="xs">
                    <Text size="md" fontWeight="$semibold" color={Colors.primary} numberOfLines={1}>{business.name}</Text>
                    {!!business.address && (
                      <Box px="$2" py="$0.5" borderRadius={20} style={{ backgroundColor: Colors.primary + "12" }}>
                        <Text size="xs" fontWeight="$medium" style={{ color: Colors.primary }}>{business.address}</Text>
                      </Box>
                    )}
                  </VStack>
                  <Box w={28} h={28} borderRadius="$full" bg="$backgroundLight50" alignItems="center" justifyContent="center">
                    <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
                  </Box>
                </HStack>
              </Box>
            </Pressable>
          );
        }}
      />

      {/* ── Botón flotante ── */}
      <Box
        position="absolute" bottom={0} left={0} right={0}
        px="$4" pt="$3" pb="$6" bg="$white"
        borderTopWidth={1} borderTopColor="$borderLight100"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8 }}
      >
        <Button
          size="lg" w="100%" h={52} borderRadius={14}
          bg={Colors.primary} $pressed={{ opacity: 0.85 }}
          onPress={() => router.push("/(business)/addBusiness")}
        >
          <HStack alignItems="center" space="sm">
            <Box w={24} h={24} borderRadius="$full" bg="rgba(255,255,255,0.2)" alignItems="center" justifyContent="center">
              <Ionicons name="add" size={16} color="#fff" />
            </Box>
            <ButtonText color="$white" fontWeight="$semibold">Agregar negocio</ButtonText>
          </HStack>
        </Button>
      </Box>
    </Box>
  );
}
