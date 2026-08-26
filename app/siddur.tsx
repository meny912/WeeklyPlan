// Powered by OnSpace.AI
// Siddur screen — supports two nuschaot:
//   nusach=chabad   → text fetched from Sefaria (chabadSiddurService)
//   nusach=sephardi → bundled local text (sephardiSiddur)
// List mode: prayer of the current hour on top, then every relevant category.
// Reader mode: tap a category → only that category's text.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { CHABAD_SIDDUR, currentTefillahId, type SiddurTag } from '@/constants/siddur/chabadSiddur';
import { SEPHARDI_SIDDUR, getSephardiCategory, type SiddurBlock } from '@/constants/siddur/sephardiSiddur';
import { fetchCategory } from '@/services/chabadSiddurService';
import { getLuachContext } from '@/services/luachContext';
import { buildRenderItems } from '@/constants/siddur/collapsible';

// Reading surface: white paper, black ink, green for the collapsible headers
// (passages not said in everyday solo prayer). Independent of the app theme.
const PAPER = '#FFFFFF';
const INK = '#1A1A1A';
const RUBRIC = '#5F5F5F';
const GREEN = '#1B7A3D';
const GREEN_BG = 'rgba(27,122,61,0.09)';

type Nusach = 'chabad' | 'sephardi';

interface CatMeta {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  time?: 'morning' | 'afternoon' | 'evening';
  tags: SiddurTag[];
}

export default function SiddurScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string; nusach?: string }>();
  const nusach: Nusach = params.nusach === 'sephardi' ? 'sephardi' : 'chabad';
  const [openId, setOpenId] = useState<string | null>(params.open ?? null);
  const [fontSize, setFontSize] = useState(20);

  const ctx = useMemo(() => getLuachContext(new Date()), []);
  const nowId = useMemo(() => currentTefillahId(new Date()), []);
  const catalog: CatMeta[] = nusach === 'sephardi' ? SEPHARDI_SIDDUR : CHABAD_SIDDUR;
  const title = nusach === 'sephardi' ? 'סידור ספרדי' : 'סידור חב״ד';

  const activeTags = useMemo<Set<SiddurTag>>(() => {
    const s = new Set<SiddurTag>(['always']);
    if (ctx.isRoshChodesh) s.add('roshChodesh');
    if (ctx.isCholHamoed) s.add('cholHamoed');
    if (ctx.omerDay != null) s.add('omer');
    if (ctx.isChanukah) s.add('chanukah');
    if (ctx.isPurim) s.add('purim');
    if (ctx.fast != null) s.add('fast');
    return s;
  }, [ctx]);

  const visible = useMemo(
    () => catalog.filter((c) => c.tags.some((t) => activeTags.has(t))),
    [catalog, activeTags],
  );

  const openCat = visible.find((c) => c.id === openId) ?? null;
  if (openCat) {
    return (
      <CategoryReader
        nusach={nusach}
        category={openCat}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onBack={() => setOpenId(null)}
      />
    );
  }

  const hourCat = visible.find((c) => c.id === nowId);
  const rest = visible.filter((c) => c.id !== nowId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
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

function CategoryRow({ category, highlight, onPress }: { category: CatMeta; highlight?: boolean; onPress: () => void }) {
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
  nusach,
  category,
  fontSize,
  setFontSize,
  onBack,
}: {
  nusach: Nusach;
  category: CatMeta;
  fontSize: number;
  setFontSize: (f: (n: number) => number) => void;
  onBack: () => void;
}) {
  const [blocks, setBlocks] = useState<SiddurBlock[] | null>(null);
  const [error, setError] = useState(false);
  // Which collapsible groups are open (all collapsed by default).
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    setBlocks(null);
    setError(false);
    if (nusach === 'sephardi') {
      const b = getSephardiCategory(category.id);
      if (b.length === 0) setError(true);
      else setBlocks(b);
      return;
    }
    // Chabad → Sefaria fetch, flattened into blocks
    fetchCategory(CHABAD_SIDDUR.find((c) => c.id === category.id)!)
      .then((sections) => {
        if (!alive) return;
        if (sections.length === 0) return setError(true);
        const b: SiddurBlock[] = [];
        for (const s of sections) {
          b.push({ k: 'h', t: s.heading });
          for (const line of s.lines) b.push({ k: 't', t: line });
        }
        setBlocks(b);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [nusach, category]);

  const items = useMemo(() => (blocks ? buildRenderItems(blocks) : []), [blocks]);

  const renderBlock = (b: SiddurBlock, key: React.Key) => {
    if (b.k === 'h') {
      return (
        <View key={key} style={rstyles.headingWrap}>
          <Text style={rstyles.heading}>{b.t}</Text>
        </View>
      );
    }
    if (b.k === 'i') {
      return (
        <Text key={key} style={rstyles.instruction}>
          {b.t}
        </Text>
      );
    }
    return (
      <Text key={key} style={[rstyles.text, { fontSize, lineHeight: fontSize * 1.85 }]}>
        {b.t}
      </Text>
    );
  };

  return (
    <SafeAreaView style={rstyles.safe} edges={['top']}>
      <View style={rstyles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-forward" size={26} color={INK} />
        </Pressable>
        <Text style={rstyles.title}>{category.title}</Text>
        <View style={styles.fontControls}>
          <Pressable onPress={() => setFontSize((f) => Math.max(14, f - 2))} hitSlop={8}>
            <MaterialIcons name="text-decrease" size={22} color={RUBRIC} />
          </Pressable>
          <Pressable onPress={() => setFontSize((f) => Math.min(34, f + 2))} hitSlop={8}>
            <MaterialIcons name="text-increase" size={22} color={RUBRIC} />
          </Pressable>
        </View>
      </View>

      {blocks === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={rstyles.loadingText}>טוען את הטקסט…</Text>
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={rstyles.errorText}>לא ניתן לטעון את הטקסט.{'\n'}נסה שוב מאוחר יותר.</Text>
        </View>
      )}
      {blocks && (
        <ScrollView style={rstyles.scroll} contentContainerStyle={rstyles.readerContent} showsVerticalScrollIndicator={false}>
          {items.map((it, idx) => {
            if (it.kind === 'group') {
              const open = !!expanded[it.id];
              return (
                <View key={it.id} style={rstyles.group}>
                  <Pressable
                    onPress={() => setExpanded((p) => ({ ...p, [it.id]: !p[it.id] }))}
                    style={({ pressed }) => [rstyles.groupHeader, pressed && { opacity: 0.7 }]}
                  >
                    <MaterialIcons name={open ? 'expand-more' : 'chevron-left'} size={22} color={GREEN} />
                    <Text style={rstyles.groupHeaderText}>{it.title}</Text>
                  </Pressable>
                  {open && <View style={rstyles.groupBody}>{it.blocks.map((b, k) => renderBlock(b, `${it.id}-${k}`))}</View>}
                </View>
              );
            }
            return renderBlock(it.block, it.kind === 'heading' ? `h-${idx}` : `b-${idx}`);
          })}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const rstyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },
  scroll: { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: PAPER,
  },
  title: { color: INK, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  loadingText: { color: RUBRIC, fontSize: FontSize.sm },
  errorText: { color: RUBRIC, fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  readerContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, backgroundColor: PAPER },
  headingWrap: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    paddingBottom: Spacing.xs,
  },
  heading: { color: INK, fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center', writingDirection: 'rtl' },
  instruction: { color: RUBRIC, fontSize: FontSize.sm, fontStyle: 'italic', textAlign: 'right', marginVertical: Spacing.xs, writingDirection: 'rtl' },
  text: { color: INK, textAlign: 'right', marginBottom: Spacing.md, writingDirection: 'rtl' },
  group: {
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: GREEN_BG,
  },
  groupHeaderText: { color: GREEN, fontSize: FontSize.md, fontWeight: FontWeight.bold, textAlign: 'right', flex: 1 },
  groupBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: PAPER },
});

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
