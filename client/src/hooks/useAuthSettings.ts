import { useQuery } from '@tanstack/react-query';

export interface AuthSettings {
  facebook_login_enabled: boolean;
  google_login_enabled: boolean;
}

export function useAuthSettings() {
  const { data: settings, isLoading, error } = useQuery<AuthSettings>({
    queryKey: ['/api/auth/settings'],
    retry: false,
  });

  return {
    settings: settings || { facebook_login_enabled: false, google_login_enabled: true },
    isLoading,
    error,
  };
}