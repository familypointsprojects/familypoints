import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { getSupabaseClient } from '@/shared/services/supabase';
import { FP } from '@/constants/theme';

// Этот экран обрабатывает OAuth-редирект от Google (веб)
const AuthCallbackScreen = () => {
  useEffect(() => {
    const supabase = getSupabaseClient();
    let handled = false;

    const handleSession = async (userId: string, userMeta: Record<string, unknown>) => {
      if (handled) return;
      handled = true;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('id', userId)
        .single();

      if (!profile) {
        const name =
          (userMeta?.full_name as string) ??
          (userMeta?.name as string) ??
          (userMeta?.email as string)?.split('@')[0] ??
          'Parent';

        await supabase.from('profiles').upsert({ id: userId, name, role: 'parent' });
        router.replace('/onboarding');
      } else {
        router.replace(profile.role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
      }
    };

    // С detectSessionInUrl:true Supabase уже обработал хэш — просто читаем сессию
    // Слушаем onAuthStateChange на случай если сессия ещё не готова
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleSession(session.user.id, session.user.user_metadata);
      }
    });

    // Также проверяем сразу — сессия могла быть установлена до подписки
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        handleSession(data.session.user.id, data.session.user.user_metadata);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={FP.accent} />
    </View>
  );
};

export default AuthCallbackScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: FP.bg,
  },
});
