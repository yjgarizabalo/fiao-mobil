import Header from "@/components/Header";
import { Colors } from "@/constants/Colors";
import { useBusiness } from "@/contexts/BusinessContext";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  AvatarFallbackText,
  Box,
  Button,
  ButtonText,
  Card,
  Heading,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useState } from "react";

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function BusinessesTab() {
  const { businesses } = useBusiness();
  const [searchText, setSearchText] = useState("");

  const filteredBusinesses = businesses.filter((b) =>
    normalizeText(b.name).includes(normalizeText(searchText)),
  );

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header />
      <Box
        bg="$white"
        p="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderLight200"
      >
        <VStack space="md">
          <VStack space="xs" alignItems="center">
            <Heading size="xl" color={Colors.primary}>
              Mis Negocios
            </Heading>
            <Text size="sm" color="$textLight500">
              {filteredBusinesses.length} de {businesses.length} negocios
            </Text>
          </VStack>
          <HStack
            alignItems="center"
            space="sm"
            bg="$backgroundLight50"
            borderRadius={8}
            borderWidth={1}
            borderColor="$borderLight200"
            px="$3"
            h={44}
          >
            <Ionicons name="search" size={18} color={Colors.gray400} />
            <Input
              flex={1}
              variant="outline"
              size="sm"
              bg="transparent"
              borderWidth={0}
            >
              <InputField
                placeholder="Buscar negocio..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </Input>
          </HStack>
        </VStack>
      </Box>

      <ScrollView flex={1} p="$4" contentContainerStyle={{ paddingBottom: 20 }}>
        <VStack space="md">
          {filteredBusinesses.length === 0 ? (
            <Text size="sm" color="$textLight500" textAlign="center" mt="$4">
              No se encontraron negocios
            </Text>
          ) : (
            filteredBusinesses.map((business) => (
              <Pressable
                key={business.id}
                onPress={() =>
                  router.push({
                    pathname: "/(client)/clientList",
                    params: { businessId: business.id },
                  })
                }
              >
                <Card
                  p="$4"
                  bg="$white"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="$borderLight200"
                  shadowOpacity={0}
                  elevation={0}
                  $pressed={{
                    bg: "$backgroundLight100",
                    borderColor: Colors.primary,
                  }}
                >
                  <HStack alignItems="center" justifyContent="space-between">
                    <HStack alignItems="center" space="md" flex={1}>
                      <Avatar
                        size="md"
                        bg={Colors.gray200}
                        borderRadius="$full"
                      >
                        <AvatarFallbackText color={Colors.gray600}>
                          {business.name}
                        </AvatarFallbackText>
                      </Avatar>
                      <Text
                        size="md"
                        fontWeight="$semibold"
                        color={Colors.primary}
                      >
                        {business.name}
                      </Text>
                    </HStack>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.gray400}
                    />
                  </HStack>
                </Card>
              </Pressable>
            ))
          )}
        </VStack>
      </ScrollView>

      <Box p="$4">
        <Button
          size="lg"
          w="100%"
          h={52}
          borderRadius={14}
          bg={Colors.primary}
          $pressed={{ bg: Colors.primaryHover }}
          onPress={() => router.push("/(business)/addBusiness")}
        >
          <HStack alignItems="center" justifyContent="space-between" w="100%">
            <ButtonText color={Colors.white}>Agregar negocio</ButtonText>
            <Ionicons name="add" size={20} color={Colors.white} />
          </HStack>
        </Button>
      </Box>
    </Box>
  );
}
