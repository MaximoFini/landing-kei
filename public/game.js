/* ==========================================================================
   KEI RUNNER LOGISTICS MINIGAME
   ========================================================================== */

(function () {
  // Web Audio Context for synthesized sounds
  let audioCtx = null;

  // ==========================================
  // GAME ENGINE STATE VARIABLES
  // ==========================================
  let runnerActive = false;
  let runnerScore = 0;
  let runnerHighScore = 0;
  let runnerSpeed = 1.0;
  let runnerObstacles = [];
  let runnerCollectibles = [];
  let runnerAnimationId = null;
  let obstacleTimer = 0;
  let collectibleTimer = 0;
  let starsBackground = [];
  let lastTime = 0;

  // Particle System
  let particles = [];

  // Skyline Offset for Parallax Background
  let skylineOffset = 0;
  let wheelAngle = 0;

  // Physics refinements state
  let isJumpInputDown = false;
  let jumpHoldFrames = 0;
  let timeSinceOnGround = 0; // Coyote Time helper
  let lastJumpPressTime = 0; // Jump Buffering helper

  const groundY = 230;
  const player = {
    x: 60,
    y: 190,
    width: 44,
    height: 30,
    vy: 0,
    isJumping: false,
    jumpForce: -11.0, // Base jump impulse
    gravity: 0.55,
    symbol: '🚚'
  };

  // Rotating tips config
  const LOGISTICS_TIPS = [
    "Kei elimina el papeleo manual 📉",
    "La red colaborativa optimiza tus rutas ⚡",
    "Trazabilidad en tiempo real sin burocracia 📍",
    "Conductores de confianza a tu disposición 🚚",
    "Sin volúmenes mínimos ni contratos rígidos 📦",
    "Evitá cotizaciones manuales y lentas con Kei 💰",
    "Precios claros, transparentes y sin sorpresas 🏷️"
  ];
  let tipIdx = 0;
  let tipInterval = null;

  /**
   * Sound synthesizer using Web Audio API (No static audio assets required)
   */
  const playSound = (type) => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'jump') {
        // Quick upward triangle pitch sweep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.14);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'collect') {
        // Sweet double note arpeggio
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'crash') {
        // Rough rumble noise
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(25, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'gameover') {
        // Downward sweep buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  };

  /**
   * Loads the highscore from localStorage
   */
  const loadHighScore = () => {
    try {
      const stored = localStorage.getItem('kei_runner_highscore');
      runnerHighScore = stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      runnerHighScore = 0;
    }
    updateHighScoreDOM();
  };

  /**
   * Saves the highscore to localStorage
   */
  const saveHighScore = () => {
    if (runnerScore > runnerHighScore) {
      runnerHighScore = runnerScore;
      try {
        localStorage.setItem('kei_runner_highscore', runnerHighScore.toString());
      } catch (e) {}
      updateHighScoreDOM();
    }
  };

  /**
   * Updates all High Score elements in the UI
   */
  const updateHighScoreDOM = () => {
    const valHUD = document.getElementById('runner-highscore-val');
    if (valHUD) valHUD.textContent = runnerHighScore.toString();

    const valStart = document.querySelector('.runner-start-highscore');
    if (valStart) valStart.textContent = runnerHighScore.toString();

    const valOver = document.querySelector('.runner-gameover-highscore');
    if (valOver) valOver.textContent = runnerHighScore.toString();
  };

  /**
   * Draws Córdoba Skyline (Historical Landmarks) for Parallax background
   */
  const drawSkyline = (ctx, canvasWidth, groundY, isDark) => {
    skylineOffset -= runnerSpeed * 0.45;
    if (skylineOffset <= -580) skylineOffset = 0;

    ctx.fillStyle = isDark ? 'rgba(59, 98, 252, 0.08)' : 'rgba(23, 64, 182, 0.07)';

    for (let offset = skylineOffset; offset < canvasWidth + 580; offset += 580) {
      ctx.save();
      ctx.translate(offset, groundY);
      ctx.beginPath();

      // Catedral de Córdoba dome & towers
      ctx.moveTo(10, 0);
      ctx.lineTo(10, -30);
      ctx.lineTo(25, -30);
      // Left tower
      ctx.lineTo(25, -42);
      ctx.arc(28, -42, 3, Math.PI, 0);
      ctx.lineTo(31, -30);
      ctx.lineTo(31, -48); // Tower Spire
      ctx.lineTo(31, -30);
      ctx.lineTo(55, -30);
      // Main central Dome
      ctx.arc(68, -30, 13, Math.PI, 0);
      ctx.lineTo(81, -30);
      // Right tower
      ctx.lineTo(81, -42);
      ctx.arc(84, -42, 3, Math.PI, 0);
      ctx.lineTo(87, -30);
      ctx.lineTo(100, -30);
      ctx.lineTo(100, 0);

      // La Cañada Stone Arches
      ctx.moveTo(140, 0);
      ctx.lineTo(140, -15);
      ctx.arc(152, -15, 12, Math.PI, 0);
      ctx.lineTo(164, 0);
      ctx.moveTo(164, 0);
      ctx.lineTo(164, -15);
      ctx.arc(176, -15, 12, Math.PI, 0);
      ctx.lineTo(188, 0);
      ctx.moveTo(188, 0);
      ctx.lineTo(188, -15);
      ctx.arc(200, -15, 12, Math.PI, 0);
      ctx.lineTo(212, 0);

      // New Córdoba High Rise silhouettes
      ctx.moveTo(250, 0);
      ctx.lineTo(250, -48);
      ctx.lineTo(280, -48);
      ctx.lineTo(280, -25);
      ctx.lineTo(295, -25);
      ctx.lineTo(295, -60);
      ctx.lineTo(325, -60);
      ctx.lineTo(325, 0);

      // Obelisk/Pillar landmark
      ctx.moveTo(350, 0);
      ctx.lineTo(360, -42);
      ctx.lineTo(365, -42);
      ctx.lineTo(375, 0);

      // General domes
      ctx.moveTo(410, 0);
      ctx.lineTo(410, -20);
      ctx.arc(430, -20, 18, Math.PI, 0);
      ctx.lineTo(450, 0);

      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  /**
   * Draws a stylized rounded rect on canvas
   */
  const drawRoundedRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  /**
   * Vector Vehicle Drawing: stylized delivery truck with rotating wheel spokes
   */
  const drawTruck = (ctx, x, y, delta) => {
    ctx.save();
    ctx.translate(x, y);

    // 1. Cargo hold (Indigo branding block)
    ctx.fillStyle = '#1740B6';
    drawRoundedRect(ctx, 0, 0, 30, 20, 4);
    ctx.fill();

    // Cargo Hold Branding Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Kei', 15, 10);

    // 2. Cabin Connector
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(30, 9, 3, 7);

    // 3. Front Cabin (white/gray block)
    ctx.fillStyle = '#E5E7EB';
    drawRoundedRect(ctx, 33, 4, 11, 16, 2);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(38, 7, 5, 5);

    // Front Bumper
    ctx.fillStyle = '#111827';
    ctx.fillRect(41, 15, 3, 3);

    // 4. Wheel spokes & hubs
    ctx.fillStyle = '#1F2937';
    // Back wheel circle
    ctx.beginPath();
    ctx.arc(8, 22, 6, 0, Math.PI * 2);
    ctx.fill();
    // Front wheel circle
    ctx.beginPath();
    ctx.arc(35, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Animate spokes
    wheelAngle += runnerSpeed * 0.16 * delta;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    // Rear wheel spokes
    ctx.save();
    ctx.translate(8, 22);
    ctx.rotate(wheelAngle);
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
    ctx.moveTo(0, -5); ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();

    // Front wheel spokes
    ctx.save();
    ctx.translate(35, 22);
    ctx.rotate(wheelAngle);
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(5, 0);
    ctx.moveTo(0, -5); ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  };

  /**
   * Initializes background grid elements (parallax mid-layer stars/tech particles)
   */
  const initBackgroundGrid = () => {
    starsBackground = [];
    for (let i = 0; i < 20; i++) {
      starsBackground.push({
        x: Math.random() * 580,
        y: Math.random() * 150,
        speed: Math.random() * 0.9 + 0.3,
        size: Math.random() * 2 + 1
      });
    }
  };

  /**
   * Starts rotating tips inside footer bar
   */
  const startTipRotation = () => {
    const tipText = document.getElementById('runner-tip-text');
    if (!tipText) return;

    tipIdx = 0;
    tipText.textContent = LOGISTICS_TIPS[tipIdx];
    tipText.className = 'runner-tip-text';

    if (tipInterval) clearInterval(tipInterval);
    tipInterval = setInterval(() => {
      tipText.className = 'runner-tip-text slide-out';
      setTimeout(() => {
        tipIdx = (tipIdx + 1) % LOGISTICS_TIPS.length;
        tipText.textContent = LOGISTICS_TIPS[tipIdx];
        tipText.className = 'runner-tip-text slide-in';
        setTimeout(() => {
          tipText.className = 'runner-tip-text';
        }, 300);
      }, 300);
    }, 4000);
  };

  /**
   * Runner Core Game Loop
   */
  const updateRunner = (time) => {
    if (!runnerActive) return;

    const delta = lastTime ? (time - lastTime) / 16.66 : 1;
    lastTime = time;

    const canvas = document.getElementById('runner-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = false;

    // 1. Draw solid sky background
    ctx.fillStyle = isDark ? '#080A16' : '#F0F4FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Parallax Layer 1 (Skyline silhouette - Slow)
    drawSkyline(ctx, canvas.width, groundY, isDark);

    // 3. Parallax Layer 2 (Tech Particles - Mid)
    ctx.fillStyle = isDark ? 'rgba(59, 98, 252, 0.45)' : 'rgba(23, 64, 182, 0.3)';
    starsBackground.forEach(star => {
      star.x -= star.speed * runnerSpeed * delta;
      if (star.x < 0) {
        star.x = canvas.width;
        star.y = Math.random() * 150;
      }
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Parallax Layer 3 (Road grid - Fast)
    ctx.strokeStyle = isDark ? 'rgba(59, 98, 252, 0.25)' : 'rgba(23, 64, 182, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    // Tech horizontal lanes
    ctx.strokeStyle = isDark ? 'rgba(59, 98, 252, 0.12)' : 'rgba(23, 64, 182, 0.08)';
    ctx.lineWidth = 1;
    for (let r = groundY + 12; r < canvas.height; r += 12) {
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.lineTo(canvas.width, r);
      ctx.stroke();
    }

    // Street dashed lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([25, 25]);
    ctx.lineDashOffset = (time * 0.22 * runnerSpeed) % 50;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 18);
    ctx.lineTo(canvas.width, groundY + 18);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 5. Physics logic (Coyote time & Variable jumps & Buffers)
    if (!player.isJumping) {
      timeSinceOnGround = 0;
    } else {
      timeSinceOnGround += 16.66 * delta;
    }

    // Variable Lift Phase
    if (player.isJumping && isJumpInputDown && jumpHoldFrames < 15 && player.vy < 0) {
      player.vy -= 0.16 * delta; // Lift upwards
      jumpHoldFrames += 1 * delta;
    }

    // Apply gravity
    player.vy += player.gravity * delta;
    player.y += player.vy * delta;

    // Ground landing check
    if (player.y >= groundY - player.height - 2) {
      // Just landed
      if (player.vy > 0) {
        // Spawn expanding shockwave ring
        particles.push({
          type: 'shockwave',
          x: player.x + player.width / 2,
          y: groundY,
          radius: 4,
          alpha: 0.85
        });
      }
      player.y = groundY - player.height - 2;
      player.vy = 0;
      player.isJumping = false;
      jumpHoldFrames = 0;

      // Jump Buffering triggers instant bounce
      if (Date.now() - lastJumpPressTime <= 120) {
        triggerJump();
      }
    }

    // 6. Spawn Smoke / Dust particles
    // Exhaust smoke behind back wheel
    if (Math.random() < 0.2) {
      particles.push({
        type: 'smoke',
        x: player.x + 3,
        y: player.y + 18,
        vx: -(Math.random() * 2 + 1),
        vy: -(Math.random() * 0.5 + 0.1),
        size: Math.random() * 3 + 2.5,
        alpha: 0.5
      });
    }

    // Wheel dust while running
    if (!player.isJumping && Math.random() < 0.25) {
      particles.push({
        type: 'dust',
        x: player.x + 8 + Math.random() * 26,
        y: groundY - 2,
        vx: -(Math.random() * 3 + 1.5),
        vy: -(Math.random() * 1.2),
        size: Math.random() * 2.5 + 0.8,
        alpha: 0.45
      });
    }

    // 7. Draw Vector truck
    drawTruck(ctx, player.x, player.y, delta);

    // 8. Obstacles: Holographic floating boxes
    obstacleTimer += 16.66 * delta;
    const nextSpawnTime = Math.max(1000, 2300 - runnerSpeed * 280);
    if (obstacleTimer >= nextSpawnTime) {
      obstacleTimer = 0;
      const obstaclesList = [
        { symbol: '📊', type: 'excel' },
        { symbol: '📞', type: 'phone' },
        { symbol: '💬', type: 'whatsapp' },
        { symbol: '📍', type: 'address' },
        { symbol: '✍️', type: 'quote' },
        { symbol: '🏷️', type: 'pricing' }
      ];
      const selected = obstaclesList[Math.floor(Math.random() * obstaclesList.length)];
      runnerObstacles.push({
        x: canvas.width,
        y: groundY - 32,
        width: 28,
        height: 28,
        symbol: selected.symbol,
        type: selected.type
      });
    }

    // Draw & Update Obstacles
    for (let i = runnerObstacles.length - 1; i >= 0; i--) {
      const obs = runnerObstacles[i];
      obs.x -= runnerSpeed * 5.2 * delta;

      // Draw Holographic Card
      ctx.save();
      let borderGlow = '#EF4444'; // Red Wrong Address
      if (obs.type === 'excel') borderGlow = '#10B981'; // Green Excel
      else if (obs.type === 'phone') borderGlow = '#F97316'; // Orange Phone
      else if (obs.type === 'whatsapp') borderGlow = '#22C55E'; // WA chat bubble
      else if (obs.type === 'quote') borderGlow = '#8B5CF6'; // Purple Quote
      else if (obs.type === 'pricing') borderGlow = '#F59E0B'; // Amber Pricing

      ctx.shadowBlur = 8;
      ctx.shadowColor = borderGlow;
      ctx.strokeStyle = borderGlow;
      ctx.lineWidth = 2;
      ctx.fillStyle = isDark ? 'rgba(10, 12, 22, 0.8)' : 'rgba(255, 255, 255, 0.8)';
      
      drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obs.symbol, obs.x + obs.width / 2, obs.y + obs.height / 2);
      ctx.restore();

      // Box Collision Check
      if (
        player.x < obs.x + obs.width - 4 &&
        player.x + player.width - 4 > obs.x &&
        player.y < obs.y + obs.height - 4 &&
        player.y + player.height - 4 > obs.y
      ) {
        triggerRunnerGameOver();
        return;
      }

      // Cleanup
      if (obs.x < -35) {
        runnerObstacles.splice(i, 1);
        runnerScore += 10;
      }
    }

    // 9. Collectibles: Golden Package
    collectibleTimer += 16.66 * delta;
    if (collectibleTimer >= 3600) {
      collectibleTimer = 0;
      const airY = groundY - 75 - Math.random() * 40;
      runnerCollectibles.push({
        x: canvas.width,
        y: airY,
        width: 26,
        height: 26,
        symbol: '📦'
      });
    }

    // Draw & Update Collectibles
    for (let i = runnerCollectibles.length - 1; i >= 0; i--) {
      const col = runnerCollectibles[i];
      col.x -= runnerSpeed * 5.2 * delta;

      // Draw Golden holographic collectible
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38BDF8'; // Blue core glow
      ctx.strokeStyle = '#FBBF24'; // Golden border
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      
      drawRoundedRect(ctx, col.x, col.y, col.width, col.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.symbol, col.x + col.width / 2, col.y + col.height / 2);
      ctx.restore();

      // Collection Check
      if (
        player.x < col.x + col.width &&
        player.x + player.width > col.x &&
        player.y < col.y + col.height &&
        player.y + player.height > col.y
      ) {
        playSound('collect');
        runnerScore += 200;

        const rect = canvas.getBoundingClientRect();
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const cx = rect.left - containerRect.left + col.x + 13;
        const cy = rect.top - containerRect.top + col.y + 13;

        // Sparkle particles
        for (let s = 0; s < 12; s++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 40 + 20;
          particles.push({
            type: 'sparkle',
            x: cx,
            y: cy,
            vx: Math.cos(angle) * (dist / 10),
            vy: Math.sin(angle) * (dist / 10),
            size: Math.random() * 5 + 3,
            alpha: 0.8
          });
        }

        spawnScorePopup("+200 📦", cx, cy);

        runnerCollectibles.splice(i, 1);
        continue;
      }

      if (col.x < -30) {
        runnerCollectibles.splice(i, 1);
      }
    }

    // 10. Update Particles System
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;

      if (p.type === 'smoke') {
        p.size += 0.1 * delta;
        p.alpha -= 0.015 * delta;
        ctx.fillStyle = `rgba(156, 163, 175, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        p.alpha -= 0.02 * delta;
        ctx.fillStyle = isDark ? `rgba(59, 98, 252, ${p.alpha})` : `rgba(156, 163, 175, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sparkle') {
        p.alpha -= 0.025 * delta;
        ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'explosion') {
        p.alpha -= 0.018 * delta;
        p.size = Math.max(0.1, p.size - 0.05 * delta);
        ctx.fillStyle = p.color + `, ${p.alpha})`;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.type === 'shockwave') {
        p.radius += 2.2 * delta;
        p.alpha -= 0.035 * delta;
        ctx.strokeStyle = `rgba(59, 98, 252, ${p.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (p.alpha <= 0 || p.size <= 0) {
        particles.splice(i, 1);
      }
    }

    // Accelerate speed very gently
    runnerSpeed += 0.00035 * delta;

    // Update HUD Stats
    document.getElementById('runner-score-val').textContent = runnerScore.toString();
    document.getElementById('runner-speed-val').textContent = `${runnerSpeed.toFixed(1)}x`;

    runnerAnimationId = requestAnimationFrame(updateRunner);
  };

  /**
   * Action trigger for jumping
   */
  const triggerJump = () => {
    player.vy = player.jumpForce;
    player.isJumping = true;
    timeSinceOnGround = 999; // Disable double jump Coyote triggers
    playSound('jump');
  };

  /**
   * Event listeners for Variable Jumps
   */
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      isJumpInputDown = true;
      lastJumpPressTime = Date.now();

      if (runnerActive && (!player.isJumping || timeSinceOnGround <= 100)) {
        triggerJump();
      }
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      isJumpInputDown = false;
    }
  };

  const handleMouseDown = () => {
    isJumpInputDown = true;
    lastJumpPressTime = Date.now();
    if (runnerActive && (!player.isJumping || timeSinceOnGround <= 100)) {
      triggerJump();
    }
  };

  const handleMouseUp = () => {
    isJumpInputDown = false;
  };

  const handleTouchStart = () => {
    isJumpInputDown = true;
    lastJumpPressTime = Date.now();
    if (runnerActive && (!player.isJumping || timeSinceOnGround <= 100)) {
      triggerJump();
    }
  };

  const handleTouchEnd = () => {
    isJumpInputDown = false;
  };

  /**
   * Starts a new runner race
   */
  const startRunnerGame = () => {
    runnerScore = 0;
    runnerSpeed = 1.0;
    runnerObstacles = [];
    runnerCollectibles = [];
    particles = [];
    
    player.y = groundY - player.height - 2;
    player.vy = 0;
    player.isJumping = false;
    
    isJumpInputDown = false;
    jumpHoldFrames = 0;
    timeSinceOnGround = 0;
    lastJumpPressTime = 0;

    runnerActive = true;
    lastTime = 0;
    obstacleTimer = 0;
    collectibleTimer = 0;

    // Reset Screens
    document.getElementById('screen-runner-start').classList.remove('active');
    document.getElementById('screen-runner-gameover').classList.remove('active');

    initBackgroundGrid();
    startTipRotation();

    // Register variable jump bindings
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Kick loop
    runnerAnimationId = requestAnimationFrame(updateRunner);

    // Track match start in PostHog
    if (window.posthog) {
      window.posthog.capture('runner_match_start');
    }
  };

  /**
   * Handles Crash Game Over state
   */
  const triggerRunnerGameOver = () => {
    runnerActive = false;
    playSound('crash');
    triggerCrashExplosion();

    if (runnerAnimationId) {
      cancelAnimationFrame(runnerAnimationId);
      runnerAnimationId = null;
    }

    if (tipInterval) {
      clearInterval(tipInterval);
      tipInterval = null;
    }

    // Save and compare highscore
    saveHighScore();

    // Track match game over in PostHog
    if (window.posthog) {
      window.posthog.capture('runner_match_over', {
        score: runnerScore,
        highscore: runnerHighScore
      });
    }

    // Unbind jump listeners
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    // Update screen
    document.getElementById('screen-runner-gameover').classList.add('active');
    document.getElementById('runner-final-score').textContent = runnerScore.toString();
  };

  /**
   * Particle burst upon collision crash
   */
  const triggerCrashExplosion = () => {
    const canvas = document.getElementById('runner-canvas');
    if (!canvas) return;

    // Generate 35 square fragments
    const colors = ['rgba(239, 68, 68', 'rgba(249, 115, 22', 'rgba(251, 191, 36'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 2.5;
      particles.push({
        type: 'explosion',
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // Blast upwards
        size: Math.random() * 5.5 + 3.5,
        alpha: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Draw final blast frames to display the explosion
    const ctx = canvas.getContext('2d');
    const isDark = false;
    
    let explosionDuration = 35;
    const runExplosionFrame = () => {
      if (runnerActive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isDark ? '#080A16' : '#F0F4FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawSkyline(ctx, canvas.width, groundY, isDark);

      // Render expanding blast particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.022;
        p.size = Math.max(0.1, p.size - 0.05);

        ctx.fillStyle = p.color + `, ${p.alpha})`;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);

        if (p.alpha <= 0) particles.splice(i, 1);
      }

      explosionDuration--;
      if (explosionDuration > 0 && particles.length > 0) {
        requestAnimationFrame(runExplosionFrame);
      }
    };

    runExplosionFrame();
  };

  /**
   * Floating popup text helper
   */
  const spawnScorePopup = (text, x, y) => {
    const container = document.getElementById('game-container');
    if (!container) return;

    const popup = document.createElement('div');
    popup.className = 'whack-score-popup';
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    container.appendChild(popup);

    setTimeout(() => popup.remove(), 600);
  };

  /**
   * Resets active runner cycles
   */
  const resetAndStop = () => {
    runnerActive = false;

    if (runnerAnimationId) {
      cancelAnimationFrame(runnerAnimationId);
      runnerAnimationId = null;
    }

    if (tipInterval) {
      clearInterval(tipInterval);
      tipInterval = null;
    }

    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    isJumpInputDown = false;
    particles = [];
  };

  // Bind interface methods to window object
  window.KeiGame = {
    open: function () {
      resetAndStop();
      loadHighScore();

      const start = document.getElementById('screen-runner-start');
      if (start) start.classList.add('active');

      const over = document.getElementById('screen-runner-gameover');
      if (over) over.classList.remove('active');

      // Bind canvas mouse/touch variables
      const runnerArea = document.getElementById('runner-area');
      if (runnerArea) {
        runnerArea.addEventListener('mousedown', handleMouseDown);
        runnerArea.addEventListener('mouseup', handleMouseUp);
        runnerArea.addEventListener('touchstart', handleTouchStart, { passive: true });
        runnerArea.addEventListener('touchend', handleTouchEnd);
      }

      // Bind buttons once
      const btnStart = document.getElementById('btn-start-runner');
      if (btnStart) btnStart.onclick = startRunnerGame;

      const btnRetry = document.getElementById('btn-retry-runner');
      if (btnRetry) btnRetry.onclick = startRunnerGame;
    },
    close: function () {
      resetAndStop();
    }
  };
})();
