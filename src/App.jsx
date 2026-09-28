import React, { useState, useCallback, useMemo } from 'react';
import styles from './App.module.css';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import Timeline from './components/Timeline';
import { useDataFetch, usePlayback } from './hooks';

export default function App() {
  // Filters
  const [filters, setFilters] = useState({ map: 'All', date: 'All' });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [heatmapLayer, setHeatmapLayer] = useState(null);
  const [showPaths, setShowPaths] = useState(true);
  const [showBots, setShowBots] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Load match index
  const { data: matches, loading: matchesLoading } = useDataFetch('/data/matches.json');

  // Load selected match data
  const matchUrl = selectedMatch
    ? `/data/matches/${selectedMatch.replace('.', '_')}.json`
    : null;
  const { data: matchData, loading: matchLoading } = useDataFetch(matchUrl);

  // Determine current map
  const currentMapId = matchData?.map_id || (filters.map !== 'All' ? filters.map : null);

  // Load heatmap for current map
  const heatmapUrl = currentMapId ? `/data/heatmaps/${currentMapId}.json` : null;
  const { data: heatmapData } = useDataFetch(heatmapUrl);

  // Playback
  const duration = matchData?.duration || 0;
  const { currentTime, playing, speed, play, stop, reset, seek, setSpeed } = usePlayback(duration);

  // When match changes, reset player selection
  const handleSelectMatch = useCallback((matchId) => {
    setSelectedMatch(matchId);
    setSelectedPlayer(null);
  }, []);

  // Determine map to show (from selected match, or from filter)
  const effectiveMapId = useMemo(() => {
    if (matchData?.map_id) return matchData.map_id;
    if (filters.map !== 'All') return filters.map;
    return null;
  }, [matchData, filters.map]);

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <Sidebar
        matches={matches}
        filters={filters}
        onFiltersChange={setFilters}
        selectedMatch={selectedMatch}
        onSelectMatch={handleSelectMatch}
        heatmapLayer={heatmapLayer}
        onHeatmapLayerChange={setHeatmapLayer}
        showPaths={showPaths}
        onShowPathsChange={setShowPaths}
        showBots={showBots}
        onShowBotsChange={setShowBots}
        showEvents={showEvents}
        onShowEventsChange={setShowEvents}
        matchData={matchData}
      />

      {/* Main content */}
      <div className={styles.main}>
        {/* Loading bar */}
        {(matchesLoading || matchLoading) && (
          <div className={styles.loadingBar}>
            <div className={styles.loadingFill} />
          </div>
        )}

        {/* Map */}
        <MapCanvas
          mapId={effectiveMapId}
          matchData={matchData}
          heatmapData={heatmapData}
          heatmapLayer={heatmapLayer}
          currentTime={currentTime}
          showPaths={showPaths}
          showBots={showBots}
          showEvents={showEvents}
          selectedPlayer={selectedPlayer}
          onPlayerSelect={setSelectedPlayer}
        />

        {/* Timeline */}
        <Timeline
          duration={duration}
          currentTime={currentTime}
          playing={playing}
          speed={speed}
          onPlay={play}
          onStop={stop}
          onReset={reset}
          onSeek={seek}
          onSpeedChange={setSpeed}
          matchData={matchData}
        />
      </div>

      {/* Selected player info panel */}
      {selectedPlayer && matchData && matchData.players[selectedPlayer] && (
        <PlayerPanel
          userId={selectedPlayer}
          player={matchData.players[selectedPlayer]}
          onClose={() => setSelectedPlayer(null)}
          currentTime={currentTime}
        />
      )}
    </div>
  );
}

function PlayerPanel({ userId, player, onClose, currentTime }) {
  const isBot = player.bot;
  const events = player.events || [];
  const visibleEvents = events.filter(e => e.t <= currentTime);
  const positions = (player.pos || []).filter(p => p[2] <= currentTime);

  const killCount = visibleEvents.filter(e => e.e === 'Kill' || e.e === 'BotKill').length;
  const deathCount = visibleEvents.filter(e => e.e === 'Killed' || e.e === 'BotKilled' || e.e === 'KilledByStorm').length;
  const lootCount = visibleEvents.filter(e => e.e === 'Loot').length;

  const eventColors = {
    Kill: '#f97316', BotKill: '#fb923c',
    Killed: '#ef4444', BotKilled: '#f87171',
    KilledByStorm: '#a855f7', Loot: '#22c55e',
  };

  return (
    <div className={styles.playerPanel}>
      <div className={styles.playerPanelHeader}>
        <div>
          <div className={styles.playerType} style={{ color: isBot ? '#f59e0b' : '#60a5fa' }}>
            {isBot ? '🤖 Bot' : '👤 Human'}
          </div>
          <div className={styles.playerId}>{userId}</div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div className={styles.playerStats}>
        <div className={styles.pStat}><span style={{ color: '#f97316' }}>⚔️</span> {killCount} kills</div>
        <div className={styles.pStat}><span style={{ color: '#ef4444' }}>💀</span> {deathCount} deaths</div>
        <div className={styles.pStat}><span style={{ color: '#22c55e' }}>📦</span> {lootCount} loot</div>
        <div className={styles.pStat}><span style={{ color: '#60a5fa' }}>📍</span> {positions.length} pos</div>
      </div>
      <div className={styles.eventFeed}>
        {visibleEvents.slice(-8).reverse().map((ev, i) => (
          <div key={i} className={styles.feedItem} style={{ borderColor: eventColors[ev.e] || '#888' }}>
            <span style={{ color: eventColors[ev.e] || '#888' }}>{ev.e}</span>
            <span className={styles.feedTime}>{formatMs(ev.t)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMs(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}
