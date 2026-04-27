import { useState, useEffect } from 'react';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos

export const useIdleTimeout = () => {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      setIsIdle((prevIdle) => {
        if (prevIdle) return false;
        return prevIdle;
      });
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimeout));
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, []);

  return isIdle;
};
