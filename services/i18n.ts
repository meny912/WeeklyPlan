// Powered by OnSpace.AI
// Global i18n service – Hebrew, English, German
// All UI strings are defined here. Use useTranslation() from SettingsContext
// in any component to get a reactive t() function that re-renders on language change.

export type Language = 'he' | 'en' | 'de';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'he', label: 'Hebrew',  nativeLabel: 'עברית',   flag: '🇮🇱' },
  { code: 'en', label: 'English', nativeLabel: 'English',  flag: '🇺🇸' },
  { code: 'de', label: 'German',  nativeLabel: 'Deutsch',  flag: '🇩🇪' },
];

export type TranslationKey = keyof typeof translations['he'];

const translations = {
  he: {
    // ── Days of the week (base names, used in chips/selectors) ──────────────
    day_full_sun: 'ראשון',
    day_full_mon: 'שני',
    day_full_tue: 'שלישי',
    day_full_wed: 'רביעי',
    day_full_thu: 'חמישי',
    day_full_fri: 'שישי',
    day_full_sat: 'שבת',
    /** Prefix before day name ("יום ראשון"). Empty string in en/de. */
    day_prefix: 'יום',

    // ── General ─────────────────────────────────────────────────────────────
    app_name: 'לוח לימוד',
    save: 'שמור',
    cancel: 'ביטול',
    delete: 'מחק',
    add: 'הוסף',
    ok: 'אישור',
    error: 'שגיאה',
    loading: 'טוען...',
    back: 'חזור',
    all: 'כולם',

    // ── Tab labels ───────────────────────────────────────────────────────────
    tab_today: 'היום',
    tab_calendar: 'לוח שנה',
    tab_manage: 'ניהול',
    tab_summary: 'סיכום',

    // ── Bottom nav labels ───────────────────────────────────────────────────
    nav_weekly: 'שבועי',
    nav_summary: 'סיכום',
    nav_tasks: 'משימות',
    nav_daily_study: 'לימוד יומי',
    nav_calendar: 'לוח חסידי',

    // ── DayCard component ────────────────────────────────────────────────────
    today_badge: 'היום',
    no_tasks_yet: 'אין משימות עדיין',

    // ── Weekly Planner (index.tsx) ───────────────────────────────────────────
    weekly_plan_title: 'תוכנית שבועית',
    week_label_prefix: 'שבוע',
    stat_completed: 'הושלמו',
    stat_remaining: 'נותרו',
    stat_total_tasks: 'סה"כ משימות',
    days_of_week_title: 'ימי השבוע',
    weekly_completion: 'השלמה שבועית',

    // ── Summary screen ───────────────────────────────────────────────────────
    summary_title: 'סיכום שבועי',
    summary_subtitle: 'מעקב ביצועים שבועי',
    this_week_tab: '📊 השבוע',
    history_tab_btn: '📅 היסטוריה',
    stat_done: 'הושלמו',
    stat_left: 'נותרו',
    stat_total: 'סה״כ',
    perfect_week: '🏆 שבוע מושלם!',
    section_done: 'הושלמו',
    section_pending: 'טרם הושלמו',
    no_tasks_this_week: 'אין משימות לשבוע זה',
    add_tasks_hint: 'הוסף משימות בלשונית הניהול',
    daily_breakdown: 'פירוט לפי יום',
    weeks_saved: 'שבועות שמורים',
    no_history_title: 'אין היסטוריה עדיין',
    no_history_desc: 'לאחר תום השבוע הנוכחי, הנתונים ייארכו כאן אוטומטית',
    show_task_list: 'הצג רשימת משימות ▼',
    hide_task_list: 'הסתר רשימת משימות ▲',
    day_completed_label: '✅ הושלמו',
    day_missed_label: '❌ הוחמצו',
    completed_tasks_his: '✅ הושלמו',
    missed_tasks_his: '❌ הוחמצו',
    tasks_count_label: 'משימות',

    // ── Chassidic Calendar ───────────────────────────────────────────────────
    calendar_title: 'לוח שנה חסידי',
    today_heb_title: 'היום בלוח העברי',
    upcoming_event: 'האירוע הקרוב',
    cal_filter_all: 'הכל',
    cal_filter_geula: 'גאולה',
    cal_filter_hilula: 'הסתלקות',
    cal_filter_birthday: 'יום הולדת',
    cal_filter_holiday: 'חג / מועד',
    today_cal: 'היום!',
    days_until_prefix: 'עוד',
    days_suffix: 'ימים',
    all_events_label: 'כל האירועים',

    // ── Today / Daily Learning ───────────────────────────────────────────────
    tab_learning: 'לימוד יומי',
    tab_zmanim: 'זמנים הלכתיים',
    daily_studies_title: 'שיעורים יומיים',
    daily_studies_sub: 'לחץ על ספר לקריאת הטקסט המלא',
    sefaria_credit: 'הטקסטים נטענים מ-Sefaria – ספרייה יהודית פתוחה',
    next_zman_label: 'הזמן הבא',
    loading_zmanim: 'טוען זמנים לפי מיקומך...',
    zmanim_error: 'לא ניתן לטעון זמנים. בדוק את חיבור האינטרנט.',
    retry_btn: 'נסה שנית',
    zmanim_source: 'מקור: Hebcal · זמנים משוערים לפי מיקום',
    location_prefix: 'מיקום: ',

    // Learning category subtitles / descriptions
    cat_hayomyom_sub: 'לקוטי דברים יומי',
    cat_hayomyom_desc: 'חכמת היום – הרבי מליובאוויטש',
    cat_tehillim_sub: 'פרקים יומיים לפי לוח החודש',
    cat_tehillim_desc: 'ספר תהלים – דוד המלך',
    cat_chumash_sub: 'פרשת השבוע – עליה יומית',
    cat_chumash_desc: 'חיתת – חומש יומי עם רש״י',
    cat_tanya_sub: 'שיעור יומי בתניא',
    cat_tanya_desc: 'ספר של בינוניים – אדמו״ר הזקן',
    cat_rambam_sub: '3 פרקים יומיים',
    cat_rambam_desc: 'משנה תורה – הרמב״ם',

    // ── Manage screen ────────────────────────────────────────────────────────
    manage_title: 'ניהול',
    tasks_tab: 'משימות',
    settings_tab: 'הגדרות',
    add_task_all: 'הוסף לכל הימים',
    add_task_day: 'הוסף ליום',
    task_name_placeholder: 'שם המשימה...',
    choose_icon: 'בחר אייקון',
    tasks_for_day: 'משימות',
    no_tasks: 'אין משימות ליום זה',
    tasks_overview: 'סיכום משימות לפי יום',
    delete_task_title: 'מחיקת משימה',
    delete_task_confirm: 'למחוק',
    from: 'מ',
    all_days: 'כל הימים',

    // ── Settings ─────────────────────────────────────────────────────────────
    settings_title: 'הגדרות',
    language_section: 'שפה',
    language_subtitle: 'בחר את שפת הממשק',
    region_section: 'אזור ומיקום',
    region_subtitle: 'משפיע על זמנים ופורמט',
    israel: 'ישראל',
    abroad: 'חוץ לארץ',
    reminders_section: 'תזכורות יומיות',
    reminders_subtitle: 'קבל תזכורת יומית ללימוד',
    reminder_enabled: 'הפעל תזכורת יומית',
    reminder_time: 'שעת תזכורת',
    reminder_hour: 'שעה',
    reminder_minute: 'דקה',
    about_section: 'אודות',
    app_version: 'גרסה',
    data_source: 'מקור הנתונים',
    data_source_val: 'Sefaria · Hebcal · Chabad.org',
    tanya_cycle: 'מחזור תניא',
    tanya_cycle_val: 'י״ט כסלו תשפ״ו – 365 יום',

    // Short day labels (legacy, used in some places)
    day_sun: 'ראשון',
    day_mon: 'שני',
    day_tue: 'שלישי',
    day_wed: 'רביעי',
    day_thu: 'חמישי',
    day_fri: 'שישי',
    day_sat: 'שבת',

    // ── Notifications ─────────────────────────────────────────────────────────
    notif_title: '📗 שיעור יומי',
    notif_body: 'הגיע הזמן ללמוד את השיעור היומי!',
    notif_permission_denied: 'נדרשת הרשאה להתראות',
    notif_scheduled: 'תזכורת נקבעה',
    notif_cancelled: 'תזכורת בוטלה',
  },

  en: {
    // ── Days of the week ──────────────────────────────────────────────────────
    day_full_sun: 'Sunday',
    day_full_mon: 'Monday',
    day_full_tue: 'Tuesday',
    day_full_wed: 'Wednesday',
    day_full_thu: 'Thursday',
    day_full_fri: 'Friday',
    day_full_sat: 'Saturday',
    day_prefix: '',

    // ── General ───────────────────────────────────────────────────────────────
    app_name: 'Study Planner',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    ok: 'OK',
    error: 'Error',
    loading: 'Loading...',
    back: 'Back',
    all: 'All',

    tab_today: 'Today',
    tab_calendar: 'Calendar',
    tab_manage: 'Manage',
    tab_summary: 'Summary',

    // ── Bottom nav labels ─────────────────────────────────────────────────────
    nav_weekly: 'Weekly',
    nav_summary: 'Summary',
    nav_tasks: 'Tasks',
    nav_daily_study: 'Daily Study',
    nav_calendar: 'Calendar',

    // ── DayCard ───────────────────────────────────────────────────────────────
    today_badge: 'Today',
    no_tasks_yet: 'No tasks yet',

    // ── Weekly Planner ────────────────────────────────────────────────────────
    weekly_plan_title: 'Weekly Planner',
    week_label_prefix: 'Week',
    stat_completed: 'Completed',
    stat_remaining: 'Remaining',
    stat_total_tasks: 'Total Tasks',
    days_of_week_title: 'Days of the Week',
    weekly_completion: 'Weekly Completion',

    // ── Summary ───────────────────────────────────────────────────────────────
    summary_title: 'Weekly Summary',
    summary_subtitle: 'Weekly Performance Tracking',
    this_week_tab: '📊 This Week',
    history_tab_btn: '📅 History',
    stat_done: 'Done',
    stat_left: 'Left',
    stat_total: 'Total',
    perfect_week: '🏆 Perfect week!',
    section_done: 'Completed',
    section_pending: 'Not yet done',
    no_tasks_this_week: 'No tasks this week',
    add_tasks_hint: 'Add tasks in the Manage tab',
    daily_breakdown: 'Daily Breakdown',
    weeks_saved: 'weeks saved',
    no_history_title: 'No history yet',
    no_history_desc: 'After the current week ends, data will be archived here automatically',
    show_task_list: 'Show task list ▼',
    hide_task_list: 'Hide task list ▲',
    day_completed_label: '✅ Completed',
    day_missed_label: '❌ Missed',
    completed_tasks_his: '✅ Completed',
    missed_tasks_his: '❌ Missed',
    tasks_count_label: 'tasks',

    // ── Calendar ──────────────────────────────────────────────────────────────
    calendar_title: 'Chassidic Calendar',
    today_heb_title: 'Today in Hebrew Calendar',
    upcoming_event: 'Upcoming Event',
    cal_filter_all: 'All',
    cal_filter_geula: 'Geula',
    cal_filter_hilula: 'Hilula',
    cal_filter_birthday: 'Birthday',
    cal_filter_holiday: 'Holiday',
    today_cal: 'Today!',
    days_until_prefix: 'In',
    days_suffix: 'days',
    all_events_label: 'All Events',

    // ── Today / Learning ──────────────────────────────────────────────────────
    tab_learning: 'Daily Study',
    tab_zmanim: 'Halachic Times',
    daily_studies_title: 'Daily Studies',
    daily_studies_sub: 'Tap a book to read the full text',
    sefaria_credit: 'Texts from Sefaria – Open Jewish Library',
    next_zman_label: 'Next Zman',
    loading_zmanim: 'Loading times for your location...',
    zmanim_error: 'Could not load times. Check your internet connection.',
    retry_btn: 'Retry',
    zmanim_source: 'Source: Hebcal · Approximate times by location',
    location_prefix: 'Location: ',

    cat_hayomyom_sub: 'Daily Insights',
    cat_hayomyom_desc: "Daily wisdom – the Lubavitcher Rebbe",
    cat_tehillim_sub: 'Daily chapters by monthly schedule',
    cat_tehillim_desc: 'Book of Psalms – King David',
    cat_chumash_sub: 'Weekly portion – daily aliya',
    cat_chumash_desc: 'Chitas – Daily Chumash with Rashi',
    cat_tanya_sub: 'Daily Tanya portion',
    cat_tanya_desc: 'Book of the Intermediates – the Alter Rebbe',
    cat_rambam_sub: '3 daily chapters',
    cat_rambam_desc: 'Mishneh Torah – Rambam',

    // ── Manage ────────────────────────────────────────────────────────────────
    manage_title: 'Manage',
    tasks_tab: 'Tasks',
    settings_tab: 'Settings',
    add_task_all: 'Add to all days',
    add_task_day: 'Add to day',
    task_name_placeholder: 'Task name...',
    choose_icon: 'Choose icon',
    tasks_for_day: 'tasks',
    no_tasks: 'No tasks for this day',
    tasks_overview: 'Tasks overview by day',
    delete_task_title: 'Delete Task',
    delete_task_confirm: 'Delete',
    from: 'from',
    all_days: 'All days',

    // ── Settings ──────────────────────────────────────────────────────────────
    settings_title: 'Settings',
    language_section: 'Language',
    language_subtitle: 'Select interface language',
    region_section: 'Region & Location',
    region_subtitle: 'Affects times and formatting',
    israel: 'Israel',
    abroad: 'Abroad',
    reminders_section: 'Daily Reminders',
    reminders_subtitle: 'Get a daily reminder to study',
    reminder_enabled: 'Enable daily reminder',
    reminder_time: 'Reminder time',
    reminder_hour: 'Hour',
    reminder_minute: 'Minute',
    about_section: 'About',
    app_version: 'Version',
    data_source: 'Data source',
    data_source_val: 'Sefaria · Hebcal · Chabad.org',
    tanya_cycle: 'Tanya cycle',
    tanya_cycle_val: '19 Kislev 5786 – 365 days',

    day_sun: 'Sun',
    day_mon: 'Mon',
    day_tue: 'Tue',
    day_wed: 'Wed',
    day_thu: 'Thu',
    day_fri: 'Fri',
    day_sat: 'Sat',

    notif_title: '📗 Daily Study',
    notif_body: "Time for today's daily study portion!",
    notif_permission_denied: 'Notification permission required',
    notif_scheduled: 'Reminder scheduled',
    notif_cancelled: 'Reminder cancelled',
  },

  de: {
    // ── Days of the week ──────────────────────────────────────────────────────
    day_full_sun: 'Sonntag',
    day_full_mon: 'Montag',
    day_full_tue: 'Dienstag',
    day_full_wed: 'Mittwoch',
    day_full_thu: 'Donnerstag',
    day_full_fri: 'Freitag',
    day_full_sat: 'Samstag',
    day_prefix: '',

    // ── General ───────────────────────────────────────────────────────────────
    app_name: 'Lernplaner',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    add: 'Hinzufügen',
    ok: 'OK',
    error: 'Fehler',
    loading: 'Lädt...',
    back: 'Zurück',
    all: 'Alle',

    tab_today: 'Heute',
    tab_calendar: 'Kalender',
    tab_manage: 'Verwalten',
    tab_summary: 'Zusammenfassung',

    // ── Bottom nav labels ─────────────────────────────────────────────────────
    nav_weekly: 'Wöchentlich',
    nav_summary: 'Zusammenfassung',
    nav_tasks: 'Aufgaben',
    nav_daily_study: 'Tägliches Lernen',
    nav_calendar: 'Kalender',

    // ── DayCard ───────────────────────────────────────────────────────────────
    today_badge: 'Heute',
    no_tasks_yet: 'Noch keine Aufgaben',

    // ── Weekly Planner ────────────────────────────────────────────────────────
    weekly_plan_title: 'Wochenplan',
    week_label_prefix: 'Woche',
    stat_completed: 'Erledigt',
    stat_remaining: 'Verbleibend',
    stat_total_tasks: 'Aufgaben gesamt',
    days_of_week_title: 'Wochentage',
    weekly_completion: 'Wochenziel',

    // ── Summary ───────────────────────────────────────────────────────────────
    summary_title: 'Wochenzusammenfassung',
    summary_subtitle: 'Wöchentliche Leistungsübersicht',
    this_week_tab: '📊 Diese Woche',
    history_tab_btn: '📅 Verlauf',
    stat_done: 'Erledigt',
    stat_left: 'Übrig',
    stat_total: 'Gesamt',
    perfect_week: '🏆 Perfekte Woche!',
    section_done: 'Erledigt',
    section_pending: 'Ausstehend',
    no_tasks_this_week: 'Keine Aufgaben diese Woche',
    add_tasks_hint: 'Im Verwalten-Tab Aufgaben hinzufügen',
    daily_breakdown: 'Tagesübersicht',
    weeks_saved: 'gespeicherte Wochen',
    no_history_title: 'Noch kein Verlauf',
    no_history_desc: 'Nach Ende der aktuellen Woche werden Daten hier automatisch archiviert',
    show_task_list: 'Aufgabenliste anzeigen ▼',
    hide_task_list: 'Aufgabenliste ausblenden ▲',
    day_completed_label: '✅ Erledigt',
    day_missed_label: '❌ Verpasst',
    completed_tasks_his: '✅ Erledigt',
    missed_tasks_his: '❌ Verpasst',
    tasks_count_label: 'Aufgaben',

    // ── Calendar ──────────────────────────────────────────────────────────────
    calendar_title: 'Chassidischer Kalender',
    today_heb_title: 'Heute im Hebräischen Kalender',
    upcoming_event: 'Nächstes Ereignis',
    cal_filter_all: 'Alle',
    cal_filter_geula: 'Geula',
    cal_filter_hilula: 'Hilula',
    cal_filter_birthday: 'Geburtstag',
    cal_filter_holiday: 'Feiertag',
    today_cal: 'Heute!',
    days_until_prefix: 'In',
    days_suffix: 'Tage',
    all_events_label: 'Alle Ereignisse',

    // ── Today / Learning ──────────────────────────────────────────────────────
    tab_learning: 'Tägliches Lernen',
    tab_zmanim: 'Halachische Zeiten',
    daily_studies_title: 'Tägliche Studien',
    daily_studies_sub: 'Tippe auf ein Buch zum vollständigen Lesen',
    sefaria_credit: 'Texte von Sefaria – Offene jüdische Bibliothek',
    next_zman_label: 'Nächste Zeit',
    loading_zmanim: 'Zeiten werden geladen...',
    zmanim_error: 'Zeiten konnten nicht geladen werden. Bitte Internetverbindung prüfen.',
    retry_btn: 'Nochmal versuchen',
    zmanim_source: 'Quelle: Hebcal · Näherungszeiten nach Standort',
    location_prefix: 'Standort: ',

    cat_hayomyom_sub: 'Tägliche Einblicke',
    cat_hayomyom_desc: 'Tagesweisheit – der Lubawitscher Rebbe',
    cat_tehillim_sub: 'Tägliche Kapitel nach Monatsplan',
    cat_tehillim_desc: 'Psalmen – König David',
    cat_chumash_sub: 'Wöchentlicher Abschnitt – tägliche Alija',
    cat_chumash_desc: 'Chitas – Täglicher Chumash mit Raschi',
    cat_tanya_sub: 'Täglicher Tanja-Abschnitt',
    cat_tanya_desc: 'Buch der Mittelmäßigen – der Alter Rebbe',
    cat_rambam_sub: '3 tägliche Kapitel',
    cat_rambam_desc: 'Mischne Tora – Rambam',

    // ── Manage ────────────────────────────────────────────────────────────────
    manage_title: 'Verwalten',
    tasks_tab: 'Aufgaben',
    settings_tab: 'Einstellungen',
    add_task_all: 'Zu allen Tagen hinzufügen',
    add_task_day: 'Zum Tag hinzufügen',
    task_name_placeholder: 'Aufgabenname...',
    choose_icon: 'Symbol wählen',
    tasks_for_day: 'Aufgaben',
    no_tasks: 'Keine Aufgaben für diesen Tag',
    tasks_overview: 'Aufgabenübersicht nach Tag',
    delete_task_title: 'Aufgabe löschen',
    delete_task_confirm: 'Löschen',
    from: 'von',
    all_days: 'Alle Tage',

    // ── Settings ──────────────────────────────────────────────────────────────
    settings_title: 'Einstellungen',
    language_section: 'Sprache',
    language_subtitle: 'Schnittstellensprache auswählen',
    region_section: 'Region & Standort',
    region_subtitle: 'Beeinflusst Zeiten und Formatierung',
    israel: 'Israel',
    abroad: 'Ausland',
    reminders_section: 'Tägliche Erinnerungen',
    reminders_subtitle: 'Tägliche Lern-Erinnerung erhalten',
    reminder_enabled: 'Tägliche Erinnerung aktivieren',
    reminder_time: 'Erinnerungszeit',
    reminder_hour: 'Stunde',
    reminder_minute: 'Minute',
    about_section: 'Über',
    app_version: 'Version',
    data_source: 'Datenquelle',
    data_source_val: 'Sefaria · Hebcal · Chabad.org',
    tanya_cycle: 'Tanja-Zyklus',
    tanya_cycle_val: '19. Kislev 5786 – 365 Tage',

    day_sun: 'So',
    day_mon: 'Mo',
    day_tue: 'Di',
    day_wed: 'Mi',
    day_thu: 'Do',
    day_fri: 'Fr',
    day_sat: 'Sa',

    notif_title: '📗 Tägliches Lernen',
    notif_body: 'Zeit für den täglichen Lernabschnitt!',
    notif_permission_denied: 'Benachrichtigungsberechtigung erforderlich',
    notif_scheduled: 'Erinnerung geplant',
    notif_cancelled: 'Erinnerung abgebrochen',
  },
} as const;

// ─── Runtime helpers ──────────────────────────────────────

let _currentLang: Language = 'he';

export function setLanguage(lang: Language): void {
  _currentLang = lang;
}

export function getCurrentLanguage(): Language {
  return _currentLang;
}

/** Translate a key. Pass `lang` explicitly for reactive usage via useTranslation(). */
export function t(key: TranslationKey, lang?: Language): string {
  const l = lang ?? _currentLang;
  const dict = translations[l] as Record<string, string>;
  return dict[key] ?? (translations['he'] as Record<string, string>)[key] ?? key;
}

/** RTL: Hebrew is RTL, English and German are LTR. */
export function isRTL(lang?: Language): boolean {
  return (lang ?? _currentLang) === 'he';
}

export default { t, setLanguage, getCurrentLanguage, isRTL, LANGUAGES };
