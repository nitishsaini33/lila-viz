import React, { useCallback } from 'react';
import styles from './Timeline.module.css';

export default function Timeline({
  duration,
  currentTime,
  playing,
  speed,
  onPlay,
  onStop,
  onReset,
  onSeek,
  onSpeedChange,
  matchData,
}) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleBarClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(frac * duration);
  }, [duration, onSeek]);

  const handleBarDrag = useCallback((e) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(frac * duration);
  }, [duration, onSeek]);

  const formatTime = (totalSeconds) => {
    const s = Math.floor(totalSeconds || 0);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Build event timeline markers
  const eventMarkers = React.useMemo(() => {
    if (!matchData || !duration) return [];
    const markers = [];
    for (const player of Object.values(matchData.players || {})) {
      for (const ev of player.events || []) {
        if (ev.e === 'Kill' || ev.e === 'Killed' || ev.e === 'KilledByStorm') {
          markers.push({ t: ev.t, type: ev.e });
        }
      }
    }
    return markers;
  }, [matchData, duration]);

  const markerColors = { Kill: '#f97316', Killed: '#ef4444', KilledByStorm: '#a855f7' };

  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div className={styles.timeline}>
      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.resetBtn}
          onClick={onReset}
          title="Reset"
        >
          ⟳
        </button>
        <button
          className={`${styles.playBtn} ${playing ? styles.playing : ''}`}
          onClick={playing ? onStop : onPlay}
          disabled={!duration}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div className={styles.timeDisplay}>
          <span className={styles.currentTime}>{formatTime(currentTime)}</span>
          <span className={styles.separator}>/</span>
          <span className={styles.totalTime}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Scrubber */}
      <div className={styles.scrubberWrap}>
        {/* Event markers on bar */}
        <div className={styles.markerLayer}>
          {eventMarkers.map((m, i) => (
            <div
              key={i}
              className={styles.marker}
              style={{
                left: `${(m.t / duration) * 100}%`,
                background: markerColors[m.type] || '#888',
              }}
              title={m.type}
            />
          ))}
        </div>

        <div
          className={styles.scrubber}
          onClick={handleBarClick}
          onMouseMove={handleBarDrag}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-label="Timeline scrubber"
        >
          <div className={styles.track} />
          <div className={styles.fill} style={{ width: `${progress}%` }} />
          <div
            className={styles.thumb}
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      {/* Speed controls */}
      <div className={styles.speedControls}>
        <span className={styles.speedLabel}>Speed</span>
        {speeds.map(s => (
          <button
            key={s}
            className={`${styles.speedBtn} ${speed === s ? styles.activeSpeed : ''}`}
            onClick={() => onSpeedChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
