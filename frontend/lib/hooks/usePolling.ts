/**
 * Polling hook for real-time data updates
 */

import { useEffect, useRef, useState } from 'react';

interface UsePollingOptions {
  interval: number; // Polling interval in milliseconds
  enabled?: boolean; // Whether polling is enabled
  pauseOnBlur?: boolean; // Pause polling when tab is not visible
  onPoll?: () => void; // Callback on each poll
}

export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
): {
  isPolling: boolean;
  start: () => void;
  stop: () => void;
} {
  const { interval, enabled = true, pauseOnBlur = true, onPoll } = options;
  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const isVisibleRef = useRef(true);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Handle visibility change
  useEffect(() => {
    if (!pauseOnBlur) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseOnBlur]);

  // Polling logic
  useEffect(() => {
    if (!isPolling || (pauseOnBlur && !isVisibleRef.current)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial call
    const executePoll = async () => {
      try {
        await callbackRef.current();
        if (onPoll) {
          onPoll();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    executePoll();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current || !pauseOnBlur) {
        executePoll();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, interval, pauseOnBlur, onPoll]);

  const start = () => setIsPolling(true);
  const stop = () => setIsPolling(false);

  return {
    isPolling,
    start,
    stop,
  };
}
