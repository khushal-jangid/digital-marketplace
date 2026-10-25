import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flame, X } from 'lucide-react';

export default function DiwaliFestiveOverlay() {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [sparkleCount, setSparkleCount] = useState(0);
  const canvasRef = useRef(null);

  // Trigger firecracker particle burst on canvas
  const burstFireworks = () => {
    setSparkleCount((c) => c + 1);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#fbbf24', '#ffffff'];
    const originX = window.innerWidth / 2 + (Math.random() * 200 - 100);
    const originY = window.innerHeight * 0.4 + (Math.random() * 100 - 50);

    for (let i = 0; i < 90; i++) {
      const angle = (Math.PI * 2 * i) / 90;
      const speed = Math.random() * 7 + 2;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
      });
    }

    let animationFrame;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.alpha -= p.decay;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
      if (alive) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    animate();
  };

  // Trigger one burst on first mount for warm welcome
  useEffect(() => {
    const timer = setTimeout(() => {
      burstFireworks();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Fullscreen Canvas for Fireworks */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 99999,
        }}
      />

      {/* Twinkling Fairy Lights String across the top */}
      <div
        className="diwali-fairy-lights"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '14px',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const colors = ['#ff3b30', '#ffcc00', '#34c759', '#007aff', '#ff9500', '#af52de'];
          const color = colors[i % colors.length];
          return (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}, 0 0 14px ${color}`,
                animation: `diwali-twinkle 1.8s infinite ease-in-out ${i * 0.12}s`,
              }}
            />
          );
        })}
      </div>

      {/* Diwali Festive Announcement Banner */}
      {bannerVisible && (
        <aside
          aria-label="Diwali Festive Offer"
          style={{
            position: 'relative',
            zIndex: 9998,
            background: 'linear-gradient(90deg, #780206 0%, #061161 50%, #780206 100%)',
            backgroundSize: '200% auto',
            animation: 'diwali-shimmer 6s linear infinite',
            color: '#fff',
            padding: '8px 16px',
            borderBottom: '1px solid rgba(251, 191, 36, 0.4)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 2px 14px rgba(245, 158, 11, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span role="img" aria-label="diya" style={{ fontSize: '16px' }}>🪔</span>
            <strong style={{ color: '#fef08a', letterSpacing: '0.02em' }}>
              Shubh Deepawali Dhamaka!
            </strong>
            <span style={{ opacity: 0.9 }}>
              Get <b style={{ color: '#fde047' }}>25% OFF</b> on All Source Codes & Templates.
            </span>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 700,
                border: '1px dashed #fde047',
                color: '#fff',
                fontSize: '12px',
              }}
            >
              CODE: DIWALI25
            </span>
            <button
              onClick={burstFireworks}
              type="button"
              style={{
                marginLeft: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Sparkles size={12} />
              Burst Crackers 🎆
            </button>
          </div>

          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Close banner"
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <X size={15} />
          </button>
        </aside>
      )}

      {/* Floating Interactive Diya in bottom corner */}
      <div
        onClick={burstFireworks}
        title="Shubh Deepawali! Click for Fireworks & Blessings"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '20px',
          zIndex: 9995,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15) translateY(-4px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
      >
        {/* Animated Flickering Diya Flame */}
        <div
          style={{
            width: '14px',
            height: '22px',
            background: 'radial-gradient(ellipse at 50% 80%, #ffffff 0%, #fef08a 30%, #f59e0b 65%, #ef4444 95%)',
            borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
            boxShadow: '0 0 14px #f59e0b, 0 0 28px #ef4444, 0 0 40px rgba(245, 158, 11, 0.5)',
            animation: 'diya-flame-flicker 1.4s infinite ease-in-out',
            transformOrigin: 'bottom center',
            marginBottom: '-3px',
          }}
        />

        {/* Diya Clay Base */}
        <div
          style={{
            width: '38px',
            height: '16px',
            background: 'linear-gradient(180deg, #d97706 0%, #92400e 70%, #78350f 100%)',
            borderRadius: '0 0 38px 38px / 0 0 16px 16px',
            borderTop: '2px solid #fbbf24',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
            position: 'relative',
          }}
        >
          {/* Diya rim ornament */}
          <div
            style={{
              position: 'absolute',
              top: '1px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '2px',
              background: '#fef08a',
              opacity: 0.6,
              borderRadius: '2px',
            }}
          />
        </div>

        <span
          style={{
            marginTop: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#fbbf24',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
            letterSpacing: '0.04em',
            fontFamily: 'sans-serif',
          }}
        >
          🪔 Shubh Labh
        </span>
      </div>
    </>
  );
}
