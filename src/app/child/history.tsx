import { router } from 'expo-router';
import { useEffect } from 'react';

const ChildHistoryRedirect = () => {
  useEffect(() => {
    router.replace('/child/balance');
  }, []);

  return null;
};

export default ChildHistoryRedirect;
