// PostHog Lazy Loader - loaded asynchronously on interaction/idle to maximize performance
let posthogInstance = null;
let posthogPromise = null;

const getPostHog = () => {
  if (posthogInstance) return Promise.resolve(posthogInstance);
  if (!posthogPromise) {
    posthogPromise = import('posthog-js').then(({ default: posthog }) => {
      posthog.init('phc_kQWmbBHtcgBa3nfXM668nxvcEhbyF5QbCxQQxRA4Tsav', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: false, // Prevents unload listeners that break BFCache!
      });
      window.posthog = posthog;
      posthogInstance = posthog;
      return posthog;
    }).catch(err => {
      console.warn('PostHog deferral error:', err);
      return null;
    });
  }
  return posthogPromise;
};

// Queue event capture safely without blocking initial paint
const captureEvent = (eventName, properties) => {
  getPostHog().then((ph) => {
    if (ph && typeof ph.capture === 'function') {
      ph.capture(eventName, properties);
    }
  });
};

// Defer PostHog initialization until user interaction or 6 seconds
const initPostHogOnInteraction = () => {
  const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  const handler = () => {
    events.forEach(e => window.removeEventListener(e, handler, { passive: true }));
    getPostHog();
  };
  events.forEach(e => window.addEventListener(e, handler, { passive: true }));
  setTimeout(handler, 6000);
};

if (typeof window !== 'undefined') {
  initPostHogOnInteraction();
}

document.addEventListener('DOMContentLoaded', () => {
  // Track contact button clicks
  document.querySelectorAll('a[href*="wa.me"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentSection = btn.closest('section')?.id || btn.closest('header')?.className || 'unknown';
      captureEvent('contact_click', {
        channel: 'whatsapp',
        link_text: btn.textContent.trim(),
        location: parentSection
      });
    });
  });

  // Ensure dark-theme class is removed if present
  document.body.classList.remove('dark-theme');
  localStorage.removeItem('theme');
  const isDarkTheme = false;

  // ==========================================
  // 1. SCROLL REVEAL ANIMATION
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target); // Reveal only once
      }
    });
  }, {
    threshold: 0.05, // Se activa más rápido (5% de visibilidad en pantalla)
    rootMargin: '0px 0px 50px 0px' // Se activa 50px antes de entrar al viewport
  });
  
  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  // ==========================================
  // 2. COUNTER ANIMATION
  // ==========================================
  const stats = document.querySelectorAll('.stat-number');
  
  const animateCounter = (element) => {
    const duration = 1500; // 1.5 seconds
    const frameRate = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameRate);
    
    // Check if it's a custom range (like "2-3")
    const customRange = element.getAttribute('data-custom-range');
    const target = parseFloat(element.getAttribute('data-target'));
    const prefix = element.getAttribute('data-prefix') || '';
    const suffix = element.getAttribute('data-suffix') || '';
    
    let frame = 0;
    
    if (customRange) {
      // Handle range like "2-3"
      const [startVal, endVal] = customRange.split('-').map(Number);
      
      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        
        // Easing function: easeOutQuad
        const easeProgress = progress * (2 - progress);
        
        const currentStart = Math.floor(easeProgress * startVal);
        const currentEnd = Math.floor(easeProgress * endVal);
        
        element.textContent = `${prefix}${currentStart}-${currentEnd}${suffix}`;
        
        if (frame === totalFrames) {
          clearInterval(timer);
          element.textContent = `${prefix}${startVal}-${endVal}${suffix}`;
        }
      }, frameRate);
      
    } else if (!isNaN(target)) {
      // Handle standard counters
      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        
        // Easing function: easeOutQuad
        const easeProgress = progress * (2 - progress);
        const currentValue = Math.floor(easeProgress * target);
        
        element.textContent = `${prefix}${currentValue}${suffix}`;
        
        if (frame === totalFrames) {
          clearInterval(timer);
          element.textContent = `${prefix}${target}${suffix}`;
        }
      }, frameRate);
    }
  };
  
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        statsObserver.unobserve(entry.target); // Run only once
      }
    });
  }, {
    threshold: 0.1 // Se reduce el umbral para asegurar que empiece a contar apenas se asoma
  });
  
  stats.forEach(stat => {
    statsObserver.observe(stat);
  });

  // ==========================================
  // 3. COLLABORATIVE NETWORK CANVAS ANIMATION
  // ==========================================
  const canvas = document.getElementById('network-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let isCanvasVisible = false;
    let width = 0;
    let height = 0;
    let nodes = [];
    let morphProgress = 0;
    
    // Metropolitan Area coordinates
    let metroCenterX = 0;
    let metroCenterY = 0;
    let metroRadius = 0;
    
    // Mouse properties
    const mouse = {
      x: null,
      y: null
    };

    // Pulse and ripple states
    const pulses = [];
    const ripples = [];
    let lastAutoPulseTime = 0;

    // Tooltip DOM references & states
    const tooltip = document.getElementById('network-tooltip');
    const tooltipText = tooltip ? tooltip.querySelector('.tooltip-text') : null;
    let currentHoveredNode = null;
    const hoverDistance = 20; // Hover sensitivity radius

    // Spanish logistical status messages
    const statusMessages = [
      "Conductor #42 activo",
      "Paquete ID-8942 en ruta",
      "Envío express coordinado",
      "Negocio conectado en Córdoba",
      "Conductor #17 en camino",
      "Entrega completada",
      "Ruta optimizada recalculada",
      "Pedido entrante en Nueva Córdoba",
      "Vehículo de reparto asignado",
      "Hub central procesando envío"
    ];
    
    // Check if mobile or layout dimensions
    const isMobile = () => window.innerWidth < 768;
    
    // Cached layout metrics to prevent layout thrashing on scroll
    let cachedHeroBottom = 0;
    let cachedTargetFullyIn = 0;

    const updateLayoutMetrics = () => {
      const heroSection = document.querySelector('.hero-section');
      const targetSection = document.getElementById('como-funciona');
      if (heroSection && targetSection) {
        cachedHeroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        cachedTargetFullyIn = targetSection.offsetTop + targetSection.offsetHeight - window.innerHeight;
      }
    };

    // Calculate morphProgress based on scroll without layout reflows
    const updateMorphProgress = () => {
      if (cachedHeroBottom > 0 && cachedTargetFullyIn > 0) {
        const scrollY = window.scrollY;
        if (scrollY <= cachedHeroBottom) {
          morphProgress = 0;
        } else if (scrollY >= cachedTargetFullyIn) {
          morphProgress = 1;
        } else {
          morphProgress = (scrollY - cachedHeroBottom) / Math.max(1, cachedTargetFullyIn - cachedHeroBottom);
        }
      }
      
      // Update canvas opacity dynamically
      if (canvas) {
        canvas.style.opacity = (0.8 - morphProgress * 0.55).toString();
      }
    };

    // Resize handler
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      updateLayoutMetrics();

      const heroVisual = document.querySelector('.hero-visual');
      if (heroVisual) {
        const rect = heroVisual.getBoundingClientRect();
        // Calculate absolute page-relative coordinates of the center of .hero-visual
        metroCenterX = rect.left + window.scrollX + rect.width / 2;
        metroCenterY = rect.top + window.scrollY + rect.height / 2;
        // Set the radius to a safe fraction of the visual container size
        metroRadius = Math.min(rect.width, rect.height) * 0.45;
      } else {
        // Fallback to viewport percentages if element not found
        const mobile = isMobile();
        if (mobile) {
          metroCenterX = width * 0.5;
          metroCenterY = height * 0.65;
          metroRadius = Math.min(width, height) * 0.28;
        } else {
          metroCenterX = width * 0.70;
          metroCenterY = height * 0.50;
          metroRadius = Math.min(width, height) * 0.22;
        }
      }
      
      initNodes();
      updateMorphProgress();
    };
    
    // Initialize nodes with optimized count for speed & lower TBT
    const initNodes = () => {
      nodes = [];
      pulses.length = 0;
      ripples.length = 0;
      if (tooltip) tooltip.classList.remove('active');
      currentHoveredNode = null;

      const mobile = isMobile();
      const currentMaxNodes = mobile ? 16 : 28;

      // 4 horizontal streets at Y coordinates
      const horizontalStreets = [
        0.2 * height,
        0.4 * height,
        0.6 * height,
        0.8 * height
      ];
      // 4 vertical streets at X coordinates
      const verticalStreets = [
        0.15 * width,
        0.4 * width,
        0.65 * width,
        0.9 * width
      ];

      const denseCount = Math.round(currentMaxNodes * 0.7);

      for (let i = 0; i < currentMaxNodes; i++) {
        const isVertical = Math.random() < 0.5;
        let cityX, cityY;
        
        if (isVertical) {
          cityX = verticalStreets[Math.floor(Math.random() * verticalStreets.length)];
          cityY = Math.random() * height;
        } else {
          cityX = Math.random() * width;
          cityY = horizontalStreets[Math.floor(Math.random() * horizontalStreets.length)];
        }

        const isDense = i < denseCount;
        let x, y;

        if (isDense) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.pow(Math.random(), 1.5) * metroRadius;
          x = metroCenterX + Math.cos(angle) * distance;
          y = metroCenterY + Math.sin(angle) * distance;
        } else {
          x = Math.random() * width;
          y = Math.random() * height;
        }

        nodes.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2.5 + 2.5,
          alpha: Math.random() * 0.5 + 0.3,
          isVertical: isVertical,
          cityX: cityX,
          cityY: cityY,
          renderX: 0,
          renderY: 0,
          isDense: isDense
        });
      }
    };

    // Generate a random path of nodes for a pulse to travel
    const generateRandomPath = (startNode, hops = 3) => {
      const path = [startNode];
      let current = startNode;
      const currentConnDistance = isMobile() ? 75 : 110;
      
      for (let h = 0; h < hops; h++) {
        const neighbors = [];
        nodes.forEach(node => {
          if (node === current) return;
          const dx = node.renderX - current.renderX;
          const dy = node.renderY - current.renderY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < currentConnDistance) {
            neighbors.push(node);
          }
        });
         
        if (neighbors.length === 0) break;
        
        // Prevent immediate backtracking if possible
        const prev = path[path.length - 2];
        const filteredNeighbors = neighbors.filter(n => n !== prev);
        
        const nextNode = filteredNeighbors.length > 0
          ? filteredNeighbors[Math.floor(Math.random() * filteredNeighbors.length)]
          : neighbors[Math.floor(Math.random() * neighbors.length)];
          
        path.push(nextNode);
        current = nextNode;
      }
      
      return path;
    };

    // Spawn a pulse along a node path
    const spawnPulse = (path) => {
      if (path.length < 2) return;
      pulses.push({
        path: path,
        pathIndex: 0,
        progress: 0
      });
    };
    
    // Canvas frame rate throttling (30 FPS to save CPU and main thread work)
    let lastFrameTime = 0;
    const targetFps = 30;
    const fpsInterval = 1000 / targetFps;

    // Draw and update simulation
    const animate = (timestamp) => {
      if (!isCanvasVisible || document.hidden) return;

      animationFrameId = requestAnimationFrame(animate);

      if (timestamp) {
        const elapsed = timestamp - lastFrameTime;
        if (elapsed < fpsInterval) return;
        lastFrameTime = timestamp - (elapsed % fpsInterval);
      }
      
      ctx.clearRect(0, 0, width, height);

      // Read cached theme status for high performance
      const colorRGB = isDarkTheme ? '59, 98, 252' : '23, 64, 182';
      const currentConnDistance = isMobile() ? 75 : 110;
      const mouseRadius = isMobile() ? 80 : 120;
      
      // Update Nodes
      nodes.forEach(node => {
        // standard physics
        node.x += node.vx;
        node.y += node.vy;

        // Maintain Metropolitan Density (Attraction Forces in animate)
        if (node.isDense && morphProgress === 0) {
          const dx = metroCenterX - node.x;
          const dy = metroCenterY - node.y;
          const distSq = dx * dx + dy * dy;
          const metroRadiusSq = metroRadius * metroRadius;
          if (distSq > metroRadiusSq) {
            const dist = Math.sqrt(distSq);
            // Gentle steering vector back to the metro area
            node.vx += (dx / dist) * 0.008;
            node.vy += (dy / dist) * 0.008;
          }
          // Limit the speed of dense nodes slightly so they move in a smooth, swarm-like motion within the metropolitan cluster.
          const speedSq = node.vx * node.vx + node.vy * node.vy;
          const maxSpeed = 0.25;
          const maxSpeedSq = maxSpeed * maxSpeed;
          if (speedSq > maxSpeedSq) {
            const speed = Math.sqrt(speedSq);
            node.vx = (node.vx / speed) * maxSpeed;
            node.vy = (node.vy / speed) * maxSpeed;
          }
        }

        if (node.x < 0) { node.x = 0; node.vx = Math.abs(node.vx); }
        else if (node.x > width) { node.x = width; node.vx = -Math.abs(node.vx); }
        if (node.y < 0) { node.y = 0; node.vy = Math.abs(node.vy); }
        else if (node.y > height) { node.y = height; node.vy = -Math.abs(node.vy); }

        // city coordinates (nodes drive along lines)
        if (node.isVertical) {
          node.cityY += node.vy * 1.5;
          if (node.cityY < 0) { node.cityY = 0; node.vy = Math.abs(node.vy); }
          else if (node.cityY > height) { node.cityY = height; node.vy = -Math.abs(node.vy); }
        } else {
          node.cityX += node.vx * 1.5;
          if (node.cityX < 0) { node.cityX = 0; node.vx = Math.abs(node.vx); }
          else if (node.cityX > width) { node.cityX = width; node.vx = -Math.abs(node.vx); }
        }

        // Interpolate render coordinates
        node.renderX = node.x * (1 - morphProgress) + node.cityX * morphProgress;
        node.renderY = node.y * (1 - morphProgress) + node.cityY * morphProgress - window.scrollY * (1 - morphProgress);

        // Mouse/Touch interaction (gentle repulsion)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = node.renderX - mouse.x;
          const dy = node.renderY - mouse.y;
          const distSq = dx * dx + dy * dy;
          const mouseRadiusSq = mouseRadius * mouseRadius;
          
          if (distSq < mouseRadiusSq) {
            const dist = Math.sqrt(distSq) || 0.001;
            const force = (mouseRadius - dist) / mouseRadius;
            const rx = dx / dist;
            const ry = dy / dist;
            // Apply repulsion to underlying physics and city coordinates so both morph cleanly
            node.x += rx * force * 1.5;
            node.y += ry * force * 1.5;
            if (node.isVertical) {
              node.cityY += ry * force * 1.5;
            } else {
              node.cityX += rx * force * 1.5;
            }
            // Recalculate render coordinates after repulsion is applied
            node.renderX = node.x * (1 - morphProgress) + node.cityX * morphProgress;
            node.renderY = node.y * (1 - morphProgress) + node.cityY * morphProgress - window.scrollY * (1 - morphProgress);
          }
        }
        
        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.renderX, node.renderY, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB}, ${node.alpha})`;
        ctx.fill();
      });
      
      // Draw Connections
      const currentConnDistanceSq = currentConnDistance * currentConnDistance;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].renderX - nodes[j].renderX;
          const dy = nodes[i].renderY - nodes[j].renderY;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < currentConnDistanceSq) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - (dist / currentConnDistance)) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].renderX, nodes[i].renderY);
            ctx.lineTo(nodes[j].renderX, nodes[j].renderY);
            ctx.strokeStyle = `rgba(${colorRGB}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Update & Draw Click Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += ripple.speed;
        ripple.alpha -= 0.025;
        
        if (ripple.alpha <= 0 || ripple.radius >= ripple.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        
        const drawY = ripple.y - (window.scrollY - ripple.spawnScrollY) * (1 - morphProgress);
        
        ctx.beginPath();
        ctx.arc(ripple.x, drawY, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${colorRGB}, ${ripple.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Update & Draw Pulses (glowing package delivery)
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        const nodeA = pulse.path[pulse.pathIndex];
        const nodeB = pulse.path[pulse.pathIndex + 1];
        
        if (!nodeA || !nodeB) {
          pulses.splice(i, 1);
          continue;
        }
        
        const dx = nodeB.renderX - nodeA.renderX;
        const dy = nodeB.renderY - nodeA.renderY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          pulse.progress += 1.5 / dist;
        } else {
          pulse.progress = 1;
        }
        
        if (pulse.progress >= 1) {
          pulse.pathIndex++;
          pulse.progress = 0;
          if (pulse.pathIndex >= pulse.path.length - 1) {
            pulses.splice(i, 1);
            continue;
          }
        }
        
        // Calculate position
        const x = nodeA.renderX + (nodeB.renderX - nodeA.renderX) * pulse.progress;
        const y = nodeA.renderY + (nodeB.renderY - nodeA.renderY) * pulse.progress;
        
        // Draw pulse
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB}, 0.15)`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB}, 0.45)`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // Automatic Pulses (Continuous Network Simulation)
      const now = Date.now();
      if (now - lastAutoPulseTime > 2500 && nodes.length > 0) {
        const startNode = nodes[Math.floor(Math.random() * nodes.length)];
        const path = generateRandomPath(startNode, Math.floor(Math.random() * 2) + 2);
        spawnPulse(path);
        lastAutoPulseTime = now;
      }

      // Manage Hovered Node & Tooltip
      let hoveredNode = null;
      if (mouse.x !== null && mouse.y !== null) {
        let minDistSq = hoverDistance * hoverDistance;
        nodes.forEach(node => {
          const dx = node.renderX - mouse.x;
          const dy = node.renderY - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            hoveredNode = node;
          }
        });
      }
      
      if (hoveredNode) {
        if (currentHoveredNode !== hoveredNode) {
          currentHoveredNode = hoveredNode;
          if (tooltip && tooltipText) {
            const randomMsg = statusMessages[Math.floor(Math.random() * statusMessages.length)];
            tooltipText.textContent = randomMsg;
            tooltip.classList.add('active');
          }
        }
        if (tooltip) {
          tooltip.style.left = `${hoveredNode.renderX}px`;
          tooltip.style.top = `${hoveredNode.renderY}px`;
        }
      } else {
        if (currentHoveredNode !== null) {
          currentHoveredNode = null;
          if (tooltip) {
            tooltip.classList.remove('active');
          }
        }
      }
    };
    
    // Window mouse/touch listeners for background canvas interaction
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
    
    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Window click listener (spawn ripples / pulses)
    window.addEventListener('click', (e) => {
      // Ignore click if clicking interactive elements
      if (e.target.closest('button, a, input, textarea, select')) {
        return;
      }
      
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      // Spawn a ripple
      ripples.push({
        x: clickX,
        y: clickY,
        spawnScrollY: window.scrollY,
        radius: 2,
        maxRadius: 50,
        alpha: 0.8,
        speed: 2
      });
      
      // Find nearest node
      let nearestNode = null;
      let minDist = Infinity;
      nodes.forEach(node => {
        const dx = node.renderX - clickX;
        const dy = node.renderY - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestNode = node;
        }
      });
      
      if (nearestNode) {
        const path = generateRandomPath(nearestNode, Math.floor(Math.random() * 2) + 2);
        spawnPulse(path);

        // Track node cluster interaction in PostHog
        captureEvent('node_cluster_click', {
          click_x: clickX,
          click_y: clickY,
          is_dense_cluster: nearestNode.isDense,
          nearest_distance: Math.round(minDist)
        });
      }
    });
    
    // Performance optimization using IntersectionObserver
    const canvasObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isCanvasVisible = entry.isIntersecting;
        if (isCanvasVisible) {
          animate();
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      });
    }, {
      threshold: 0.05
    });
    
    canvasObserver.observe(canvas);
    
    // Handle tab visibility change to pause canvas animation when in background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else if (isCanvasVisible) {
        animate();
      }
    });

    // Handle resize
    window.addEventListener('resize', () => {
      resizeCanvas();
      if (isCanvasVisible) {
        cancelAnimationFrame(animationFrameId);
        animate();
      }
    });

    window.addEventListener('scroll', updateMorphProgress, { passive: true });
    
    // Initial load
    resizeCanvas();
  }

  // ==========================================
  // 4. BENTO GRID SPOTLIGHT HOVER EFFECT
  // ==========================================
  const benefitCards = document.querySelectorAll('.benefit-card');
  benefitCards.forEach(card => {
    let ticking = false;
    
    card.addEventListener('mousemove', (e) => {
      if (!ticking) {
        const clientX = e.clientX;
        const clientY = e.clientY;
        window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
          ticking = false;
        });
        ticking = true;
      }
    });
    
    card.addEventListener('mouseleave', () => {
      window.requestAnimationFrame(() => {
        card.style.removeProperty('--mouse-x');
        card.style.removeProperty('--mouse-y');
      });
    });
  });

  // ==========================================
  // 5. NARRATIVE TIMELINE DRAWING LINE
  // ==========================================
  const steps = document.querySelectorAll('.timeline-step');
  const activeLine = document.querySelector('.timeline-line-active');
  
  const updateTimelineProgress = () => {
    if (!activeLine || steps.length === 0) return;
    
    let highestActiveIndex = -1;
    steps.forEach((step, index) => {
      if (step.classList.contains('active')) {
        highestActiveIndex = Math.max(highestActiveIndex, index);
      }
    });
    
    let progress = 0;
    if (highestActiveIndex === 0) {
      progress = 12.5;
    } else if (highestActiveIndex === 1) {
      progress = 37.5;
    } else if (highestActiveIndex === 2) {
      progress = 62.5;
    } else if (highestActiveIndex === 3) {
      progress = 100;
    }
    
    if (window.innerWidth < 992) {
      activeLine.style.transform = `scaleY(${progress / 100})`;
    } else {
      activeLine.style.transform = `scaleX(${progress / 100})`;
    }
    
    const endpoint = document.querySelector('.timeline-endpoint');
    if (endpoint) {
      endpoint.classList.toggle('active', highestActiveIndex === steps.length - 1);
    }
  };
  
  if (steps.length > 0 && activeLine) {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Toggle the .active class based on whether it is in the viewport
        entry.target.classList.toggle('active', entry.isIntersecting);
      });
      
      // Update progress line
      updateTimelineProgress();
    }, {
      threshold: 0.25,
      rootMargin: '0px 0px -10% 0px'
    });
    
    steps.forEach(step => {
      timelineObserver.observe(step);
    });
    
    // Listen for resize to switch between width and height properties
    window.addEventListener('resize', updateTimelineProgress);
    
    // Initial check
    updateTimelineProgress();
  }

  // ==========================================
  // 6. WHACK-A-PROBLEM GAME LAZY LOADING
  // ==========================================
  const gameFab = document.getElementById('game-fab');
  const gameModal = document.getElementById('game-modal');
  const gameModalClose = document.getElementById('game-modal-close');
  const backdrop = document.querySelector('.game-modal-backdrop');

  let gameLoaded = false;
  let gameLoading = false;

  const loadGameAssets = () => {
    if (gameLoaded) return Promise.resolve();
    if (gameLoading) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (gameLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    gameLoading = true;
    if (gameFab) gameFab.classList.add('loading');

    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    const loadCSS = new Promise((resolve, reject) => {
      if (document.getElementById('game-style')) {
        resolve();
        return;
      }
      const link = document.createElement('link');
      link.id = 'game-style';
      link.rel = 'stylesheet';
      link.href = `${cleanBaseUrl}game.css`;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });

    const loadJS = new Promise((resolve, reject) => {
      if (document.getElementById('game-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'game-script';
      script.src = `${cleanBaseUrl}game.js`;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

    return Promise.all([loadCSS, loadJS]).then(() => {
      gameLoaded = true;
      gameLoading = false;
      if (gameFab) gameFab.classList.remove('loading');
    }).catch(err => {
      gameLoading = false;
      if (gameFab) gameFab.classList.remove('loading');
      console.error('Failed to load game assets:', err);
      alert('No se pudieron cargar los archivos del juego. Inténtalo de nuevo.');
    });
  };

  let gameStartTime = null;

  const openGame = () => {
    loadGameAssets().then(() => {
      if (window.KeiGame && typeof window.KeiGame.open === 'function') {
        window.KeiGame.open();
        if (gameModal) {
          gameModal.classList.add('active');
          gameModal.setAttribute('aria-hidden', 'false');
          gameModal.removeAttribute('inert');
          document.body.style.overflow = 'hidden'; // Prevent main page scrolling
        }

        gameStartTime = Date.now();
        captureEvent('game_opened');
      }
    });
  };

  const closeGame = () => {
    if (window.KeiGame && typeof window.KeiGame.close === 'function') {
      window.KeiGame.close();
    }
    if (gameModal) {
      gameModal.classList.remove('active');
      gameModal.setAttribute('aria-hidden', 'true');
      gameModal.setAttribute('inert', '');
      document.body.style.overflow = ''; // Re-enable main page scrolling
    }

    if (gameStartTime) {
      const durationSeconds = Math.round((Date.now() - gameStartTime) / 1000);
      captureEvent('game_closed', {
        duration_seconds: durationSeconds,
        duration_formatted: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
      });
      gameStartTime = null;
    }
  };

  if (gameFab) {
    gameFab.addEventListener('click', openGame);
  }

  if (gameModalClose) {
    gameModalClose.addEventListener('click', closeGame);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeGame);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameModal && gameModal.classList.contains('active')) {
      closeGame();
    }
  });
});
