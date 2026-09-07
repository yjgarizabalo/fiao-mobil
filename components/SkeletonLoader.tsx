import { Colors } from '@/constants/Colors';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import { useEffect, useRef } from 'react';
import { Animated, useWindowDimensions } from 'react-native';

function SkeletonBox({ w, h, borderRadius = 8 }: { w: number; h: number; borderRadius?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ width: w, height: h, borderRadius, backgroundColor: Colors.gray200, opacity }}
    />
  );
}

export function ClientSkeletonList() {
  const { width } = useWindowDimensions();
  const inner = width - 32 - 32 - 44 - 12;

  return (
    <VStack space="sm" p="$4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Box key={i} bg="$white" borderRadius={14} borderWidth={1} borderColor="$borderLight100" px="$4" py="$3">
          <HStack alignItems="center" space="md">
            <SkeletonBox w={44} h={44} borderRadius={22} />
            <VStack flex={1} space="xs">
              <SkeletonBox w={inner * 0.6} h={14} />
              <SkeletonBox w={inner * 0.35} h={10} borderRadius={20} />
            </VStack>
            <SkeletonBox w={28} h={28} borderRadius={14} />
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

export function BusinessSkeletonList() {
  const { width } = useWindowDimensions();
  const inner = width - 32 - 32 - 44 - 12;

  return (
    <VStack space="md" p="$4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Box key={i} bg="$white" borderRadius={12} borderWidth={1} borderColor="$borderLight200" p="$4">
          <HStack alignItems="center" space="md">
            <SkeletonBox w={44} h={44} borderRadius={22} />
            <VStack flex={1} space="xs">
              <SkeletonBox w={inner * 0.55} h={14} />
              <SkeletonBox w={inner * 0.4} h={10} />
            </VStack>
            <SkeletonBox w={20} h={20} borderRadius={4} />
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}
