import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Image,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Pressable,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { CustomAlert, useCustomAlert } from "../../components/CustomAlert";
import { Colors } from "../../constants/Colors";
import { AuthMessages } from "../../constants/Messages";
import { useAuth } from "../../contexts/AuthContext";
import { AuthError } from "../../services/authService";
import { isValidIdentifier } from "../../utils/validation";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { login } = useAuth();
  const { alertState, showAlert, hideAlert } = useCustomAlert();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!identifier.trim()) newErrors.identifier = "Este campo es obligatorio";
    if (!password.trim()) newErrors.password = "Este campo es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    if (!isValidIdentifier(identifier)) {
      showAlert(
        "warning",
        "Datos inválidos",
        "Ingresa un correo electrónico válido o un número de identificación.",
      );
      return;
    }

    setIsLoading(true);
    try {
      await login({ identifier, password });
      router.replace("/(main)/(tabs)/home");
    } catch (error) {
      let errorMessage = AuthMessages.login.unknownError;
      if (error instanceof AuthError) {
        switch (error.type) {
          case "INVALID_CREDENTIALS":
            errorMessage = AuthMessages.login.invalidCredentials;
            break;
          case "NETWORK_ERROR":
            errorMessage = AuthMessages.login.networkError;
            break;
          case "SERVER_ERROR":
            errorMessage = AuthMessages.login.serverError;
            break;
        }
      }
      showAlert("error", errorMessage.title, errorMessage.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} style={{ backgroundColor: "#ffffff" }}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        onClose={hideAlert}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Box flex={1} justifyContent="center" px="$6" py="$10">

            {/* ── Logo + título ── */}
            <VStack alignItems="center" mb="$10">
              <Image
                source={require("../../assets/images/fiaoicon.png")}
                alt="Fiao"
                w={90}
                h={90}
                resizeMode="contain"
                mb="$5"
              />
              <Text
                style={{
                  color: "#16101a",
                  fontSize: 26,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  textAlign: "center",
                }}
              >
                Iniciar sesión
              </Text>
              <Text
                style={{
                  color: "rgba(22,16,26,0.4)",
                  fontSize: 14,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                Ingresa tus datos para continuar
              </Text>
            </VStack>

            {/* ── Formulario ── */}
            <VStack space="md">

              {/* Identifier */}
              <VStack space="xs">
                <Text
                  size="xs"
                  style={{
                    color: "#16101a",
                    letterSpacing: 0.6,
                    fontWeight: "700",
                  }}
                >
                  CORREO O IDENTIFICACIÓN
                </Text>
                <Input
                  size="lg"
                  w="100%"
                  h={52}
                  borderRadius={14}
                  borderWidth={1.5}
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: errors.identifier ? "#f87171" : "#e4e4e7",
                  }}
                >
                  <InputField
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="rgba(22,16,26,0.25)"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="default"
                    autoCapitalize="none"
                    style={{ color: "#16101a" }}
                  />
                </Input>
                {errors.identifier && (
                  <Text size="xs" style={{ color: "#f87171" }}>
                    {errors.identifier}
                  </Text>
                )}
              </VStack>

              {/* Password */}
              <VStack space="xs">
                <Text
                  size="xs"
                  style={{
                    color: "#16101a",
                    letterSpacing: 0.6,
                    fontWeight: "700",
                  }}
                >
                  CONTRASEÑA
                </Text>
                <Input
                  size="lg"
                  w="100%"
                  h={52}
                  borderRadius={14}
                  borderWidth={1.5}
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: errors.password ? "#f87171" : "#e4e4e7",
                  }}
                >
                  <InputField
                    placeholder="••••••••"
                    placeholderTextColor="rgba(22,16,26,0.25)"
                    value={password}
                    onChangeText={setPassword}
                    type={showPassword ? "text" : "password"}
                    style={{ color: "#16101a" }}
                  />
                  <InputSlot pr="$3" onPress={() => setShowPassword(!showPassword)}>
                    <InputIcon
                      as={() => (
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={20}
                          color="rgba(22,16,26,0.3)"
                        />
                      )}
                    />
                  </InputSlot>
                </Input>
                {errors.password && (
                  <Text size="xs" style={{ color: "#f87171" }}>
                    {errors.password}
                  </Text>
                )}
              </VStack>

              {/* Forgot password */}
              <Pressable
                // onPress={() => router.push("/(auth)/forgot-password")}
                alignSelf="flex-end"
              >
                <Text
                  size="sm"
                  style={{ color: Colors.primary, fontWeight: "600" }}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>

              {/* Botón principal verde */}
              <Button
                size="lg"
                w="100%"
                mt="$2"
                h={54}
                borderRadius={16}
                onPress={handleLogin}
                isDisabled={isLoading}
                style={{
                  backgroundColor: "#4ade80",
                  shadowColor: "#4ade80",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  elevation: 8,
                }}
              >
                <HStack alignItems="center" space="sm">
                  <ButtonText
                    style={{
                      color: "#16101a",
                      fontWeight: "800",
                      fontSize: 16,
                    }}
                  >
                    {isLoading ? "Iniciando..." : "Iniciar sesión"}
                  </ButtonText>
                </HStack>
              </Button>

              {/* Divider */}
              <HStack alignItems="center" space="sm" mt="$1">
                <Box flex={1} h={1} style={{ backgroundColor: "#f0f0f0" }} />
                <Text style={{ color: "rgba(22,16,26,0.25)", fontSize: 12 }}>o</Text>
                <Box flex={1} h={1} style={{ backgroundColor: "#f0f0f0" }} />
              </HStack>

              {/* Registro */}
              <Pressable
                onPress={() => router.push("/(auth)/register")}
                alignSelf="center"
              >
                <Text style={{ color: "rgba(22,16,26,0.45)", fontSize: 14 }}>
                  ¿No tienes cuenta?{" "}
                  <Text
                    style={{
                      color: "#16101a",
                      fontWeight: "800",
                      textDecorationLine: "underline",
                    }}
                  >
                    Regístrate
                  </Text>
                </Text>
              </Pressable>

              {/* Patrocinadores */}
              <Box
                w="100%"
                h={56}
                mt="$2"
                borderRadius={14}
                justifyContent="center"
                alignItems="center"
                style={{
                  borderWidth: 1.5,
                  borderColor: "#f0f0f0",
                  borderStyle: "dashed",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: "rgba(22,16,26,0.2)",
                    fontWeight: "700",
                    letterSpacing: 2,
                  }}
                >
                  PATROCINADORES
                </Text>
              </Box>

            </VStack>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}