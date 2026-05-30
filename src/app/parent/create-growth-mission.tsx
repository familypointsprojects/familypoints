import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useGrowthMissions } from '@/shared/state/GrowthMissionsProvider';
import { AppButton, AppCard, AppScreen, AppTextInput, StatusBadge } from '@/shared/ui';

const CreateGrowthMissionScreen = () => {
  const { t } = useLanguage();
  const { missionId } = useLocalSearchParams<{ missionId?: string }>();
  const { projects, createMission, updateMission } = useGrowthMissions();

  const isEdit = Boolean(missionId);
  const existing = isEdit ? projects.find((p) => p.id === missionId) : null;

  const [title,        setTitle]        = useState(existing?.title         ?? '');
  const [description,  setDescription]  = useState(existing?.description   ?? '');
  const [durationDays, setDurationDays] = useState(String(existing?.durationDays  ?? ''));
  const [bonusPercent, setBonusPercent] = useState(String(existing?.bonusPercent  ?? ''));
  const [minAmount,    setMinAmount]    = useState(String(existing?.minAmount     ?? ''));
  const [maxAmount,    setMaxAmount]    = useState(String(existing?.maxAmount     ?? ''));
  const [message,      setMessage]      = useState('');
  const [messageTone,  setMessageTone]  = useState<'success' | 'warning'>('success');
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setDurationDays(String(existing.durationDays));
      setBonusPercent(String(existing.bonusPercent));
      setMinAmount(String(existing.minAmount));
      setMaxAmount(String(existing.maxAmount));
    }
  }, [existing]);

  const parsedDays   = parseInt(durationDays,  10);
  const parsedBonus  = parseInt(bonusPercent,  10);
  const parsedMin    = parseInt(minAmount,     10);
  const parsedMax    = parseInt(maxAmount,     10);

  const isValid =
    title.trim().length > 0 &&
    parsedDays  > 0 &&
    parsedBonus >= 0 &&
    parsedMin   > 0 &&
    parsedMax  >= parsedMin;

  const handleSubmit = async () => {
    if (!isValid) {
      setMessageTone('warning');
      setMessage(t('missions.formInvalid'));
      return;
    }

    setLoading(true);
    try {
      if (isEdit && missionId) {
        await updateMission({
          id:           missionId,
          title:        title.trim(),
          description:  description.trim() || undefined,
          durationDays: parsedDays,
          bonusPercent: parsedBonus,
          minAmount:    parsedMin,
          maxAmount:    parsedMax,
        });
        setMessageTone('success');
        setMessage(t('missions.saveSuccess'));
      } else {
        await createMission({
          title:        title.trim(),
          description:  description.trim() || undefined,
          durationDays: parsedDays,
          bonusPercent: parsedBonus,
          minAmount:    parsedMin,
          maxAmount:    parsedMax,
        });
        setMessageTone('success');
        setMessage(t('missions.createSuccess') + ' (saved to DB)');
        // Reset form
        setTitle('');
        setDescription('');
        setDurationDays('');
        setBonusPercent('');
        setMinAmount('');
        setMaxAmount('');
      }
    } catch (e) {
      setMessageTone('warning');
      const errMsg = e instanceof Error ? e.message : String(e);
      setMessage('ERROR: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const screenTitle = isEdit ? t('missions.editTitle') : t('missions.createTitle');

  // Live payout preview
  const previewAmount  = parsedMin > 0 ? parsedMin : null;
  const previewPayout  =
    previewAmount && parsedBonus >= 0
      ? previewAmount + Math.floor((previewAmount * parsedBonus) / 100)
      : null;

  return (
    <AppScreen title={screenTitle}>
      <AppCard>
        <AppTextInput
          label={t('common.title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('missions.createTitle')}
        />
        <AppTextInput
          label={t('common.description')}
          value={description}
          onChangeText={setDescription}
          placeholder=""
          multiline
        />
        <AppTextInput
          label={t('missions.durationDays')}
          value={durationDays}
          onChangeText={setDurationDays}
          placeholder="7"
          keyboardType="number-pad"
        />
        <AppTextInput
          label={t('missions.bonusPercent')}
          value={bonusPercent}
          onChangeText={setBonusPercent}
          placeholder="10"
          keyboardType="number-pad"
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <AppTextInput
              label={t('missions.minAmount')}
              value={minAmount}
              onChangeText={setMinAmount}
              placeholder="50"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <AppTextInput
              label={t('missions.maxAmount')}
              value={maxAmount}
              onChangeText={setMaxAmount}
              placeholder="500"
              keyboardType="number-pad"
            />
          </View>
        </View>

        {previewPayout !== null && (
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              {t('missions.payoutLabel', {
                payout: String(previewPayout),
              })}
              {' '}({t('missions.durationDays').toLowerCase()}: {durationDays || '?'})
            </Text>
          </View>
        )}

        <AppButton
          title={loading ? t('common.saving') : (isEdit ? t('common.save') : t('missions.createTitle'))}
          onPress={handleSubmit}
        />
      </AppCard>

      {Boolean(message) && (
        <View style={styles.message}>
          <StatusBadge
            label={messageTone === 'success' ? t('common.success') : t('common.checkForm')}
            tone={messageTone}
          />
          <Text style={styles.messageText}>{message}</Text>
          {messageTone === 'success' && isEdit && (
            <AppButton
              title={t('common.back')}
              variant="secondary"
              onPress={() => router.back()}
            />
          )}
        </View>
      )}
    </AppScreen>
  );
};

export default CreateGrowthMissionScreen;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  preview: {
    backgroundColor: '#EDF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewText: {
    color: '#2B6CB0',
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE3CF',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  messageText: {
    color: '#12314A',
    fontSize: 14,
    lineHeight: 20,
  },
});
