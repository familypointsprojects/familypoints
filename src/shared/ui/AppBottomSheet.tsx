import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Modal, StyleProp, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FP } from '@/constants/theme';

type AppBottomSheetProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onClose: () => void;
  visible: boolean;
};

export const AppBottomSheet = ({
  children,
  contentStyle,
  onClose,
  visible,
}: AppBottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetMethods>(null);
  const [isMounted, setIsMounted] = useState(visible);
  const maxDynamicContentSize = useMemo(() => height * 0.85, [height]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      sheetRef.current?.snapToIndex(0);
      return;
    }

    if (isMounted) {
      sheetRef.current?.close();
    }
  }, [isMounted, visible]);

  const requestClose = useCallback(() => {
    Keyboard.dismiss();
    sheetRef.current?.close();
  }, []);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setIsMounted(false);
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.35}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <Modal
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
      transparent
      visible={isMounted}>
      <GestureHandlerRootView style={styles.overlay}>
        <BottomSheet
          ref={sheetRef}
          backgroundStyle={styles.sheet}
          backdropComponent={renderBackdrop}
          enableDynamicSizing
          enablePanDownToClose
          handleIndicatorStyle={styles.handle}
          handleStyle={styles.handleRow}
          index={0}
          keyboardBlurBehavior="restore"
          maxDynamicContentSize={maxDynamicContentSize}
          onClose={handleClose}>
          <BottomSheetScrollView
            bounces={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, 16) },
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  sheet: {
    backgroundColor: FP.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleRow: {
    paddingBottom: 10,
    paddingTop: 12,
  },
  handle: {
    backgroundColor: '#D8E2EC',
    borderRadius: 3,
    height: 5,
    width: 46,
  },
  content: {
    gap: 13,
    paddingBottom: 8,
    paddingHorizontal: 18,
    paddingTop: 4,
  },
});
