document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 0. THEME TOGGLE (LIGHT / DARK SYSTEM)
  // ==========================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize theme
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }

  // Toggle button click handler
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-theme');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

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
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
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
    threshold: 0.5
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
    const maxNodes = 40;
    const connectionDistance = 110;
    
    // Mouse properties
    const mouse = {
      x: null,
      y: null,
      radius: 120
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
    
    // Resize handler
    const resizeCanvas = () => {
      if (isMobile()) {
        cancelAnimationFrame(animationFrameId);
        return;
      }
      
      const container = canvas.parentElement;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      
      initNodes();
    };
    
    // Initialize nodes
    const initNodes = () => {
      nodes = [];
      pulses.length = 0;
      ripples.length = 0;
      if (tooltip) tooltip.classList.remove('active');
      currentHoveredNode = null;

      for (let i = 0; i < maxNodes; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2.5 + 2.5,
          alpha: Math.random() * 0.5 + 0.3
        });
      }
    };

    // Generate a random path of nodes for a pulse to travel
    const generateRandomPath = (startNode, hops = 3) => {
      const path = [startNode];
      let current = startNode;
      
      for (let h = 0; h < hops; h++) {
        const neighbors = [];
        nodes.forEach(node => {
          if (node === current) return;
          const dx = node.x - current.x;
          const dy = node.y - current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
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
    
    // Draw and update simulation
    const animate = () => {
      if (!isCanvasVisible || isMobile()) return;
      
      ctx.clearRect(0, 0, width, height);

      // Read theme status once per frame for high performance
      const isDark = document.body.classList.contains('dark-theme');
      const colorRGB = isDark ? '59, 98, 252' : '23, 64, 182';
      
      // Update & Draw Nodes
      nodes.forEach(node => {
        // Move nodes
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off walls
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        
        // Mouse interaction (gentle repulsion)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Repel direction
            const rx = dx / dist;
            const ry = dy / dist;
            // Apply repulsion force smoothly
            node.x += rx * force * 1.5;
            node.y += ry * force * 1.5;
          }
        }
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorRGB}, ${node.alpha})`;
        ctx.fill();
      });
      
      // Draw Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < connectionDistance) {
            // Fades as distance increases
            const alpha = (1 - (dist / connectionDistance)) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
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
        
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
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
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          // Travel speed of 1.5 pixels per frame
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
        const x = nodeA.x + (nodeB.x - nodeA.x) * pulse.progress;
        const y = nodeA.y + (nodeB.y - nodeA.y) * pulse.progress;
        
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
        let minDist = hoverDistance;
        nodes.forEach(node => {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            hoveredNode = node;
          }
        });
      }
      
      if (hoveredNode) {
        canvas.style.cursor = 'pointer';
        if (currentHoveredNode !== hoveredNode) {
          currentHoveredNode = hoveredNode;
          if (tooltip && tooltipText) {
            const randomMsg = statusMessages[Math.floor(Math.random() * statusMessages.length)];
            tooltipText.textContent = randomMsg;
            tooltip.classList.add('active');
          }
        }
        if (tooltip) {
          tooltip.style.left = `${hoveredNode.x}px`;
          tooltip.style.top = `${hoveredNode.y}px`;
        }
      } else {
        canvas.style.cursor = 'grab';
        if (currentHoveredNode !== null) {
          currentHoveredNode = null;
          if (tooltip) {
            tooltip.classList.remove('active');
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Mouse Event Listeners
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Click Event Listener
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Spawn a ripple
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 2,
        maxRadius: 50,
        alpha: 0.8,
        speed: 2
      });
      
      // Find nearest node
      let nearestNode = null;
      let minDist = Infinity;
      nodes.forEach(node => {
        const dx = node.x - clickX;
        const dy = node.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestNode = node;
        }
      });
      
      if (nearestNode) {
        const path = generateRandomPath(nearestNode, Math.floor(Math.random() * 2) + 2);
        spawnPulse(path);
      }
    });
    
    // Performance optimization using IntersectionObserver
    const canvasObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isCanvasVisible = entry.isIntersecting;
        if (isCanvasVisible && !isMobile()) {
          animate();
        } else {
          cancelAnimationFrame(animationFrameId);
        }
      });
    }, {
      threshold: 0.05
    });
    
    canvasObserver.observe(canvas);
    
    // Handle resize
    window.addEventListener('resize', () => {
      resizeCanvas();
      if (isCanvasVisible && !isMobile()) {
        cancelAnimationFrame(animationFrameId);
        animate();
      }
    });
    
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
      activeLine.style.width = '';
      activeLine.style.height = `${progress}%`;
    } else {
      activeLine.style.height = '';
      activeLine.style.width = `${progress}%`;
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
});
