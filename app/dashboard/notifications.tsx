import { useEffect } from 'react';
import { router } from 'expo-router';

export default function NotificationsRedirect() {
  useEffect(() => {
    // Redirect to the new notifications page
    router.replace('/notifications');
  }, []);
  
  // Return null as this is just a redirect
  return null;
}
