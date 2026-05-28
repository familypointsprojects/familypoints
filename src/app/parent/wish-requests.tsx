import { router } from 'expo-router';
import { useEffect } from 'react';

const ParentWishRequestsRedirect = () => {
  useEffect(() => {
    router.replace('/parent/rewards');
  }, []);

  return null;
};

export default ParentWishRequestsRedirect;
