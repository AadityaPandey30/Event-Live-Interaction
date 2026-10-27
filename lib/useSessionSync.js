'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getRealtimeClient } from './supabaseBrowser';

const POLL_MS = 12000;

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const questionIndex = Number(raw.questionIndex);
  const unlockVersion = Number(raw.unlockVersion);
  if (!Number.isInteger(questionIndex) || questionIndex < 0) return null;
  if (!Number.isInteger(unlockVersion) || unlockVersion < 0) return null;
  return {
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : '',
    questionIndex,
    status: typeof raw.status === 'string' ? raw.status : 'live',
    unlockVersion,
    updatedAt: raw.updatedAt || null,
  };
}

/**
 * Keeps a participant screen in sync with the presenter.
 * - fetch on mount and on every reconnect/visibility change (refresh recovery)
 * - Supabase Realtime broadcast for instant updates
 * - interval polling as a fallback when realtime is unavailable
 * Version numbers guard against out-of-order deliveries.
 */
export function useSessionSync({ onUpdate } = {}) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [realtimeMode, setRealtimeMode] = useState('connecting');
  const versionRef = useRef(-1);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const apply = useCallback((incoming) => {
    const next = normalize(incoming);
    if (!next) return false;
    if (next.unlockVersion < versionRef.current) return false;
    versionRef.current = next.unlockVersion;
    setState(next);
    setError(null);
    onUpdateRef.current?.(next);
    return true;
  }, []);

  const fetchState = useCallback(
    async ({ signal } = {}) => {
      try {
        const response = await fetch('/api/session', { cache: 'no-store', signal });
        if (!response.ok) throw new Error(`Session state unavailable (${response.status})`);
        const data = await response.json();
        apply(data);
        setConnected(true);
        return data;
      } catch (err) {
        if (err.name === 'AbortError') return null;
        setError(err.message || 'Unable to reach the session.');
        setConnected(false);
        return null;
      }
    },
    [apply]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchState({ signal: controller.signal });

    const client = getRealtimeClient();
    let channel = null;

    if (!client) {
      setRealtimeMode('polling');
    } else {
      channel = client.channel('bhc-session', { config: { broadcast: { self: false } } });
      channel
        .on('broadcast', { event: 'session_state' }, (message) => apply(message?.payload))
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeMode('realtime');
            setConnected(true);
            // Resync after any gap - a missed broadcast is recovered here.
            fetchState();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setRealtimeMode('polling');
            fetchState();
          }
        });
    }

    const interval = setInterval(() => fetchState(), POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchState();
    };
    const onOnline = () => fetchState();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      if (channel) client.removeChannel(channel);
    };
  }, [apply, fetchState]);

  // Wake from a dropped connection even if the tab stayed visible.
  useEffect(() => {
    if (connected) return undefined;
    const retry = setInterval(() => fetchState(), 4000);
    return () => clearInterval(retry);
  }, [connected, fetchState]);

  return useMemo(
    () => ({ state, error, connected, realtimeMode, refresh: fetchState }),
    [state, error, connected, realtimeMode, fetchState]
  );
}
