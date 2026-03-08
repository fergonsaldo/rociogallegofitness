/**
 * Esta pantalla NO es de acceso público.
 * El registro de atletas lo inicia siempre el coach desde /(coach)/clients.
 * Este fichero existe solo para que Expo Router no rompa si alguien navega
 * directamente a /(auth)/register — redirige inmediatamente al login.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(auth)/login');
  }, []);
  return null;
}
