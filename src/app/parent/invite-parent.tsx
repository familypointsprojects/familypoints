import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAuth } from '@/shared/auth';
import { useFamilyPoints } from '@/shared/state';
import {
  buildParentInviteUrl,
  createParentInvite,
  revokeParentInvite,
} from '@/shared/services/supabase/parentInviteService';
import type { ParentInvite } from '@/shared/services/supabase/parentInviteService';
import { AppButton, AppCard, AppScreen, SectionTitle, StatusBadge } from '@/shared/ui';

const APP_NAME = 'easyQuest';

const InviteParentScreen = () => {
  const { session } = useAuth();
  const { activeFamilyId } = useFamilyPoints();
  const { hasFullPermissions: hasFullPermissionsParam } = useLocalSearchParams<{ hasFullPermissions?: string }>();
  const hasFullPermissions = hasFullPermissionsParam === 'true';

  const [invite, setInvite] = useState<ParentInvite | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInvite = async () => {
    if (!session?.profileId || !activeFamilyId) return;

    setIsLoading(true);
    setError('');

    try {
      const newInvite = await createParentInvite(activeFamilyId, session.profileId, hasFullPermissions);
      setInvite(newInvite);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateInvite();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    if (!invite) return;

    const url = buildParentInviteUrl(invite.token);
    const message = `Привет! Присоединяйся к нашей семье в ${APP_NAME} как родитель.\n\nОткрой ссылку на своём устройстве:\n${url}`;

    try {
      await Share.share({ message, url });
    } catch {
      Alert.alert('Ошибка', 'Не удалось поделиться ссылкой');
    }
  };

  const handleRevoke = async () => {
    if (!invite) return;

    Alert.alert(
      'Отозвать инвайт?',
      'Ссылка и QR-код перестанут работать. Можно создать новый.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отозвать',
          style: 'destructive',
          onPress: async () => {
            await revokeParentInvite(invite.id);
            setInvite(null);
          },
        },
      ],
    );
  };

  const handleRefresh = () => {
    setInvite(null);
    generateInvite();
  };

  const inviteUrl = invite ? buildParentInviteUrl(invite.token) : '';
  const expiresDate = invite ? new Date(invite.expiresAt).toLocaleDateString('ru-RU') : '';

  return (
    <AppScreen
      title="Пригласить родителя"
      subtitle="Поделитесь QR-кодом или ссылкой со вторым родителем"
    >
      {isLoading && (
        <AppCard>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E9E86" />
            <Text style={styles.meta}>Создаём инвайт...</Text>
          </View>
        </AppCard>
      )}

      {Boolean(error) && (
        <AppCard>
          <StatusBadge label="Ошибка" tone="warning" />
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Попробовать снова" onPress={handleRefresh} />
        </AppCard>
      )}

      {invite && !isLoading && (
        <>
          <AppCard>
            <SectionTitle title="QR-код" />
            <View style={styles.qrContainer}>
              <QRCode
                value={inviteUrl}
                size={220}
                color="#12314A"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.meta}>
              Действителен до {expiresDate} · Одноразовый
            </Text>
            <Text style={styles.meta}>
              Права: {hasFullPermissions ? '🔓 Полные' : '🔒 Только свои'}
            </Text>
          </AppCard>

          <AppCard>
            <SectionTitle title="Ссылка-приглашение" />
            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={2}>{inviteUrl}</Text>
            </View>
            <View style={styles.actions}>
              <AppButton title="Поделиться ссылкой" onPress={handleShare} />
              <AppButton
                title="Сгенерировать новый"
                variant="secondary"
                onPress={handleRefresh}
              />
              <AppButton
                title="Отозвать инвайт"
                variant="danger"
                onPress={handleRevoke}
              />
            </View>
          </AppCard>

          <AppCard>
            <SectionTitle title="Инструкция" />
            <Text style={styles.instruction}>
              1. Второй родитель скачивает {APP_NAME}{'\n'}
              2. Регистрируется или входит в аккаунт{'\n'}
              3. Нажимает "Войти по QR / ссылке"{'\n'}
              4. Сканирует QR-код или открывает ссылку{'\n'}
              5. Автоматически попадает в вашу семью
            </Text>
          </AppCard>
        </>
      )}
    </AppScreen>
  );
};

export default InviteParentScreen;

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  urlBox: {
    backgroundColor: '#FBF6EA',
    borderRadius: 8,
    padding: 12,
  },
  urlText: {
    color: '#12314A',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
  meta: {
    color: '#6B7B86',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    color: '#E2483B',
    fontSize: 14,
    marginVertical: 8,
  },
  instruction: {
    color: '#12314A',
    fontSize: 14,
    lineHeight: 24,
  },
});
