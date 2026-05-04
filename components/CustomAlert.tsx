import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type AlertType = "error" | "success" | "warning" | "info";

interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
}

const ALERT_CONFIG: Record<
  AlertType,
  { icon: string; bg: string; accent: string; iconBg: string }
> = {
  success: {
    icon: "checkmark-circle",
    bg: "#f0fdf4",
    accent: "#16a34a",
    iconBg: "#dcfce7",
  },
  error: {
    icon: "close-circle",
    bg: "#fff1f2",
    accent: "#e11d48",
    iconBg: "#ffe4e6",
  },
  warning: {
    icon: "warning",
    bg: "#fffbeb",
    accent: "#d97706",
    iconBg: "#fef3c7",
  },
  info: {
    icon: "information-circle",
    bg: "#f0f9ff",
    accent: "#0284c7",
    iconBg: "#e0f2fe",
  },
};

export function CustomAlert({
  visible,
  type,
  title,
  message,
  onClose,
  confirmText = "Entendido",
}: CustomAlertProps) {
  const config = ALERT_CONFIG[type];
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 18,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Icon bounce after appear
        Animated.sequence([
          Animated.timing(iconBounce, {
            toValue: -8,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(iconBounce, {
            toValue: 0,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      iconBounce.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) },
        ]}
      />

      {/* Card */}
      <View style={styles.centerer}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: "#ffffff", opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Colored top stripe */}
          <View style={[styles.stripe, { backgroundColor: config.accent }]} />

          {/* Icon bubble */}
          <Animated.View
            style={[
              styles.iconBubble,
              { backgroundColor: config.iconBg, transform: [{ translateY: iconBounce }] },
            ]}
          >
            <Ionicons name={config.icon as any} size={36} color={config.accent} />
          </Animated.View>

          {/* Text */}
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: "#16101a" }]}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: pressed ? config.accent + "ee" : config.accent },
            ]}
          >
            <Text style={styles.buttonText}>{confirmText}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Hook helper ────────────────────────────────────────────────────
export function useCustomAlert() {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    confirmText?: string;
  }>({ visible: false, type: "info", title: "", message: "" });

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    confirmText?: string
  ) => {
    setAlertState({ visible: true, type, title, message, confirmText });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  return { alertState, showAlert, hideAlert };
}

// ─── Styles ─────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  centerer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
    paddingBottom: 24,
  },
  stripe: {
    width: "100%",
    height: 6,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 4,
  },
  textBlock: {
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "rgba(22,16,26,0.55)",
    textAlign: "center",
    lineHeight: 21,
  },
  divider: {
    width: "88%",
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
  },
  button: {
    width: "88%",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});