import { createAuthClient } from 'better-auth/client';
import { useEffect, useState } from 'react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001',
});

type Session = Awaited<ReturnType<typeof authClient.getSession>>['data'];

export function useSession() {
  const [session, setSession] = useState<Session>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      setSession(data);
      setIsPending(false);
    });
  }, []);

  return { data: session, isPending };
}
