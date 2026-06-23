import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FP, gameText } from '@/constants/theme';

import { AppButton } from './AppButton';
import { AVATARS, AvatarId, DEFAULT_AVATAR_ID } from './AvatarHeads';
import { AvatarPicker } from './AvatarPicker';

/** Coerce any stored string into a known AvatarId, falling back to the default. */
const toAvatarId = (id?: string | null): AvatarId =>
  AVATARS.some((avatar) => avatar.id === id) ? (id as AvatarId) : DEFAULT_AVATAR_ID;

type AvatarPickerModalProps = {
  visible: boolean;
  currentId?: string | null;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  /** When true the dialog cannot be dismissed without picking (first launch). */
  mandatory?: boolean;
  onConfirm: (id: AvatarId) => void;
  onClose?: () => void;
};

/**
 * Centered avatar-selection dialog.
 * - First launch: pass `mandatory` so the child must choose before continuing.
 * - Settings: pass `onClose` to allow dismissing.
 */
export const AvatarPickerModal = ({
  visible,
  currentId,
  title = 'Выбери аватар',
  subtitle,
  confirmLabel = 'Готово',
  mandatory = false,
  onConfirm,
  onClose,
}: AvatarPickerModalProps) => {
  const [selected, setSelected] = useState<AvatarId>(toAvatarId(currentId));

  // Re-seed the temporary selection each time the dialog opens.
  useEffect(() => {
    if (visible) {
      setSelected(toAvatarId(currentId));
    }
  }, [visible, currentId]);

  const dismiss = mandatory ? undefined : onClose;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.backdrop} disabled={mandatory} onPress={dismiss}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.pickerWrap}>
            <AvatarPicker value={selected} onChange={setSelected} />
          </View>

          <AppButton
            title={confirmLabel}
            variant="primary"
            onPress={() => {
              onConfirm(selected);
              onClose?.();
            }}
          />
          {!mandatory && onClose ? (
            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Отмена</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7,18,38,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: FP.card,
    borderRadius: 28,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: FP.border,
  },
  title: {
    ...gameText,
    color: FP.ink,
    textShadowColor: 'transparent',
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    color: FP.textSub,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -6,
  },
  pickerWrap: { paddingVertical: 8 },
  cancel: { alignItems: 'center', paddingVertical: 6 },
  cancelText: { color: FP.textSub, fontWeight: '700', fontSize: 15 },
});
