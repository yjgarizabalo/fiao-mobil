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
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import Header from "../../components/Header";
import { Colors } from "../../constants/Colors";
import { useClients } from "../../contexts/ClientContext";

export default function AddClientCreditScreen() {
  const { addClient } = useClients();
  const [name, setName] = useState("");
  //const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState("CC");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { businessId } = useLocalSearchParams();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.Name = "El nombre es obligatorio";
    // if (!lastName.trim()) newErrors.lastName = 'El apellido es obligatorio';
    if (!documentNumber.trim())
      newErrors.documentNumber = "El número de documento es obligatorio";
    if (!phone.trim()) newErrors.phone = "El teléfono es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!businessId) {
      alert("No hay negocio seleccionado");
      return;
    }
    if (validateForm()) {
      addClient(String(businessId), {
        name,
        documentType,
        documentNumber,
        phone,
      });
      router.back();
    }
  };

  const handleBack = () => {
    router.back();
  };
  console.log("BusinessId recibido desde addclient:", businessId);
  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Agregar Cliente" />
      <ScrollView>
        <Box p="$4">
          <HStack alignItems="center" space="md" mb="$4">
            <Pressable onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </Pressable>
            <Heading size="lg" color={Colors.primary}>
              Nuevo Cliente
            </Heading>
          </HStack>

          <VStack space="lg">
            <VStack space="sm">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Nombre *
              </Text>
              <Input
                size="lg"
                w="100%"
                h={54}
                borderRadius={4}
                borderColor={
                  errors.firstName ? Colors.error : "$borderLight200"
                }
              >
                <InputField
                  placeholder="Ingresa el nombre"
                  value={name}
                  onChangeText={setName}
                />
              </Input>
              {errors.firstName && (
                <Text size="xs" color={Colors.error}>
                  {errors.firstName}
                </Text>
              )}
            </VStack>

            {/*<VStack space="sm">
            <Text size="sm" fontWeight="$medium" color={Colors.primary}>
              Apellido *
            </Text>
            <Input 
              size="lg" 
              w="100%" 
              h={54} 
              borderRadius={4}
              borderColor={errors.lastName ? Colors.error : "$borderLight200"}
            >
              <InputField
                placeholder="Ingresa el apellido"
                value={lastName}
                onChangeText={setLastName}
              />
            </Input>
            {errors.lastName && (
              <Text size="xs" color={Colors.error}>
                {errors.lastName}
              </Text>
            )}
          </VStack> */}

            <VStack space="sm">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Tipo de Documento *
              </Text>
              <Input size="lg" w="100%" h={54} borderRadius={4}>
                <InputField
                  placeholder="CC"
                  value={documentType}
                  onChangeText={setDocumentType}
                />
              </Input>
            </VStack>

            <VStack space="sm">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Número de Documento *
              </Text>
              <Input
                size="lg"
                w="100%"
                h={54}
                borderRadius={4}
                borderColor={
                  errors.documentNumber ? Colors.error : "$borderLight200"
                }
              >
                <InputField
                  placeholder="Ingresa el número de documento"
                  value={documentNumber}
                  onChangeText={setDocumentNumber}
                  keyboardType="numeric"
                />
              </Input>
              {errors.documentNumber && (
                <Text size="xs" color={Colors.error}>
                  {errors.documentNumber}
                </Text>
              )}
            </VStack>

            <VStack space="sm">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Teléfono *
              </Text>
              <Input
                size="lg"
                w="100%"
                h={54}
                borderRadius={4}
                borderColor={errors.phone ? Colors.error : "$borderLight200"}
              >
                <InputField
                  placeholder="Ingresa el teléfono"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </Input>
              {errors.phone && (
                <Text size="xs" color={Colors.error}>
                  {errors.phone}
                </Text>
              )}
            </VStack>

            <VStack space="sm">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Nota *
              </Text>
              <Input
                size="lg"
                w="100%"
                h={54}
                borderRadius={4}
                borderColor={errors.password ? Colors.error : "$borderLight200"}
              >
                <InputField
                  placeholder="Nota (opcional)"
                  value={note}
                  onChangeText={setNote}
                  secureTextEntry
                />
              </Input>
              {errors.password && (
                <Text size="xs" color={Colors.error}>
                  {errors.password}
                </Text>
              )}
            </VStack>

            <Button
              size="lg"
              w="100%"
              h={52}
              borderRadius={14}
              bg={Colors.primary}
              $pressed={{
                bg: Colors.primaryHover,
              }}
              onPress={handleSave}
              mt="$6"
            >
              <ButtonText color={Colors.white}>Guardar Cliente</ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
