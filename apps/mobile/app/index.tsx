import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to auth flow for first-time users
    router.replace('/auth');
  }, []);

  return null;
}
