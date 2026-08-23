// Powered by OnSpace.AI
// Chabad (Nusach Ari) siddur screen.
// List mode: the prayer of the current hour on top, then every relevant category.
// Reader mode: tap a category → only that category's text (pulled from Sefaria).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { CHABAD_SIDDUR, currentTefillahId, type SiddurCategory, type SiddurTag } from '@/constants/siddur/chabadSiddur';
import { fetchCategory, type SiddurSection } from '@/services/chabadSiddurService';
import { getLuachContext } from '@/services/luachContext';

export default function SiddurScreen() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(20);

  const ctx = useMemo(() => getLuachContext(new Date()), []);
  const nowId = useMemo(() => currentTefillahId(new Date()), []);

  // Which date-aware tags are active today.
  const activeTags = useMemo<Set<SiddurTag>>(() => {
    const s = new Set<SiddurTag>(['always']);
    if (ctx.isRoshChodesh) s.add('roshChodesh');
    if (ctx.isCholHamoed) s.add('cholHamoed');
    if (ctx.omerDay != null) s.add('omer');
    if (ctx.isChanukah) s.add('chanukah');
    if (ctx.isPurim) s.add('purim');
    return s;
  }, [ctx]);

  const visible = useMemo(
    () => CHABAD_SIDDUR.filter((c) => c.tags.some((t) => activeTags.has(t))),
    [activeTags],
  );

  const openCat = visible.find((c) => c.id === openId) ?? null;

  if (openCat) {
    return <CategoryReader category={openCat} fontSize={fontSize} setFontSize={setFontSize} onBack={() => setOpenId(null)} />;
  }

  // Prayer-of-the-hour card + the rest of the categories.
  const hourCat = visible.find((c) => c.id === nowId);
  const rest = visible.filter((c) => c.id !== nowId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>סידור חב״ד</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {hourCat && (
          <>
            <Text style={styles.sectionLabel}>תפילת השעה</Text>
            <CategoryRow category={hourCat} highlight onPress={() => setOpenId(hourCat.id)} />
          </>
        )}
        <Text style={styles.sectionLabel}>כל הקטגוריות</Text>
        {rest.map((c) => (
          <CategoryRow key={c.id} category={c} onPress={() => setOpenId(c.id)} />
        ))}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryRow({ category, highlight, onPress }: { category: SiddurCategory; highlight?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, highlight && styles.rowHighlight, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, highlight && styles.rowIconHi]}>
        <MaterialIcons name={category.icon as any} size={22} color={highlight ? Colors.background : Colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{category.title}</Text>
        {!!category.subtitle && <Text style={styles.rowSubtitle}>{category.subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-left" size={26} color={Colors.textSecondary} />
    </Pressable>
  );
}

function CategoryReader({
  category,
  fontSize,
  setFontSize,
  onBack,
}: {
  category: SiddurCategory;
  fontSize: number;
  setFontSize: (f: (n: number) => number) => void;
  onBack: () => void;
}) {
  const [sections, setSections] = useState<SiddurSection[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setSections(null);
    setError(false);
    fetchCategory(category)
      .then((s) => {
        if (!alive) return;
        if (s.length === 0) setError(true);
        else setSections(s);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [category]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>{category.title}</Text>
        <View style={styles.fontControls}>
          <Pressable onPress={() => setFontSize((f) => Math.max(14, f - 2))} hitSlop={8}>
            <MaterialIcons name="text-decrease" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setFontSize((f) => Math.min(34, f + 2))} hitSlop={8}>
            <MaterialIcons name="text-increase" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {sections === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>טוען את הטקסט…</Text>
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>לא ניתן לטעון את הטקסט.{'\n'}בדוק את חיבור האינטרנט ונסה שוב.</Text>
        </View>
      )}
      {sections && (
        <ScrollView contentContainerStyle={styles.readerContent} showsVerticalScrollIndicator={false}>
          {sections.map((sec, si) => (
            <View key={si}>
              <View style={styles.headingWrap}>
                <Text style={styles.heading}>{sec.heading}</Text>
              </View>
              {sec.lines.map((line, li) => (
                <Text key={li} style={[styles.text, { fontSize, lineHeight: fontSize * 1.85 }]}>
                  {line}
                </Text>
              ))}
            </View>
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  fontControls: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  listContent: { padding: Spacing.md },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'right',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowHighlight: { borderColor: Colors.primary, backgroundColor: Colors.surfaceElevated },
  rowPressed: { backgroundColor: Colors.surfaceElevated },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconHi: { backgroundColor: Colors.primary },
  rowText: { flex: 1 },
  rowTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold, textAlign: 'right' },
  rowSubtitle: { color: Colors.textSecondary, fontSize: FontSize.xs, textAlign: 'right', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  readerContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  headingWrap: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: Spacing.xs,
  },
  heading: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  text: {
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.md,
    writingDirection: 'rtl',
  },
});
