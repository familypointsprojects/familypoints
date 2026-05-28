import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { AppButton, AppCard, AppScreen, SectionTitle, StatusBadge } from '@/shared/ui';

const INVITE_TOKEN_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

const normalizeInviteToken = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const trimmedValue = rawValue?.trim() ?? '';
  const match = trimmedValue.match(INVITE_TOKEN_PATTERN);

  return match?.[0] ?? trimmedValue;
};

const ScanInviteScreen = () => {
  const { signInAsChild } = useAuth();
  const { token: tokenFromLink } = useLocalSearchParams<{ token?: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  const handleToken = async (token: string) => {
    const inviteToken = normalizeInviteToken(token);

    if (!inviteToken) return;

    setIsLoading(true);
    setError('');

    try {
      const session = await signInAsChild({ token: inviteToken });
      router.replace(session.role === 'child' ? '/child/dashboard' : '/parent/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неверная или устаревшая ссылка');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromLink) {
      handleToken(tokenFromLink);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromLink]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    const inviteToken = normalizeInviteToken(data);

    if (inviteToken) {
      handleToken(inviteToken);
    } else {
      setError('Неверный QR-код. Попросите родителя сгенерировать новый.');
    }
  };

  if (isLoading) {
    return (
      <AppScreen title="Вход" subtitle="Проверяем приглашение...">
        <AppCard>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E9E86" />
            <Text style={styles.meta}>Входим в профиль...</Text>
          </View>
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Войти как ребёнок" subtitle="Отсканируй QR-код или введи код приглашения">

      {Boolean(error) && (
        <AppCard>
          <StatusBadge label="Ошибка" tone="warning" />
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      )}

      <AppCard>
        <SectionTitle title="Сканировать QR" />
        {!permission?.granted ? (
          <AppButton title="Разрешить доступ к камере" onPress={requestPermission} />
        ) : scanning ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <AppButton title="Отмена" variant="secondary" onPress={() => setScanning(false)} />
          </View>
        ) : (
          <AppButton title="Открыть камеру" onPress={() => setScanning(true)} />
        )}
      </AppCard>

      <AppCard>
        <SectionTitle title="Код приглашения" />
        <TextInput
          style={styles.input}
          value={manualToken}
          onChangeText={setManualToken}
          placeholder="Вставьте код из ссылки"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#6B7B86"
        />
        <AppButton
          title="Войти"
          onPress={() => handleToken(manualToken)}
          disabled={manualToken.trim().length < 10}
        />
      </AppCard>

      <AppButton
        title="Назад"
        variant="ghost"
        onPress={() => router.back()}
      />
    </AppScreen>
  );
};

export default ScanInviteScreen;

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  meta: {
    color: '#6B7B86',
    fontSize: 14,
  },
  errorText: {
    color: '#E2483B',
    fontSize: 14,
    marginTop: 8,
  },
  cameraContainer: {
    gap: 12,
  },
  camera: {
    borderRadius: 12,
    height: 300,
    width: '100%',
  },
  input: {
    backgroundColor: '#FBF6EA',
    borderRadius: 8,
    color: '#12314A',
    fontSize: 14,
    marginBottom: 12,
    padding: 12,
  },
});
