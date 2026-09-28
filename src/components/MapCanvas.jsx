import React, { useEffect, useRef, useCallback, useState } from 'react';
import styles from './MapCanvas.module.css';
import { EVENT_COLORS, MAP_IMAGES } from '../constants';

const CANVAS_SIZE = 1024;
const EVENT_RADIUS = { Kill: 7, BotKill: 6, Killed: 7, BotKilled: 6, KilledByStorm: 8, Loot: 5 };
const EVENT_SHAPE = { Kill: 'star', BotKill: 'diamond', Killed: 'cross', BotKilled: 'cross', KilledByStorm: 'lightning', Loot: 'circle' };

// Draw a star
function drawStar(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ir = (i * 4 * Math.PI) / 5 + (2 * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    else ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    ctx.lineTo(x + (r / 2) * Math.cos(ir), y + (r / 2) * Math.sin(ir));
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Draw X cross
function drawCross(ctx, x, y, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
  ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
  ctx.stroke();
  ctx.restore();
}

// Draw diamond
function drawDiamond(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Draw circle
function drawCircle(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawEvent(ctx, x, y, eventType) {
  const color = EVENT_COLORS[eventType] || '#fff';
  const r = EVENT_RADIUS[eventType] || 5;
  const shape = EVENT_SHAPE[eventType] || 'circle';
  if (shape === 'star') drawStar(ctx, x, y, r, color);
  else if (shape === 'cross') drawCross(ctx, x, y, r, color);
  else if (shape === 'diamond') drawDiamond(ctx, x, y, r, color);
  else drawCircle(ctx, x, y, r, color);
}

function drawHeatmap(ctx, points, color, maxVal) {
  if (!points || points.length === 0) return;
  const BUCKET = 16;
  const RADIUS = 22;

  // Parse color to RGBA
  let r = 255, g = 100, b = 50;
  const m = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (m) { r = parseInt(m[1], 16); g = parseInt(m[2], 16); b = parseInt(m[3], 16); }

  ctx.save();
  for (const [cx, cy, count] of points) {
    const intensity = Math.min(count / maxVal, 1);
    const alpha = intensity * 0.75;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, RADIUS);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export default function MapCanvas({
  mapId,
  matchData,
  heatmapData,
  heatmapLayer,
  currentTime,
  showPaths,
  showBots,
  showEvents,
  selectedPlayer,
  onPlayerSelect,
}) {
  const canvasRef = useRef(null);
  const mapImgRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(null);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const animFrameRef = useRef(null);

  // Load map image
  const mapSrc = MAP_IMAGES[mapId];
  useEffect(() => {
    if (!mapSrc) return;
    const img = new Image();
    img.src = mapSrc;
    img.onload = () => { mapImgRef.current = img; };
    mapImgRef.current = null;
  }, [mapSrc]);

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    if (!W || !H) return;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Map image
    if (mapImgRef.current) {
      ctx.drawImage(mapImgRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } else {
      ctx.fillStyle = '#1e2330';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#4a5268';
      ctx.font = '24px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(mapId || 'Loading...', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }

    // Heatmap overlay
    if (heatmapData && heatmapLayer && heatmapData[heatmapLayer]) {
      const pts = heatmapData[heatmapLayer];
      const maxVal = Math.max(...pts.map(p => p[2]), 1);
      const heatColors = {
        kills: '#f97316', deaths: '#ef4444', positions: '#6366f1',
        storm_deaths: '#a855f7', loot: '#22c55e',
      };
      drawHeatmap(ctx, pts, heatColors[heatmapLayer] || '#6366f1', maxVal);
    }

    // Player paths and events
    if (matchData) {
      const players = Object.entries(matchData.players || {});

      for (const [userId, player] of players) {
        if (player.bot && !showBots) continue;
        const isHuman = !player.bot;
        const color = isHuman ? '#60a5fa' : '#f59e0b';
        const isSelected = selectedPlayer === userId;
        const isHovered = hoveredPlayer === userId;

        // Draw path up to currentTime
        if (showPaths && player.pos && player.pos.length > 0) {
          const visiblePos = player.pos.filter(p => p[2] <= currentTime);

          // Calculate smoothly interpolated current position
          let currentPt = null;
          if (currentTime >= player.pos[0][2]) {
            const nextIdx = player.pos.findIndex(p => p[2] > currentTime);
            if (nextIdx === -1) {
              const last = player.pos[player.pos.length - 1];
              currentPt = [last[0], last[1]];
            } else if (nextIdx > 0) {
              const p0 = player.pos[nextIdx - 1];
              const p1 = player.pos[nextIdx];
              const span = p1[2] - p0[2];
              const frac = span > 0 ? (currentTime - p0[2]) / span : 0;
              currentPt = [
                p0[0] + (p1[0] - p0[0]) * frac,
                p0[1] + (p1[1] - p0[1]) * frac,
              ];
            }
          }

          if (visiblePos.length > 0 || currentPt) {
            ctx.save();
            ctx.strokeStyle = isSelected ? (isHuman ? '#93c5fd' : '#fcd34d') : color;
            ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;
            ctx.globalAlpha = isSelected ? 0.9 : isHovered ? 0.7 : 0.4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Dashed for bots
            if (!isHuman) ctx.setLineDash([4, 4]);

            ctx.beginPath();
            const startPt = visiblePos[0] || currentPt;
            ctx.moveTo(startPt[0], startPt[1]);
            for (let i = 1; i < visiblePos.length; i++) {
              ctx.lineTo(visiblePos[i][0], visiblePos[i][1]);
            }
            if (currentPt && visiblePos.length > 0) {
              ctx.lineTo(currentPt[0], currentPt[1]);
            }
            ctx.stroke();
            ctx.restore();
          }

          // Current position marker
          if (currentPt) {
            ctx.save();
            ctx.fillStyle = isSelected ? (isHuman ? '#93c5fd' : '#fcd34d') : color;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = isHovered || isSelected ? 1 : 0.8;
            ctx.beginPath();
            ctx.arc(currentPt[0], currentPt[1], isSelected ? 5 : 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw events up to currentTime
        if (showEvents && player.events) {
          const visibleEvents = player.events.filter(e => e.t <= currentTime);
          for (const ev of visibleEvents) {
            drawEvent(ctx, ev.x, ev.y, ev.e);
          }
        }
      }

      // Draw selected player on top
      if (selectedPlayer && matchData.players[selectedPlayer]) {
        const player = matchData.players[selectedPlayer];
        const isHuman = !player.bot;
        const color = isHuman ? '#93c5fd' : '#fcd34d';

        let selPt = null;
        if (player.pos && player.pos.length > 0 && currentTime >= player.pos[0][2]) {
          const nextIdx = player.pos.findIndex(p => p[2] > currentTime);
          if (nextIdx === -1) {
            const last = player.pos[player.pos.length - 1];
            selPt = [last[0], last[1]];
          } else if (nextIdx > 0) {
            const p0 = player.pos[nextIdx - 1];
            const p1 = player.pos[nextIdx];
            const span = p1[2] - p0[2];
            const frac = span > 0 ? (currentTime - p0[2]) / span : 0;
            selPt = [
              p0[0] + (p1[0] - p0[0]) * frac,
              p0[1] + (p1[1] - p0[1]) * frac,
            ];
          }
        }

        if (selPt) {
          // Pulsing ring
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(selPt[0], selPt[1], 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }, [matchData, heatmapData, heatmapLayer, currentTime, showPaths, showBots, showEvents, selectedPlayer, hoveredPlayer, scale, offset, mapId]);

  // Redraw on state change
  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [draw]);

  // Wheel to zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setScale(prev => {
      const newScale = Math.max(0.3, Math.min(8, prev * delta));
      const ratio = newScale / prev;
      setOffset(off => ({
        x: mx - (mx - off.x) * ratio,
        y: my - (my - off.y) * ratio,
      }));
      return newScale;
    });
  }, []);

  // Drag to pan
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && !e.altKey)) {
      dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
      setDragging(true);
    }
  }, [offset]);

  const handleMouseMove = useCallback((e) => {
    if (dragging && dragStartRef.current) {
      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }

    // Hover detection
    if (matchData && !dragging) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left - offset.x) / scale;
      const my = (e.clientY - rect.top - offset.y) / scale;

      let found = null;
      for (const [userId, player] of Object.entries(matchData.players || {})) {
        if (player.bot && !showBots) continue;
        let curPt = null;
        if (player.pos && player.pos.length > 0 && currentTime >= player.pos[0][2]) {
          const nextIdx = player.pos.findIndex(p => p[2] > currentTime);
          if (nextIdx === -1) {
            const last = player.pos[player.pos.length - 1];
            curPt = [last[0], last[1]];
          } else if (nextIdx > 0) {
            const p0 = player.pos[nextIdx - 1];
            const p1 = player.pos[nextIdx];
            const span = p1[2] - p0[2];
            const frac = span > 0 ? (currentTime - p0[2]) / span : 0;
            curPt = [
              p0[0] + (p1[0] - p0[0]) * frac,
              p0[1] + (p1[1] - p0[1]) * frac,
            ];
          }
        }
        if (curPt) {
          const dx = curPt[0] - mx, dy = curPt[1] - my;
          if (Math.sqrt(dx * dx + dy * dy) < 12 / scale) {
            found = userId;
            break;
          }
        }
      }
      setHoveredPlayer(found);
      if (found) {
        setTooltip({ x: e.clientX, y: e.clientY, userId: found, player: matchData.players[found] });
      } else {
        setTooltip(null);
      }
    }
  }, [dragging, matchData, currentTime, showBots, scale, offset]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    dragStartRef.current = null;
  }, []);

  const handleClick = useCallback((e) => {
    if (hoveredPlayer) {
      onPlayerSelect(hoveredPlayer === selectedPlayer ? null : hoveredPlayer);
    }
  }, [hoveredPlayer, selectedPlayer, onPlayerSelect]);

  const handleResetView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const s = Math.min(W, H) / CANVAS_SIZE * 0.95;
    setScale(s);
    setOffset({ x: (W - CANVAS_SIZE * s) / 2, y: (H - CANVAS_SIZE * s) / 2 });
  }, []);

  // Initial fit on mount and map change
  useEffect(() => {
    setTimeout(handleResetView, 100);
  }, [mapId, handleResetView]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: dragging ? 'grabbing' : hoveredPlayer ? 'pointer' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      {/* Controls overlay */}
      <div className={styles.controls}>
        <button className={styles.controlBtn} onClick={handleResetView} title="Reset view">
          ⊡
        </button>
        <button className={styles.controlBtn} onClick={() => setScale(s => Math.min(8, s * 1.3))} title="Zoom in">
          +
        </button>
        <button className={styles.controlBtn} onClick={() => setScale(s => Math.max(0.3, s * 0.77))} title="Zoom out">
          −
        </button>
      </div>

      {/* Map name */}
      {mapId && (
        <div className={styles.mapLabel}>
          {mapId.replace(/([A-Z])/g, ' $1').trim()}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}
        >
          <span style={{ color: tooltip.player.bot ? '#f59e0b' : '#60a5fa' }}>
            {tooltip.player.bot ? '🤖 Bot' : '👤 Human'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            {tooltip.userId.slice(0, 10)}…
          </span>
        </div>
      )}

      {/* Empty state */}
      {!matchData && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🗺️</div>
          <h3>Select a Match</h3>
          <p>Pick a match from the sidebar to visualize player journeys</p>
        </div>
      )}
    </div>
  );
}
