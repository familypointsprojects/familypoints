import { router } from 'expo-router';
import { useEffect } from 'react';

const ParentRedemptionsRedirect = () => {
  useEffect(() => {
    router.replace({ pathname: '/parent/rewards', params: { tab: 'requests' } });
  }, []);

  return null;
};

export default ParentRedemptionsRedirect;
