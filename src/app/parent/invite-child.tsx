import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAuth } from '@/shared/auth';
import { createChildInvite, revokeChildInvite } from '@/shared/services/supabase/inviteService';
import type { ChildInvite } from '@/shared/services/supabase/inviteService';
import { AppButton, AppCard, AppScreen, SectionTitle, StatusBadge } from '@/shared/ui';

const APP_SCHEME = 'familypoints';
const APP_NAME = 'easyQuest';

const buildInviteUrl = (token: string) => `${APP_SCHEME}://invite/${token}`;

const InviteChildScreen = () => {
  const { session } = useAuth();
  const { childId, childName } = useLocalSearchParams<{ childId: string; childName: string }>();

  const [invite, setInvite] = useState<ChildInvite | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInvite = async () => {
    if (!session?.profileId || !childId) return;

    setIsLoading(true);
    setError('');

    try {
      const newInvite = await createChildInvite(childId, session.profileId);
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

    const url = buildInviteUrl(invite.token);
    const message = `Привет! Присоединяйся к нашей семье в ${APP_NAME}.\n\nОткрой ссылку на своём устройстве:\n${url}`;

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
            await revokeChildInvite(invite.id);
            setInvite(null);
            router.back();
          },
        },
      ],
    );
  };

  const handleRefresh = () => {
    setInvite(null);
    generateInvite();
  };

  const inviteUrl = invite ? buildInviteUrl(invite.token) : '';
  const expiresDate = invite ? new Date(invite.expiresAt).toLocaleDateString('ru-RU') : '';

  return (
    <AppScreen
      title={`Пригласить ${childName ?? 'ребёнка'}`}
      subtitle="Покажите QR-код или отправьте ссылку на устройство ребёнка">

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
            <Text style={styles.meta}>Действителен до {expiresDate} · Одноразовый</Text>
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
              1. Откройте {APP_NAME} на устройстве ребёнка{'\n'}
              2. Нажмите "Войти по QR / ссылке"{'\n'}
              3. Отсканируйте QR-код или откройте ссылку{'\n'}
              4. Ребёнок автоматически войдёт в свой профиль
            </Text>
          </AppCard>
        </>
      )}
    </AppScreen>
  );
};

export default InviteChildScreen;

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
    marginTop: 8,
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
