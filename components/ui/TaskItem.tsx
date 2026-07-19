// Powered by OnSpace.AI
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface TaskItemProps {
  emoji: string;
  title: string;
  checked: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
}

export function TaskItem({ emoji, title, checked, onToggle, onLongPress }: TaskItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, [checked]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress} hitSlop={4}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }, checked && styles.containerChecked]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.title, checked && styles.titleChecked]} numberOfLines={1}>
          {title}
        </Text>
        <Animated.View
          style={[
            styles.checkbox,
            checked && styles.checkboxChecked,
            {
              transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
            },
          ]}
        >
          {checked ? (
            <MaterialIcons name="check" size={16} color={Colors.background} />
          ) : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  containerChecked: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  emoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  title: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  titleChecked: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
