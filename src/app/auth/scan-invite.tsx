import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/shared/auth';
import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import {
  savePendingParentInvite,
  validateParentInvite,
} from '@/shared/services/supabase/parentInviteService';
import { AppButton, AppCard, AppScreen, SectionTitle, StatusBadge } from '@/shared/ui';

const INVITE_TOKEN_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

const normalizeInviteToken = (value: string | string[] | undefined): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const trimmedValue = rawValue?.trim() ?? '';
  const match = trimmedValue.match(INVITE_TOKEN_PATTERN);

  return match?.[0] ?? trimmedValue;
};

const ScanInviteScreen = () => {
  const { t } = useLanguage();
  const { session, signInAsChild } = useAuth();
  const { reloadState } = useFamilyPoints();
  const { token: tokenFromLink, inviteType } = useLocalSearchParams<{ token?: string; inviteType?: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  const handleToken = async (token: string, type?: string) => {
    const inviteToken = normalizeInviteToken(token);

    if (!inviteToken) return;

    setIsLoading(true);
    setError('');

    try {
      if (type === 'parent') {
        if (!session?.profileId || session.role !== 'parent') {
          await savePendingParentInvite(inviteToken);
          router.replace({ pathname: '/auth/sign-in', params: { parentInvite: '1' } });
          return;
        }

        await validateParentInvite(inviteToken);
        await reloadState();
        router.replace('/parent/dashboard');
      } else {
        const session = await signInAsChild({ token: inviteToken });
        router.replace(session.role === 'child' ? '/child/dashboard' : '/parent/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.invalidInvite'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromLink) {
      handleToken(tokenFromLink, inviteType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromLink]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    const isParentInvite = data.includes('/invite/parent/');
    const inviteToken = normalizeInviteToken(data);

    if (inviteToken) {
      handleToken(inviteToken, isParentInvite ? 'parent' : 'child');
    } else {
      setError(t('auth.invalidQr'));
    }
  };

  if (isLoading) {
    return (
      <AppScreen title={t('auth.inviteTitle')} subtitle={t('auth.checkingInvite')}>
        <AppCard>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E9E86" />
            <Text style={styles.meta}>{t('auth.signingIntoProfile')}</Text>
          </View>
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen title={t('auth.inviteTitle')} subtitle={t('auth.inviteSubtitle')}>

      {Boolean(error) && (
        <AppCard>
          <StatusBadge label={t('common.error')} tone="warning" />
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      )}

      <AppCard>
        <SectionTitle title={t('auth.scanQr')} />
        {!permission?.granted ? (
          <AppButton title={t('auth.allowCamera')} onPress={requestPermission} />
        ) : scanning ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <AppButton title={t('common.cancel')} variant="secondary" onPress={() => setScanning(false)} />
          </View>
        ) : (
          <AppButton title={t('auth.openCamera')} onPress={() => setScanning(true)} />
        )}
      </AppCard>

      <AppCard>
        <SectionTitle title={t('auth.inviteCode')} />
        <TextInput
          style={styles.input}
          value={manualToken}
          onChangeText={setManualToken}
          placeholder={t('auth.inviteCodePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#6B7B86"
        />
        <AppButton
          title={t('auth.signIn')}
          onPress={() => handleToken(manualToken)}
          disabled={manualToken.trim().length < 10}
        />
        <AppButton
          title={t('auth.joinAsParent')}
          variant="secondary"
          onPress={() => handleToken(manualToken, 'parent')}
          disabled={manualToken.trim().length < 10}
        />
      </AppCard>

      <AppButton
        title={t('common.back')}
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
