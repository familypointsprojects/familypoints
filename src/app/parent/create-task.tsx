import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/shared/i18n';
import { useFamilyPoints } from '@/shared/state';
import { AppButton, AppCard, AppScreen, AppTextInput, StatusBadge } from '@/shared/ui';

const CreateTaskScreen = () => {
  const { t } = useLanguage();
  const { createTask } = useFamilyPoints();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'warning'>('success');

  const isValid = title.trim().length > 0 && description.trim().length > 0 && Number(points) > 0;

  const handleSubmit = () => {
    if (!isValid) {
      setMessageTone('warning');
      setMessage(t('parent.createTask.invalid'));
      return;
    }

    setMessageTone('success');
    createTask({
      title: title.trim(),
      description: description.trim(),
      points: Number(points),
    });
    setMessage(t('parent.createTask.success', { title: title.trim() }));
    setTitle('');
    setDescription('');
    setPoints('');
  };

  return (
    <AppScreen title={t('parent.createTask.title')} subtitle={t('parent.createTask.subtitle')}>
      <AppCard>
        <AppTextInput
          label={t('common.title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('parent.createTask.titlePlaceholder')}
        />
        <AppTextInput
          label={t('common.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('parent.createTask.descriptionPlaceholder')}
          multiline
        />
        <AppTextInput
          label={t('common.points')}
          value={points}
          onChangeText={setPoints}
          placeholder={t('parent.createTask.pointsPlaceholder')}
          keyboardType="number-pad"
        />
        <AppButton title={t('parent.createTask.submit')} onPress={handleSubmit} />
      </AppCard>

      {Boolean(message) && (
        <View style={styles.message}>
          <StatusBadge
            label={messageTone === 'success' ? t('common.success') : t('common.checkForm')}
            tone={messageTone}
          />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
    </AppScreen>
  );
};

export default CreateTaskScreen;

const styles = StyleSheet.create({
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
