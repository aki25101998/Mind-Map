import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleDeepLinkUrl } from './authService';

export const useAuthDeepLink = (
  setIsLoading?: (loading: boolean) => void,
  setError?: (error: string | null) => void
) => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const processDeepLink = async (url: string) => {
      if (!url || !url.startsWith('com.yoogi.mindmap://')) return;
      try {
        if (setIsLoading) setIsLoading(true);
        if (setError) setError(null);
        const success = await handleDeepLinkUrl(url);
        if (success && isMounted) {
          navigate('/mindmaps');
        }
      } catch (err: unknown) {
        console.error('Deep link auth error:', err);
        const message = err instanceof Error ? err.message : 'Đăng nhập Google thất bại.';
        if (setError && isMounted) setError(message);
      } finally {
        if (setIsLoading && isMounted) setIsLoading(false);
      }
    };

    const win = window as unknown as {
      __pendingDeepLink?: string | null;
      handleDeepLink?: (url: string) => void;
      AndroidAuth?: { getPendingDeepLink?: () => string | null };
    };

    if (win.__pendingDeepLink) {
      const link = win.__pendingDeepLink;
      win.__pendingDeepLink = null;
      processDeepLink(link);
    }

    if (win.AndroidAuth?.getPendingDeepLink) {
      const link = win.AndroidAuth.getPendingDeepLink();
      if (link) {
        processDeepLink(link);
      }
    }

    const onDeepLink = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        processDeepLink(customEvent.detail);
      }
    };

    window.addEventListener('appDeepLink', onDeepLink);
    win.handleDeepLink = (url: string) => {
      processDeepLink(url);
    };

    return () => {
      isMounted = false;
      window.removeEventListener('appDeepLink', onDeepLink);
      delete win.handleDeepLink;
    };
  }, [navigate, setIsLoading, setError]);
};
