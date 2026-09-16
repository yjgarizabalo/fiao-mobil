/**
 * Buscador de listas.
 *
 * Incluye el botón de limpiar (que en el v1 no existía: había que borrar
 * letra por letra) y no fuerza el foco al montar, para que abrir una lista no
 * abra el teclado de golpe.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { haptics } from '@/core/haptics';
import { theme } from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Buscar…',
  style,
}: SearchBarProps) => (
  <View style={[styles.container, style]}>
    <Ionicons name="search" size={18} color={theme.color.textSubtle} />

    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.color.textSubtle}
      style={styles.input}
      selectionColor={theme.color.brand}
      cursorColor={theme.color.brand}
      returnKeyType="search"
      autoCorrect={false}
      autoCapitalize="none"
      clearButtonMode="never"
      accessibilityLabel={placeholder}
      maxFontSizeMultiplier={1.2}
    />

    {value.length > 0 ? (
      <Pressable
        onPress={() => {
          haptics.select();
          onChangeText('');
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Limpiar búsqueda"
      >
        <Ionicons name="close-circle" size={18} color={theme.color.textSubtle} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 46,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surfaceSunken,
    paddingHorizontal: theme.spacing.lg,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.color.text,
    padding: 0,
  },
});
