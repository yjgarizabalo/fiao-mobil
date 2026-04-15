import {
  Box,
  Button,
  ButtonText,
  Heading,
  HStack,
  Input,
  InputField,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import Header from "../../components/Header";
import { Colors } from "../../constants/Colors";
import { useClients } from "../../contexts/ClientContext";

export default function AddClientCreditScreen() {
  const { addClient } = useClients();
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("CC");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { businessId } = useLocalSearchParams();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "El nombre es obligatorio";
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

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Agregar Cliente" showBack />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box p="$6">
          <VStack space="lg" alignItems="center">
            <Heading size="2xl" color={Colors.primary} alignSelf="flex-start">
              Nuevo Cliente
            </Heading>

            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Nombre *
              </Text>
              <Input
                size="lg"
                w="100%"
                h={54}
                borderRadius={4}
                borderColor={errors.name ? Colors.error : "$borderLight200"}
              >
                <InputField
                  placeholder="Ingresa el nombre"
                  value={name}
                  onChangeText={setName}
                />
              </Input>
              {errors.name && (
                <Text size="xs" color={Colors.error}>
                  {errors.name}
                </Text>
              )}
            </VStack>

            <VStack space="sm" w="100%">
              <HStack space="sm" w="100%">
                <VStack space="sm" flex={0.4}>
                  <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                    Tipo *
                  </Text>
                  <Box
                    h={54}
                    borderRadius={4}
                    borderWidth={1}
                    borderColor="$borderLight200"
                    justifyContent="center"
                    overflow="hidden"
                  >
                    <Picker
                      selectedValue={documentType}
                      onValueChange={setDocumentType}
                      style={{ height: 54 }}
                    >
                      <Picker.Item label="Cédula de ciudadanía" value="CC" />
                      <Picker.Item label="NIT" value="NIT" />
                      <Picker.Item
                        label="Cédula de extranjería"
                        value="FOREIGNER"
                      />
                    </Picker>
                  </Box>
                </VStack>
                <VStack space="sm" flex={0.6}>
                  <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                    Número de Documento *
                  </Text>
                  <Input
                    size="lg"
                    h={54}
                    borderRadius={4}
                    borderColor={
                      errors.documentNumber ? Colors.error : "$borderLight200"
                    }
                  >
                    <InputField
                      placeholder="Ingresa documento"
                      value={documentNumber}
                      onChangeText={setDocumentNumber}
                      keyboardType="numeric"
                    />
                  </Input>
                </VStack>
              </HStack>
              {errors.documentNumber && (
                <Text size="xs" color={Colors.error}>
                  {errors.documentNumber}
                </Text>
              )}
            </VStack>

            <VStack space="sm" w="100%">
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

            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>
                Nota
              </Text>
              <Input
                size="lg"
                w="100%"
                h={54}
                borderRadius={4}
                borderColor="$borderLight200"
              >
                <InputField
                  placeholder="Nota (opcional)"
                  value={note}
                  onChangeText={setNote}
                />
              </Input>
            </VStack>

            <Button
              size="lg"
              w="100%"
              h={52}
              borderRadius={14}
              bg={Colors.primary}
              $pressed={{ bg: Colors.primaryHover }}
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
