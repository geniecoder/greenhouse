import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemePalette } from '@/src/styles/colors';
import { layout, spacing } from '@/src/styles/view-styles';

export interface PhotoFabProps {
  colors: ThemePalette;
  pendingCount: number;
  bottomOffset: number;
  rightOffset?: number;
  onPress?: (e: GestureResponderEvent) => void;
}

export const PhotoFab = memo(function PhotoFab({
  colors,
  pendingCount,
  bottomOffset,
  rightOffset = spacing.lg,
  onPress,
}: PhotoFabProps) {
  return (
    <View pointerEvents="box-none" style={[styles.shell, { bottom: bottomOffset, right: rightOffset }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Capture plant photo"
        accessibilityHint={
          pendingCount > 0
            ? `${pendingCount} photos waiting to upload when online`
            : 'Opens camera or photo library to capture an inspection image'
        }
        hitSlop={10}
        onPress={onPress}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.92 : 1,
            elevation: pressed ? 3 : 8,
          },
        ]}
      >
        <Ionicons name="camera" size={26} color={colors.primaryForeground} />
        {pendingCount > 0 ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.badge, { borderColor: colors.card, backgroundColor: colors.warning }]}
          >
            <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: { position: 'absolute' },
  fab: {
    width: layout.minTouchTarget + 14,
    height: layout.minTouchTarget + 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#001004',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 24,
    minHeight: 24,
    paddingHorizontal: 5,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
