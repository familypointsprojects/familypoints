import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { AppButton, AppCard, AppScreen, SectionTitle, StatusBadge } from '@/shared/ui';

const ScanInviteScreen = () => {
  const { signInAsChild } = useAuth();
  const { token: tokenFromLink } = useLocalSearchParams<{ token?: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  const handleToken = async (token: string) => {
    if (!token.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const session = await signInAsChild({ token: token.trim() });
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
    const match = data.match(/invite\/([a-f0-9-]{36})/);
    if (match) {
      handleToken(match[1]);
    } else {
      setError('Неверный QR-код. Попросите родителя сгенерировать новый.');
    }
  };

  if (isLoading) {
    return (
      <AppScreen title="Вход" subtitle="Проверяем приглашение...">
        <AppCard>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#58A4B0" />
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
          placeholderTextColor="#9BA8AE"
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
    color: '#5F6C72',
    fontSize: 14,
  },
  errorText: {
    color: '#C0392B',
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
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    color: '#1F2933',
    fontSize: 14,
    marginBottom: 12,
    padding: 12,
  },
});
