"use client";

import styles from "./FlappyCrypto.module.css";
import { useEffect, useRef, useState } from "react";

interface Obstacle {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
}

export default function FlappyCrypto() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  const gameState = useRef({
    bitcoinY: 125,
    bitcoinVelocity: 0,
    obstacles: [] as Obstacle[],
    nextObstacleId: 0,
    gameOver: false,
    frameCount: 0,
  });

  const gameConstants = {
    gravity: 0.5,
    flapPower: -10,
    obstacleWidth: 50,
    gapHeight: 90,
    obstacleSpeed: 4,
    spawnRate: 80,
    bitcoinSize: 28,
    containerHeight: 250,
    containerWidth: 800,
  };

  // Load top score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("flappyCryptoTopScore");
    if (saved) setTopScore(parseInt(saved));
  }, []);

  // Handle space bar input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!isPlaying) return;
        gameState.current.bitcoinVelocity = gameConstants.flapPower;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const state = gameState.current;

      // Update bitcoin physics
      state.bitcoinVelocity += gameConstants.gravity;
      state.bitcoinY += state.bitcoinVelocity;

      // Boundary check (death)
      if (state.bitcoinY < 0 || state.bitcoinY + gameConstants.bitcoinSize > gameConstants.containerHeight) {
        endGame();
        return;
      }

      // Spawn obstacles
      state.frameCount++;
      if (state.frameCount % gameConstants.spawnRate === 0) {
        const gapY = Math.random() * (gameConstants.containerHeight - gameConstants.gapHeight - 40) + 20;
        state.obstacles.push({
          id: state.nextObstacleId++,
          x: gameConstants.containerWidth,
          gapY,
          passed: false,
        });
      }

      // Update obstacles
      state.obstacles = state.obstacles.filter((obs) => {
        obs.x -= gameConstants.obstacleSpeed;

        // Check if passed
        if (!obs.passed && obs.x + gameConstants.obstacleWidth < 20) {
          obs.passed = true;
          setScore((s) => s + 1);
        }

        // Collision detection
        if (obs.x < 20 + gameConstants.bitcoinSize && obs.x + gameConstants.obstacleWidth > 20) {
          const bitcoinTop = state.bitcoinY;
          const bitcoinBottom = state.bitcoinY + gameConstants.bitcoinSize;

          // Check if in safe gap
          if (bitcoinTop < obs.gapY || bitcoinBottom > obs.gapY + gameConstants.gapHeight) {
            endGame();
            return false;
          }
        }

        return obs.x > -gameConstants.obstacleWidth;
      });

      // Force re-render
      setFrameCount((f) => f + 1);
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const endGame = () => {
    setIsPlaying(false);
    gameState.current.gameOver = true;

    if (score > topScore) {
      setTopScore(score);
      localStorage.setItem("flappyCryptoTopScore", String(score));
    }
  };

  const startGame = () => {
    gameState.current = {
      bitcoinY: 125,
      bitcoinVelocity: 0,
      obstacles: [],
      nextObstacleId: 0,
      gameOver: false,
      frameCount: 0,
    };
    setScore(0);
    setIsPlaying(true);
  };

  return (
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
            {gameState.current.gameOver ? "Retry" : "Play"}
          </button>
        )}
      </div>

      <div className={styles.gameCanvas} ref={canvasRef}>
        {/* Bitcoin */}
        <div
          className={styles.bitcoin}
          style={{
            top: `${gameState.current.bitcoinY}px`,
          }}
        >
          ₿
        </div>

        {/* Obstacles */}
        {gameState.current.obstacles.map((obs) => (
          <div key={obs.id} className={styles.obstacleContainer} style={{ left: `${obs.x}px` }}>
            {/* Top obstacle (Red - Loser) */}
            {obs.gapY > 0 && (
              <div
                className={`${styles.obstacle} ${styles.red}`}
                style={{
                  height: `${obs.gapY}px`,
                }}
              >
                <svg viewBox="0 0 50 40" preserveAspectRatio="none">
                  <path
                    d="M0,20 Q5,10 10,20 T20,20 T30,20 T40,20 T50,20 L50,40 L0,40 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                </svg>
              </div>
            )}

            {/* Bottom obstacle (Green - Gainer) */}
            {obs.gapY + gameConstants.gapHeight < gameConstants.containerHeight && (
              <div
                className={`${styles.obstacle} ${styles.green}`}
                style={{
                  height: `${gameConstants.containerHeight - obs.gapY - gameConstants.gapHeight}px`,
                  marginTop: `${gameConstants.gapHeight}px`,
                }}
              >
                <svg viewBox="0 0 50 40" preserveAspectRatio="none">
                  <path
                    d="M0,20 Q5,30 10,20 T20,20 T30,20 T40,20 T50,20 L50,0 L0,0 Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Game Over overlay */}
        {gameState.current.gameOver && !isPlaying && (
          <div className={styles.gameOverOverlay}>
            <div className={styles.gameOverText}>Game Over</div>
          </div>
        )}
      </div>

      <div className={styles.instructions}>Press SPACE to flap</div>
    </div>
  );
}
