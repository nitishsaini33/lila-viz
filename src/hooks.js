import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Load JSON data from /data/ folder with error handling
 */
export function useDataFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [url]);

  return { data, loading, error };
}

/**
 * Playback timer hook for timeline animation
 */
export function usePlayback(duration) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const stop = useCallback(() => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setCurrentTime(0);
  }, [stop]);

  const play = useCallback(() => {
    setPlaying(true);
  }, []);

  const seek = useCallback((t) => {
    setCurrentTime(Math.max(0, Math.min(t, duration)));
  }, [duration]);

  useEffect(() => {
    if (!playing || !duration) return;

    const tick = (timestamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setCurrentTime(prev => {
        const next = prev + delta * speed;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [playing, duration, speed]);

  // Reset when duration changes
  useEffect(() => {
    reset();
  }, [duration, reset]);

  return { currentTime, playing, speed, play, stop, reset, seek, setSpeed };
}
