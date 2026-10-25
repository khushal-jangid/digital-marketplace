import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { isDiwaliFestiveActive } from '../utils/festiveHelper';

export default function DiwaliFestiveOverlay() {
  const [active, setActive] = useState(isDiwaliFestiveActive());
  const [bannerVisible, setBannerVisible] = useState(true);
  const canvasRef = useRef(null);

  // Auto-check expiry timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActive(isDiwaliFestiveActive());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Trigger firecracker particle burst on canvas
  const burstFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = [
      '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
      '#ec4899', '#8b5cf6', '#fbbf24', '#ffffff', '#ffd700'
    ];

    const origins = [
      { x: window.innerWidth * 0.25, y: window.innerHeight * 0.35 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.28 },
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.35 },
    ];

    origins.forEach((orig) => {
      for (let i = 0; i < 45; i++) {
        const angle = (Math.PI * 2 * i) / 45;
        const speed = Math.random() * 8 + 3;
        particles.push({
          x: orig.x,
          y: orig.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2.5,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.012,
        });
      }
    });

    let animationFrame;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09;
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

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      burstFireworks();
    }, 1500);
    return () => clearTimeout(timer);
  }, [active]);

  // If timer expired, render nothing
  if (!active) {
    return null;
  }

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

      {/* Vibrant Twinkling Fairy Lights String across the very top */}
      <div
        className="diwali-fairy-lights"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '16px',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: 28 }).map((_, i) => {
          const colors = ['#ff3b30', '#ffcc00', '#34c759', '#007aff', '#ff9500', '#af52de'];
          const color = colors[i % colors.length];
          return (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}, 0 0 18px ${color}`,
                animation: `diwali-twinkle 1.6s infinite ease-in-out ${i * 0.1}s`,
              }}
            />
          );
        })}
      </div>

      {/* Grand Shubh Deepawali Header Ribbon */}
      {bannerVisible && (
        <aside
          aria-label="Diwali Festive Offer"
          style={{
            position: 'relative',
            zIndex: 9998,
            background: 'linear-gradient(90deg, #7f1d1d 0%, #d97706 35%, #7f1d1d 70%, #450a0a 100%)',
            backgroundSize: '250% auto',
            animation: 'diwali-shimmer 6s linear infinite',
            color: '#fff',
            padding: '9px 18px',
            borderBottom: '2px solid rgba(251, 191, 36, 0.6)',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span role="img" aria-label="diya" style={{ fontSize: '18px' }}>🪔</span>
            <strong style={{ color: '#fef08a', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '13px' }}>
              Shubh Deepawali Dhamaka Sale!
            </strong>
            <span style={{ opacity: 0.95 }}>
              Use coupon <span style={{ background: '#fef08a', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontFamily: 'monospace' }}>DIWALI50</span> for Flat 50% OFF!
            </span>
            <button
              onClick={burstFireworks}
              type="button"
              style={{
                marginLeft: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '11.5px',
                padding: '4px 12px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.7)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Sparkles size={13} />
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
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </aside>
      )}

      {/* Floating Interactive Diya in bottom corner */}
      <div
        onClick={burstFireworks}
        title="Shubh Deepawali! Click for Festive Fireworks & Good Luck"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '22px',
          zIndex: 9995,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2) translateY(-6px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
      >
        <div
          style={{
            width: '16px',
            height: '26px',
            background: 'radial-gradient(ellipse at 50% 80%, #ffffff 0%, #fef08a 30%, #f59e0b 65%, #ef4444 95%)',
            borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
            boxShadow: '0 0 16px #f59e0b, 0 0 32px #ef4444, 0 0 48px rgba(245, 158, 11, 0.6)',
            animation: 'diya-flame-flicker 1.3s infinite ease-in-out',
            transformOrigin: 'bottom center',
            marginBottom: '-3px',
          }}
        />

        <div
          style={{
            width: '42px',
            height: '18px',
            background: 'linear-gradient(180deg, #d97706 0%, #92400e 70%, #78350f 100%)',
            borderRadius: '0 0 42px 42px / 0 0 18px 18px',
            borderTop: '2px solid #fbbf24',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '1px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '2px',
              background: '#fef08a',
              opacity: 0.7,
              borderRadius: '2px',
            }}
          />
        </div>

        <span
          style={{
            marginTop: '5px',
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#fbbf24',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
            letterSpacing: '0.04em',
            fontFamily: 'sans-serif',
            background: 'rgba(0, 0, 0, 0.65)',
            padding: '2px 6px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
          }}
        >
          🪔 शुभ लाभ
        </span>
      </div>
    </>
  );
}
