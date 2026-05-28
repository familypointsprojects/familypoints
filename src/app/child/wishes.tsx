import { router } from 'expo-router';
import { useEffect } from 'react';

const ChildWishesRedirect = () => {
  useEffect(() => {
    router.replace('/child/rewards');
  }, []);

  return null;
};

export default ChildWishesRedirect;
