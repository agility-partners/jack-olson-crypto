"use client";

import styles from "./FlappyCrypto.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Obstacle {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
}

// Module-level constants — not recreated on every render
const GRAVITY = 0.35;
const FLAP_POWER = -6;
const OBSTACLE_WIDTH = 50;
const GAP_HEIGHT = 90;
const OBSTACLE_SPEED = 4;
const SPAWN_RATE = 60;
const BITCOIN_SIZE = 22;
const CANVAS_HEIGHT = 250;
const CANVAS_WIDTH = 800;

export default function FlappyCrypto() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const gameState = useRef({
    bitcoinY: 125,
    bitcoinVelocity: 0,
    obstacles: [] as Obstacle[],
    nextObstacleId: 0,
    frameCount: 0,
    currentScore: 0,
  });

  // Refs for values needed inside the rAF loop without stale closures
  const isPlayingRef = useRef(false);
  const topScoreRef = useRef(0);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { topScoreRef.current = topScore; }, [topScore]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load top score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("flappyCryptoTopScore");
    if (saved) {
      const val = parseInt(saved, 10);
      setTopScore(val);
      topScoreRef.current = val;
    }
  }, []);

  // Lock page scroll while modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isModalOpen]);

  // Draw a single frame onto the canvas
  const drawFrame = useCallback((gameOver: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = gameState.current;

    // Clear to transparent — CSS background of the canvas element shows through
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bitcoin emoji
    ctx.save();
    ctx.font = "24px serif";
    ctx.fillStyle = "#ffd700";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(255, 215, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.fillText("₿", 20, state.bitcoinY);
    ctx.restore();

    // Obstacles
    for (const obs of state.obstacles) {
      // Top bar (red)
      if (obs.gapY > 0) {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(obs.x, 0, OBSTACLE_WIDTH, obs.gapY);
      }
      // Bottom bar (green)
      const bottomY = obs.gapY + GAP_HEIGHT;
      if (bottomY < CANVAS_HEIGHT) {
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(obs.x, bottomY, OBSTACLE_WIDTH, CANVAS_HEIGHT - bottomY);
      }
    }

    // Game-over overlay
    if (gameOver) {
      ctx.save();
      ctx.fillStyle = "rgba(15, 36, 56, 0.85)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "#ef4444";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
      ctx.shadowBlur = 12;
      ctx.fillText("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.restore();
    }
  }, []);

  const endGame = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsGameOver(true);
    cancelAnimationFrame(rafRef.current);

    const finalScore = gameState.current.currentScore;
    if (finalScore > topScoreRef.current) {
      setTopScore(finalScore);
      topScoreRef.current = finalScore;
      localStorage.setItem("flappyCryptoTopScore", String(finalScore));
    }

    // Draw the final game-over frame synchronously
    drawFrame(true);
  }, [drawFrame]);

  // Handle space-bar input — uses ref so we don't need to re-register on every isPlaying change
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!isPlayingRef.current) return;
        gameState.current.bitcoinVelocity = FLAP_POWER;
      }
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, [isModalOpen]);

  // Game loop — requestAnimationFrame replaces setInterval; canvas replaces React DOM re-renders
  useEffect(() => {
    if (!isPlaying || !isModalOpen) return;

    const loop = () => {
      if (!isPlayingRef.current) return;

      const state = gameState.current;

      // Physics
      state.bitcoinVelocity += GRAVITY;
      state.bitcoinY += state.bitcoinVelocity;

      // Boundary death
      if (state.bitcoinY < 0 || state.bitcoinY + BITCOIN_SIZE > CANVAS_HEIGHT) {
        endGame();
        return;
      }

      // Spawn obstacles
      state.frameCount++;
      if (state.frameCount % SPAWN_RATE === 0) {
        const gapY = Math.random() * (CANVAS_HEIGHT - GAP_HEIGHT - 40) + 20;
        state.obstacles.push({
          id: state.nextObstacleId++,
          x: CANVAS_WIDTH,
          gapY,
          passed: false,
        });
      }

      // Move obstacles, detect collisions, score points
      state.obstacles = state.obstacles.filter((obs) => {
        obs.x -= OBSTACLE_SPEED;

        if (!obs.passed && obs.x + OBSTACLE_WIDTH < 20) {
          obs.passed = true;
          state.currentScore++;
          setScore(state.currentScore);
        }

        if (obs.x < 20 + BITCOIN_SIZE && obs.x + OBSTACLE_WIDTH > 20) {
          const bitcoinTop = state.bitcoinY;
          const bitcoinBottom = state.bitcoinY + BITCOIN_SIZE;
          if (bitcoinTop < obs.gapY || bitcoinBottom > obs.gapY + GAP_HEIGHT) {
            endGame();
            return false;
          }
        }

        return obs.x > -OBSTACLE_WIDTH;
      });

      // Draw once per frame — no React re-render needed
      drawFrame(false);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, isModalOpen, endGame, drawFrame]);

  const startGame = () => {
    gameState.current = {
      bitcoinY: 125,
      bitcoinVelocity: 0,
      obstacles: [],
      nextObstacleId: 0,
      frameCount: 0,
      currentScore: 0,
    };
    setScore(0);
    setIsGameOver(false);
    isPlayingRef.current = true;
    setIsPlaying(true);
  };

  const closeGame = () => {
    cancelAnimationFrame(rafRef.current);
    isPlayingRef.current = false;
    setIsModalOpen(false);
    setIsPlaying(false);
    setIsGameOver(false);
    setScore(0);
  };

  const openGame = () => {
    setIsModalOpen(true);
  };

  // Tap/click on canvas also flaps
  const handleCanvasInteract = () => {
    if (!isPlayingRef.current) return;
    gameState.current.bitcoinVelocity = FLAP_POWER;
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={closeGame} />

      {/* Modal */}
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={closeGame}>
          ✕
        </button>

        <div className={styles.gameContainer}>
          <div className={styles.gameHeader}>
            <div className={styles.scores}>
              <div className={styles.scoreItem}>
                <span className={styles.scoreLabel}>Score</span>
                <span className={styles.scoreValue}>{score}</span>
              </div>
              <div className={styles.scoreItem}>
                <span className={styles.scoreLabel}>Top</span>
                <span className={styles.scoreValue}>{topScore}</span>
              </div>
            </div>
            {!isPlaying && (
              <button className={styles.playBtn} onClick={startGame}>
                {isGameOver ? "Retry" : "Play"}
              </button>
            )}
          </div>

          {/* Canvas replaces the DOM-based game rendering */}
          <canvas
            ref={canvasRef}
            className={styles.gameCanvas}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasInteract}
          />

          <div className={styles.instructions}>Press SPACE or click/tap to flap</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button className={styles.miniGameBtn} onClick={openGame}>
        ₿ Play Mini Game
      </button>

      {isModalOpen && isMounted ? createPortal(modalContent, document.body) : null}
    </>
  );
}
