// Powered by OnSpace.AI
// Weekday Shacharit — a date-aware siddur screen.
// Shows only the blocks relevant to today (tachanun / season / shir-shel-yom …),
// driven by services/luachContext.ts + constants/tefillot/shacharitChol.ts.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { shacharitChol } from '@/constants/tefillot/shacharitChol';
import type { Block } from '@/constants/tefillot/types';
import { getLuachContext, conditionVisible } from '@/services/luachContext';
import { getTodayHebrew, hebrewDayToGematria, hebrewMonthDisplay } from '@/services/hebrewCalendarService';

const WEEKDAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function ShacharitScreen() {
  const router = useRouter();
  const [fontSize, setFontSize] = useState(20);
  const [avelut, setAvelut] = useState(false);

  const ctx = useMemo(() => getLuachContext(new Date(), { avelut }), [avelut]);

  const visibleBlocks = useMemo(
    () =>
      shacharitChol.blocks.filter((b) => {
        if (b.cond === 'avelut') return avelut;
        return conditionVisible(b.cond, ctx, b.weekday);
      }),
    [ctx, avelut],
  );

  const hebrewDate = useMemo(() => {
    try {
      const { hdate } = getTodayHebrew();
      return `${hebrewDayToGematria(hdate.getDate())} ${hebrewMonthDisplay(hdate.getMonth())}`;
    } catch {
      return '';
    }
  }, []);

  // Active-condition chips so the user understands what is/isn't shown today.
  const chips = useMemo(() => {
    const c: string[] = [`יום ${WEEKDAY_HE[ctx.weekday]}`];
    c.push(ctx.tachanun ? 'תחנון' : 'ללא תחנון');
    c.push(ctx.season === 'geshem' ? 'מוריד הגשם' : 'מוריד הטל');
    c.push(ctx.rain === 'barechAleinu' ? 'ותן טל ומטר' : 'ותן ברכה');
    if (ctx.isRoshChodesh) c.push('ראש חודש');
    if (ctx.isCholHamoed) c.push('חול המועד');
    if (ctx.fast) c.push('תענית');
    return c;
  }, [ctx]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={26} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{shacharitChol.title}</Text>
          {!!hebrewDate && <Text style={styles.subtitle}>{hebrewDate}</Text>}
        </View>
        <View style={styles.fontControls}>
          <Pressable onPress={() => setFontSize((f) => Math.max(14, f - 2))} hitSlop={8}>
            <MaterialIcons name="text-decrease" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setFontSize((f) => Math.min(34, f + 2))} hitSlop={8}>
            <MaterialIcons name="text-increase" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Condition chips */}
      <View style={styles.chipsRow}>
        {chips.map((label) => (
          <View key={label} style={styles.chip}>
            <Text style={styles.chipText}>{label}</Text>
          </View>
        ))}
        <Pressable
          onPress={() => setAvelut((a) => !a)}
          style={[styles.chip, avelut && styles.chipActive]}
        >
          <Text style={[styles.chipText, avelut && styles.chipTextActive]}>בית האבל</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {visibleBlocks.map((b) => (
          <BlockView key={b.id} block={b} fontSize={fontSize} />
        ))}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BlockView({ block, fontSize }: { block: Block; fontSize: number }) {
  switch (block.kind) {
    case 'sectionTitle':
      return (
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>{block.he}</Text>
        </View>
      );
    case 'heading':
      return <Text style={styles.heading}>{block.he}</Text>;
    case 'instruction':
      return <Text style={styles.instruction}>{block.he}</Text>;
    case 'text':
    default:
      return (
        <Text style={[styles.text, { fontSize, lineHeight: fontSize * 1.85 }]}>{block.he}</Text>
      );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  subtitle: { color: Colors.primary, fontSize: FontSize.sm, marginTop: 2 },
  fontControls: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  sectionTitleWrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  heading: {
    color: Colors.primaryLight,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    writingDirection: 'rtl',
  },
  instruction: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    textAlign: 'right',
    marginVertical: Spacing.xs,
    writingDirection: 'rtl',
  },
  text: {
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.md,
    writingDirection: 'rtl',
  },
});
