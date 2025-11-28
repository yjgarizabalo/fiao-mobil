import { Ionicons } from '@expo/vector-icons';
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
  VStack
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import Header from '../../../components/Header';
import { Colors } from '../../../constants/Colors';
import { useBusiness } from '../../../contexts/BusinessContext';

export default function BusinessScreen() {
  const { businesses } = useBusiness();
  const [searchText, setSearchText] = useState('');


  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filtra los negocios por nombre
  const filteredBusinesses = businesses.filter(business =>
    normalizeText(business.name).includes(normalizeText(searchText))
  );

  // entrar lista de clientes del negocio
  const handleBusinessPress = (businessId: string) => {
     router.push({
    pathname: '/(client)/clientList',
    params: { businessId },
  });
   };

  //Agregar negocio
  const handleAddBusiness = () => {
    router.push('/(business)/addBusiness');
  };

  return (

    <Box flex={1} bg="$backgroundLight50">
      <ScrollView flex={1}>
 <Header title="Negocios" />
      <Box bg="$white" p="$4" borderBottomWidth={1} borderBottomColor="$borderLight200">
        <VStack space="md">
          <VStack space="xs" alignItems="center">
            <Heading size="xl" color={Colors.primary}>
              Mis Negocios
            </Heading>
            <Text size="sm" color="$textLight500">
              {filteredBusinesses.length} de {businesses.length} negocios
            </Text>
          </VStack>

          {/* Barra de búsqueda */}
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
            <Input flex={1} variant="outline" size="sm" bg="transparent" borderWidth={0}>
              <InputField
                placeholder="Buscar negocio..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </Input>
          </HStack>
        </VStack>
      </Box>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}flex={1} p="$4" contentContainerStyle={{ paddingBottom: 20 }}>
        <HStack space="md">
          {filteredBusinesses.map((business) => (
          <Pressable onPress={() => { handleBusinessPress(business.id) }}>
            <Card
              key={business.id}
              p="$4"
              bg="$white"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderLight200"
              shadowOpacity={0}
              elevation={0}
              $pressed={{
                bg: "$backgroundLight100",
                borderColor: Colors.primary
              }}
            >
                <VStack alignItems="center" space="md" flex={1}>
                  <Avatar size="md" bg={Colors.gray200} borderRadius="$full">
                    <AvatarFallbackText color={Colors.gray600}>
                      {business.name}
                    </AvatarFallbackText>
                  </Avatar>
                  <VStack flex={1}>
                    <Text size="md" fontWeight="$semibold" color={Colors.primary}>
                      {business.name}
                    </Text>
                  </VStack>
                </VStack>
            </Card>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>

      {/* Lista de mis deudas */}
      <Box bg="$white" p="$4" borderBottomWidth={1} borderBottomColor="$borderLight200">
        <VStack space="md">
          <VStack space="xs" alignItems="center">
            <Heading size="xl" color={Colors.primary}>
              Mis Deudas
            </Heading>
            <Text size="sm" color="$textLight500">
              {filteredBusinesses.length} de {businesses.length} deudas
            </Text>
          </VStack>

          {/* Barra de búsqueda */}
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
            <Input flex={1} variant="outline" size="sm" bg="transparent" borderWidth={0}>
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
          {filteredBusinesses.map((business) => (
            <Card
              key={business.id}
              p="$4"
              bg="$white"
              borderRadius={12}
              borderWidth={1}
              borderColor="$borderLight200"
              shadowOpacity={0}
              elevation={0}
              $pressed={{
                bg: "$backgroundLight100",
                borderColor: Colors.primary
              }}
            >
              <Pressable onPress={() => { }}>
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" space="md" flex={1}>
                    <Avatar size="md" bg={Colors.gray200} borderRadius="$full">
                      <AvatarFallbackText color={Colors.gray600}>
                        {business.name}
                      </AvatarFallbackText>
                    </Avatar>
                    <VStack flex={1}>
                      <Text size="md" fontWeight="$semibold" color={Colors.primary}>
                        {business.name}
                      </Text>
                    </VStack>
                  </HStack>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.gray400}
                  />
                </HStack>
              </Pressable>
            </Card>
          ))}
        </VStack>
      </ScrollView>


      {/* Botón agregar negocio */}
      <Box p="$4">
        <Button
          size="lg"
          w="100%"
          h={52}
          borderRadius={14}
          bg={Colors.primary}
          $pressed={{
            bg: Colors.primaryHover
          }}
          onPress={handleAddBusiness}
        >
          <HStack alignItems="center" justifyContent="space-between" w="100%">
            <ButtonText color={Colors.white}>Agregar negocio</ButtonText>
            <Ionicons name="add" size={20} color={Colors.white} />
          </HStack>
        </Button>
      </Box>
      </ScrollView>
      {/* Lista de negocios */}
    </Box>
  );
}
