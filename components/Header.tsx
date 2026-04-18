import { Ionicons } from "@expo/vector-icons";
import { HStack, Image, Pressable } from "@gluestack-ui/themed";
import { router } from "expo-router";
import { Platform, StatusBar } from "react-native";
import { Colors } from "../constants/Colors";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function Header({
  title = "Fiao",
  showBack = false,
  onBackPress,
}: HeaderProps) {
  const statusBarHeight =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;

  return (
    <HStack
      alignItems="center"
      justifyContent={showBack ? "space-between" : "flex-start"}
      px="$4"
      bg="$white"
      borderBottomWidth={1}
      borderBottomColor="$borderLight200"
      height={60 + statusBarHeight}
      paddingTop={statusBarHeight}
    >
      {showBack ? (
        <>
          <Pressable onPress={onBackPress ?? (() => router.back())}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray600} />
          </Pressable>
          <Image
            source={require("../assets/images/icon.png")}
            alt="Fiao Icon"
            size="sm"
          />
        </>
      ) : (
        <Image
          source={require("../assets/images/icon.png")}
          alt="Fiao Icon"
          size="sm"
        />
      )}
    </HStack>
  );
}
