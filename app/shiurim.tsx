// Vienna shiurim: the shiurfinder.at site inside the app, under the app's own
// header. Links that leave the site (maps, phone, WhatsApp) open outside.
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Fonts } from '@/constants/theme';
import { getCurrentLanguage } from '@/services/i18n';

const SITE = 'https://shiurfinder.at';

// Open the site in the app's language the first time (the site keeps the
// visitor's own choice in localStorage after that).
function languageScript(): string {
  const lang = getCurrentLanguage();
  const site = lang === 'en' || lang === 'de' ? lang : 'he';
  return `try{if(!localStorage.getItem('shiurim_wien_lang'))localStorage.setItem('shiurim_wien_lang','${site}')}catch(e){};true;`;
}

export default function ShiurimScreen() {
  const router = useRouter();
  const web = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8} accessibilityLabel="חזרה">
          <MaterialIcons name="arrow-forward" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.titleBox}>
          <Text style={styles.title}>שיעורים בווינה</Text>
          <Text style={styles.sub}>shiurfinder.at</Text>
        </View>
        <Pressable
          onPress={() => { setFailed(false); web.current?.reload(); }}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityLabel="רענון"
        >
          <MaterialIcons name="refresh" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {failed ? (
        <View style={styles.center}>
          <MaterialIcons name="wifi-off" size={40} color={Colors.textMuted} />
          <Text style={styles.msg}>לא ניתן לטעון את רשימת השיעורים.{'\n'}בדוק את החיבור לאינטרנט.</Text>
          <Pressable style={styles.retry} onPress={() => { setFailed(false); web.current?.reload(); }}>
            <Text style={styles.retryText}>נסה שנית</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            ref={web}
            source={{ uri: SITE }}
            injectedJavaScriptBeforeContentLoaded={languageScript()}
            style={{ flex: 1, backgroundColor: Colors.background }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setFailed(true); }}
            onShouldStartLoadWithRequest={(req) => {
              const url = req.url;
              if (url.startsWith(SITE) || url.startsWith('https://www.shiurfinder.at') || url === 'about:blank') return true;
              Linking.openURL(url).catch(() => {});
              return false;
            }}
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures
          />
          {loading ? (
            <View style={styles.loading} pointerEvents="none">
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : null}
        </View>
      )}
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
  titleBox: { flex: 1 },
  title: { fontSize: FontSize.lg, fontFamily: Fonts.serif, color: Colors.text, textAlign: 'right' },
  sub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  msg: { color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.md, lineHeight: 24 },
  retry: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: 12 },
  retryText: { color: Colors.background, fontFamily: Fonts.serifMedium, fontSize: FontSize.md },
});
