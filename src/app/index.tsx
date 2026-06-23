import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { AppScreen, BalancePill, BrandLogo, StatusBadge } from '@/shared/ui';
import { OutlineText } from '@/shared/ui/OutlineText';
import { IconChest, IconMap } from '@/shared/ui/QuestIcons';
import { FP, gameText } from '@/constants/theme';

const mascotSource = require('@/assets/images/flat-pirate-mascot.png');

// ─── Bolt icon (section badge / accents) ─────────────────────────────────────
const Bolt = ({ size = 14 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path d="M18 4L10 18h8l-4 10 12-14h-8z" fill={FP.orange} strokeWidth={0} />
  </Svg>
);

// ─── Chunky 3D quest button (matches the "Старт!" pill on the quests page) ────
type QuestCtaTone = 'blue' | 'green';

const TONES: Record<QuestCtaTone, { bg: string; bottom: string }> = {
  blue: { bg: '#19B8F2', bottom: '#0E76A8' },
  green: { bg: '#35D638', bottom: '#1E9F24' },
};

const QuestCta = ({
  title,
  subtitle,
  icon,
  tone,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tone: QuestCtaTone;
  onPress: () => void;
}) => {
  const { bg, bottom } = TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.ctaPressed]}>
      <View
        style={[
          styles.cta,
          { backgroundColor: bg },
          Platform.select({
            ios: { shadowColor: '#061426', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.42, shadowRadius: 0 },
            android: { elevation: 5 },
            web: { boxShadow: `0 4px 0 ${bottom}` },
          }) as ViewStyle,
        ]}>
        <View pointerEvents="none" style={styles.ctaHighlight} />
        <View pointerEvents="none" style={[styles.ctaBottom, { backgroundColor: bottom }]} />
        <View style={styles.ctaRow}>
          {icon ? <View style={styles.ctaIcon}>{icon}</View> : null}
          <View style={styles.ctaCopy}>
            <OutlineText style={[styles.ctaTitle, gameText]}>{title}</OutlineText>
            {Boolean(subtitle) && <Text style={styles.ctaSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Quest flow step (Map → Баллы → Chest) ───────────────────────────────────
const FlowStep = ({
  label,
  icon,
  bg,
  badge,
}: {
  label: string;
  icon?: React.ReactNode;
  bg?: string;
  badge?: React.ReactNode;
}) => (
  <View style={styles.flowItem}>
    <View style={styles.flowBadgeSlot}>
      {badge ?? <View style={[styles.flowMedallion, { backgroundColor: bg }]}>{icon}</View>}
    </View>
    <OutlineText style={[styles.flowLabel, gameText]}>{label}</OutlineText>
  </View>
);

const WelcomeScreen = () => {
  const { t } = useLanguage();
  const { session } = useAuth();

  return (
    <AppScreen contentStyle={styles.content} showBackButton={false}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroLeftBorder} />
        <View style={styles.heroTop}>
          <View style={styles.heroLogoPlate}>
            <BrandLogo height={56} style={styles.heroLogo} />
          </View>
          <Image
            source={mascotSource}
            style={styles.heroMascot}
            contentFit="contain"
            accessibilityLabel="easyQuest pirate"
          />
        </View>
        <OutlineText style={[styles.heroTitle, gameText]}>{t('welcome.heroTitle')}</OutlineText>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
      </View>

      {/* ── Quest flow ── */}
      <View style={styles.flowCard}>
        <FlowStep icon={<IconMap size={26} />} label={t('welcome.flowQuests')} bg="#19B8F2" />
        <Text style={styles.flowChevron}>›</Text>
        <FlowStep badge={<BalancePill compact points={10} />} label={t('welcome.flowPoints')} />
        <Text style={styles.flowChevron}>›</Text>
        <FlowStep icon={<IconChest size={26} />} label={t('welcome.flowRewards')} bg="#35D638" />
      </View>

      {/* ── Start card ── */}
      <View style={styles.startCard}>
        <View style={styles.sectionRow}>
          <View style={styles.boltBadge}>
            <Bolt />
          </View>
          <OutlineText style={[styles.sectionTitle, gameText]}>{t('welcome.startTitle')}</OutlineText>
        </View>

        {session && (
          <View style={styles.sessionRow}>
            <StatusBadge label={t('auth.signedInAs', { name: session.name })} tone="success" />
            <Text style={styles.sessionText}>
              {session.role === 'parent' ? t('auth.roleParent') : t('auth.roleChild')}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <QuestCta
            tone="blue"
            title={t('welcome.parentAccount')}
            subtitle={t('welcome.parentAccountSub')}
            icon={<IconMap size={24} />}
            onPress={() => router.push('/auth/sign-in')}
          />
          <QuestCta
            tone="green"
            title={t('welcome.childInvite')}
            subtitle={t('welcome.childInviteSub')}
            icon={<IconChest size={24} />}
            onPress={() => router.push('/auth/scan-invite')}
          />
        </View>
      </View>
    </AppScreen>
  );
};

export default WelcomeScreen;

const HARD_SHADOW = Platform.select({
  ios: { shadowColor: '#061426', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.28, shadowRadius: 0 },
  android: { elevation: 5 },
  web: { boxShadow: '4px 4px 0 #061426' },
}) as ViewStyle;

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    backgroundColor: '#343A55',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    gap: 10,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    position: 'relative',
    ...HARD_SHADOW,
  },
  heroLeftBorder: {
    backgroundColor: '#19B8F2',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 5,
    zIndex: 2,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  heroLogoPlate: {
    alignItems: 'center',
    backgroundColor: FP.white,
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroLogo: {
    alignSelf: 'center',
  },
  heroMascot: {
    height: 116,
    width: 116,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  subtitle: {
    color: '#DDEBFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    maxWidth: 340,
    textAlign: 'center',
  },

  // ── Quest flow card ──
  flowCard: {
    alignItems: 'center',
    backgroundColor: '#30364F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    ...HARD_SHADOW,
  },
  flowItem: {
    alignItems: 'center',
    gap: 7,
    minWidth: 66,
  },
  flowBadgeSlot: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
  },
  flowMedallion: {
    alignItems: 'center',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    height: 46,
    justifyContent: 'center',
    transform: [{ skewX: '3deg' }],
    width: 46,
  },
  flowLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  flowChevron: {
    ...gameText,
    color: '#7C8AA8',
    fontSize: 20,
    marginBottom: 18,
  },

  // ── Start card ──
  startCard: {
    backgroundColor: '#30364F',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 4,
    gap: 14,
    padding: 16,
    ...HARD_SHADOW,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  boltBadge: {
    alignItems: 'center',
    backgroundColor: '#FFC400',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  sessionRow: {
    gap: 8,
  },
  sessionText: {
    color: '#C7D4E8',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },

  // ── Chunky 3D quest CTA ──
  ctaPressed: {
    opacity: 0.86,
    transform: [{ translateY: 2 }, { scale: 0.994 }],
  },
  cta: {
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    minHeight: 56,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: 'relative',
  },
  ctaHighlight: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    height: 3,
    left: 8,
    position: 'absolute',
    right: 10,
    top: 4,
    zIndex: 1,
  },
  ctaBottom: {
    bottom: 0,
    height: 5,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    zIndex: 2,
  },
  ctaIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: '#061426',
    borderRadius: 3,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    transform: [{ skewX: '3deg' }],
    width: 40,
  },
  ctaCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  ctaSubtitle: {
    color: '#04243E',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
});
