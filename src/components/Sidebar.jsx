import React from 'react';
import styles from './Sidebar.module.css';
import { DAY_LABELS, EVENT_ICONS, EVENT_LABELS, HEATMAP_TYPES } from '../constants';

export default function Sidebar({
  matches,
  filters,
  onFiltersChange,
  selectedMatch,
  onSelectMatch,
  heatmapLayer,
  onHeatmapLayerChange,
  showPaths,
  onShowPathsChange,
  showBots,
  onShowBotsChange,
  showEvents,
  onShowEventsChange,
  matchData,
}) {
  const maps = ['All', 'AmbroseValley', 'GrandRift', 'Lockdown'];
  const days = ['All', 'February_10', 'February_11', 'February_12', 'February_13', 'February_14'];

  // Filter matches
  const filtered = React.useMemo(() => {
    if (!matches) return [];
    return matches.filter(m => {
      if (filters.map !== 'All' && m.map_id !== filters.map) return false;
      if (filters.date !== 'All' && m.date !== filters.date) return false;
      return true;
    });
  }, [matches, filters]);

  // Stats
  const stats = React.useMemo(() => {
    if (!matchData) return null;
    const players = Object.values(matchData.players || {});
    const humans = players.filter(p => !p.bot);
    const bots = players.filter(p => p.bot);
    const allEvents = players.flatMap(p => p.events || []);
    return {
      humans: humans.length,
      bots: bots.length,
      kills: allEvents.filter(e => e.e === 'Kill' || e.e === 'BotKill').length,
      deaths: allEvents.filter(e => e.e === 'Killed' || e.e === 'BotKilled').length,
      storm: allEvents.filter(e => e.e === 'KilledByStorm').length,
      loot: allEvents.filter(e => e.e === 'Loot').length,
      duration: matchData.duration,
    };
  }, [matchData]);

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬟</span>
          <div>
            <div className={styles.logoTitle}>LILA BLACK</div>
            <div className={styles.logoSub}>Journey Visualizer</div>
          </div>
        </div>
      </div>

      <div className={styles.scrollable}>
        {/* Filters */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Filters</h2>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Map</label>
            <select
              value={filters.map}
              onChange={e => onFiltersChange({ ...filters, map: e.target.value })}
            >
              {maps.map(m => (
                <option key={m} value={m}>{m === 'All' ? 'All Maps' : m.replace(/([A-Z])/g, ' $1').trim()}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Date</label>
            <select
              value={filters.date}
              onChange={e => onFiltersChange({ ...filters, date: e.target.value })}
            >
              {days.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Dates' : DAY_LABELS[d] || d}</option>
              ))}
            </select>
          </div>
          <div className={styles.matchCount}>
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
          </div>
        </section>

        {/* Match List */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Matches</h2>
          <div className={styles.matchList}>
            {filtered.slice(0, 200).map(m => (
              <button
                key={m.match_id}
                className={`${styles.matchItem} ${selectedMatch === m.match_id ? styles.selected : ''}`}
                onClick={() => onSelectMatch(m.match_id)}
              >
                <div className={styles.matchTop}>
                  <span className={styles.matchMap}>{m.map_id.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={styles.matchDate}>{DAY_LABELS[m.date] || m.date}</span>
                </div>
                <div className={styles.matchId}>{m.match_id.slice(0, 8)}…</div>
                <div className={styles.matchMeta}>{m.file_count} player{m.file_count !== 1 ? 's' : ''}</div>
              </button>
            ))}
            {filtered.length > 200 && (
              <div className={styles.truncated}>Showing 200 of {filtered.length}</div>
            )}
          </div>
        </section>

        {/* Match Stats */}
        {stats && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Match Stats</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statIcon} style={{ color: '#60a5fa' }}>👤</span>
                <span className={styles.statVal}>{stats.humans}</span>
                <span className={styles.statLabel}>Humans</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon} style={{ color: '#f59e0b' }}>🤖</span>
                <span className={styles.statVal}>{stats.bots}</span>
                <span className={styles.statLabel}>Bots</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon} style={{ color: '#f97316' }}>💀</span>
                <span className={styles.statVal}>{stats.kills}</span>
                <span className={styles.statLabel}>Kills</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon} style={{ color: '#ef4444' }}>☠️</span>
                <span className={styles.statVal}>{stats.deaths}</span>
                <span className={styles.statLabel}>Deaths</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon} style={{ color: '#a855f7' }}>⚡</span>
                <span className={styles.statVal}>{stats.storm}</span>
                <span className={styles.statLabel}>Storm</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon} style={{ color: '#22c55e' }}>📦</span>
                <span className={styles.statVal}>{stats.loot}</span>
                <span className={styles.statLabel}>Loot</span>
              </div>
            </div>
            <div className={styles.duration}>
              ⏱ {formatDuration(stats.duration)}
            </div>
          </section>
        )}

        {/* Display Options */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Display</h2>

          <div className={styles.toggleRow}>
            <span>Show Paths</span>
            <button
              className={`${styles.toggle} ${showPaths ? styles.on : ''}`}
              onClick={() => onShowPathsChange(!showPaths)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
          <div className={styles.toggleRow}>
            <span>Show Bots</span>
            <button
              className={`${styles.toggle} ${showBots ? styles.on : ''}`}
              onClick={() => onShowBotsChange(!showBots)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
          <div className={styles.toggleRow}>
            <span>Show Events</span>
            <button
              className={`${styles.toggle} ${showEvents ? styles.on : ''}`}
              onClick={() => onShowEventsChange(!showEvents)}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </section>

        {/* Heatmap Layer */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Heatmap</h2>
          <div className={styles.heatmapList}>
            <button
              className={`${styles.heatmapBtn} ${heatmapLayer === null ? styles.heatmapActive : ''}`}
              onClick={() => onHeatmapLayerChange(null)}
            >
              <span className={styles.heatmapDot} style={{ background: '#4a5268' }} />
              None
            </button>
            {HEATMAP_TYPES.map(h => (
              <button
                key={h.key}
                className={`${styles.heatmapBtn} ${heatmapLayer === h.key ? styles.heatmapActive : ''}`}
                onClick={() => onHeatmapLayerChange(h.key)}
              >
                <span className={styles.heatmapDot} style={{ background: h.color }} />
                {h.label}
              </button>
            ))}
          </div>
        </section>

        {/* Legend */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Legend</h2>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendLine} style={{ background: '#60a5fa' }} />
              Human Path
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendLine} style={{ background: '#f59e0b' }} />
              Bot Path
            </div>
            {Object.entries(EVENT_LABELS).map(([key, label]) => (
              <div key={key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: getEventColor(key) }} />
                {EVENT_ICONS[key]} {label}
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function formatDuration(ms) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec.toString().padStart(2, '0')}s`;
}

function getEventColor(event) {
  const colors = {
    Kill: '#f97316', BotKill: '#fb923c',
    Killed: '#ef4444', BotKilled: '#f87171',
    KilledByStorm: '#a855f7', Loot: '#22c55e',
  };
  return colors[event] || '#888';
}
