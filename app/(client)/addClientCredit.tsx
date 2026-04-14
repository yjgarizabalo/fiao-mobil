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
    if (!documentNumber.trim()) newErrors.documentNumber = "El número de documento es obligatorio";
    if (!phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!businessId) { alert("No hay negocio seleccionado"); return; }
    if (validateForm()) {
      addClient(String(businessId), { name, documentType, documentNumber, phone });
      router.back();
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight50">
      <Header title="Agregar Cliente" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box p="$6">
          <VStack space="lg" alignItems="center">
            <HStack alignItems="center" space="md" w="100%" mb="$4">
              <Pressable onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
              </Pressable>
              <Heading size="2xl" color={Colors.primary}>
                Nuevo Cliente
              </Heading>
            </HStack>

            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>Nombre *</Text>
              <Input size="lg" w="100%" h={54} borderRadius={4} borderColor={errors.name ? Colors.error : "$borderLight200"}>
                <InputField placeholder="Ingresa el nombre" value={name} onChangeText={setName} />
              </Input>
              {errors.name && <Text size="xs" color={Colors.error}>{errors.name}</Text>}
            </VStack>

            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>Tipo de Documento *</Text>
              <HStack space="sm" w="100%">
                <Input size="lg" flex={0.2} h={54} borderRadius={4}>
                  <InputField placeholder="CC" value={documentType} onChangeText={setDocumentType} />
                </Input>
                <Input size="lg" flex={0.8} h={54} borderRadius={4} borderColor={errors.documentNumber ? Colors.error : "$borderLight200"}>
                  <InputField placeholder="Ingresa el número de documento" value={documentNumber} onChangeText={setDocumentNumber} keyboardType="numeric" />
                </Input>
              </HStack>
              {errors.documentNumber && <Text size="xs" color={Colors.error}>{errors.documentNumber}</Text>}
            </VStack>

            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>Teléfono *</Text>
              <Input size="lg" w="100%" h={54} borderRadius={4} borderColor={errors.phone ? Colors.error : "$borderLight200"}>
                <InputField placeholder="Ingresa el teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </Input>
              {errors.phone && <Text size="xs" color={Colors.error}>{errors.phone}</Text>}
            </VStack>

            <VStack space="sm" w="100%">
              <Text size="sm" fontWeight="$medium" color={Colors.primary}>Nota</Text>
              <Input size="lg" w="100%" h={54} borderRadius={4} borderColor="$borderLight200">
                <InputField placeholder="Nota (opcional)" value={note} onChangeText={setNote} />
              </Input>
            </VStack>

            <Button
              size="lg" w="100%" h={52} borderRadius={14} bg={Colors.primary}
              $pressed={{ bg: Colors.primaryHover }}
              onPress={handleSave} mt="$6"
            >
              <ButtonText color={Colors.white}>Guardar Cliente</ButtonText>
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
