// Vienna shiurim (from shiurfinder.at), read-only: pick a day, filter by
// language, tap a shiur for details, flyer and map.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Linking, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Fonts } from '@/constants/theme';
import { fetchShiurim, heLabel, Shiur, WEEKDAYS, SHIURFINDER_URL } from '@/services/shiurimService';

const DAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const LANGS = ['all', 'Hebrew', 'German', 'English', 'Russian'];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ShiurCard({ s, onPress }: { s: Shiur; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.timeBox}>
        <Text style={styles.time}>{s.time}</Text>
        {s.duration ? <Text style={styles.duration}>{s.duration.replace('min', 'דק׳')}</Text> : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{s.title || heLabel(s.topic)}</Text>
        {s.instructor ? <Text style={styles.instructor}>{s.instructor}</Text> : null}
        {s.synagogue ? <Text style={styles.place}>{s.synagogue.nameHe}</Text> : null}
        <View style={styles.tags}>
          {s.language ? <Text style={styles.tag}>{heLabel(s.language)}</Text> : null}
          {s.gender ? <Text style={styles.tag}>{heLabel(s.gender)}</Text> : null}
          {s.biweekly ? <Text style={styles.tag}>אחת לשבועיים</Text> : null}
        </View>
      </View>
      <MaterialIcons name="chevron-left" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

function Details({ s, onClose }: { s: Shiur; onClose: () => void }) {
  const address = [s.synagogue?.address, 'Wien'].filter(Boolean).join(', ');
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.xl }}>
          <Text style={styles.sheetTitle}>{s.title || heLabel(s.topic)}</Text>
          {s.instructor ? <Text style={styles.sheetLine}>{s.instructor}</Text> : null}
          <Text style={styles.sheetLine}>
            {s.days.map((d) => DAY_HE[WEEKDAYS.indexOf(d)] ?? d).join(', ')} · {s.time}
            {s.duration ? ` · ${s.duration.replace('min', 'דק׳')}` : ''}
          </Text>
          {s.synagogue ? <Text style={styles.sheetLine}>{s.synagogue.nameHe} · {s.synagogue.address}</Text> : null}
          {s.location ? <Text style={styles.sheetMuted}>{s.location}</Text> : null}
          <Text style={styles.sheetMuted}>
            {[heLabel(s.topic), heLabel(s.language), heLabel(s.gender)].filter(Boolean).join(' · ')}
          </Text>
          {s.description ? <Text style={styles.sheetDesc}>{s.description}</Text> : null}
          {s.flyerUrl ? (
            <Image source={{ uri: s.flyerUrl }} style={styles.flyer} resizeMode="contain" />
          ) : null}
          {s.synagogue?.address ? (
            <Pressable
              style={styles.mapBtn}
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)}
            >
              <MaterialIcons name="place" size={18} color={Colors.background} />
              <Text style={styles.mapText}>פתיחה במפה</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ShiurimScreen() {
  const router = useRouter();
  const [list, setList] = useState<Shiur[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);
  const [day, setDay] = useState(new Date().getDay());
  const [lang, setLang] = useState('all');
  const [open, setOpen] = useState<Shiur | null>(null);

  const load = useCallback(() => {
    setError(false);
    setList(null);
    fetchShiurim()
      .then((r) => { setList(r.list); setOffline(r.offline); })
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const shown = useMemo(
    () => (list ?? []).filter((s) => s.days.includes(WEEKDAYS[day]) && (lang === 'all' || s.language === lang)),
    [list, day, lang],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8} accessibilityLabel="חזרה">
          <MaterialIcons name="arrow-forward" size={22} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>שיעורים בווינה</Text>
          <Text style={styles.sub}>מתוך shiurfinder.at{offline ? ' · ללא חיבור, מוצגת הרשימה השמורה' : ''}</Text>
        </View>
        <Pressable onPress={load} style={styles.iconBtn} hitSlop={8} accessibilityLabel="רענון">
          <MaterialIcons name="refresh" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {DAY_HE.map((d, i) => (
          <Chip key={d} label={i === new Date().getDay() ? `${d} · היום` : d} active={day === i} onPress={() => setDay(i)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingTop: 0 }]}>
        {LANGS.map((l) => (
          <Chip key={l} label={l === 'all' ? 'כל השפות' : heLabel(l)} active={lang === l} onPress={() => setLang(l)} />
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.center}>
          <MaterialIcons name="wifi-off" size={40} color={Colors.textMuted} />
          <Text style={styles.msg}>לא ניתן לטעון את רשימת השיעורים.</Text>
          <Pressable style={styles.retry} onPress={load}><Text style={styles.retryText}>נסה שנית</Text></Pressable>
        </View>
      ) : list === null ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {shown.length === 0 ? (
            <Text style={styles.empty}>אין שיעורים ביום {DAY_HE[day]}{lang !== 'all' ? ` ב${heLabel(lang)}` : ''}.</Text>
          ) : shown.map((s) => <ShiurCard key={s.id} s={s} onPress={() => setOpen(s)} />)}
          <Pressable onPress={() => Linking.openURL(SHIURFINDER_URL)} style={styles.siteLink}>
            <Text style={styles.siteText}>לאתר shiurfinder.at</Text>
          </Pressable>
        </ScrollView>
      )}
      {open ? <Details s={open} onClose={() => setOpen(null)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  title: { fontSize: FontSize.lg, fontFamily: Fonts.serif, color: Colors.text, textAlign: 'right' },
  sub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  chips: { flexDirection: 'row-reverse', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.background, fontWeight: FontWeight.bold },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  timeBox: { alignItems: 'center', minWidth: 56 },
  time: { fontSize: FontSize.xl, fontFamily: Fonts.serif, color: Colors.primary },
  duration: { fontSize: 11, color: Colors.textMuted },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: FontSize.md, fontFamily: Fonts.serifMedium, color: Colors.text, textAlign: 'right' },
  instructor: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
  place: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  tags: { flexDirection: 'row-reverse', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tag: { fontSize: 11, color: Colors.primary, backgroundColor: Colors.primaryDim, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  msg: { color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.md },
  retry: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: 12 },
  retryText: { color: Colors.background, fontFamily: Fonts.serifMedium, fontSize: FontSize.md },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.md },
  siteLink: { alignSelf: 'center', marginTop: Spacing.lg, padding: Spacing.sm },
  siteText: { color: Colors.primary, fontSize: FontSize.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '80%', backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, borderTopWidth: 1, borderColor: Colors.border,
  },
  sheetTitle: { fontSize: FontSize.xl, fontFamily: Fonts.serif, color: Colors.text, textAlign: 'right' },
  sheetLine: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'right' },
  sheetMuted: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  sheetDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', lineHeight: 21 },
  flyer: { width: '100%', height: 360, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated },
  mapBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, marginTop: Spacing.sm,
  },
  mapText: { color: Colors.background, fontFamily: Fonts.serifMedium, fontSize: FontSize.md },
});
