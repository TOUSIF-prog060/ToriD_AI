import React, { useEffect, useRef } from 'react';

// Colors inspired by the user-provided image (cyan, magenta, blue, green/teal)
const colors = [
    'rgba(0, 255, 255, 0.8)', // Cyan
    'rgba(255, 0, 255, 0.8)', // Magenta
    'rgba(90, 150, 255, 0.8)', // Blue
    'rgba(0, 255, 170, 0.8)', // Teal
];

const PARTICLE_COUNT = 20;
const LERP_FACTOR_POS = 0.15; // How quickly particles follow. Lower is a longer/smoother tail.
const LERP_FACTOR_OPACITY = 0.1; // How quickly particles fade in/out.

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
}

const CursorTrail: React.FC = () => {
  const particlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef({ x: -9999, y: -9999 });
  const animationFrameId = useRef<number | null>(null);
  const mouseStopTimeoutId = useRef<number | null>(null);
  const isMovingRef = useRef(false);

  useEffect(() => {
    // This effect runs only once on component mount
    const particleInstances: Particle[] = [];

    // Create DOM elements and initialize particle objects
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const el = document.createElement('div');
      
      const size = Math.max(35 - i * 1.5, 5); // Particles get smaller down the tail
      const color = colors[i % colors.length];
      const initialOpacity = (PARTICLE_COUNT - i) / PARTICLE_COUNT * 0.6; // Fade out down the tail
      
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.pointerEvents = 'none';
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = color;
      el.style.borderRadius = '50%';
      el.style.zIndex = '9999';
      el.style.filter = 'blur(12px)';
      el.style.opacity = '0'; // Start invisible

      document.body.appendChild(el);
      
      particleInstances.push({ 
        el, 
        x: -9999, 
        y: -9999, 
        opacity: 0,
        targetOpacity: initialOpacity
      });
    }
    particlesRef.current = particleInstances;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      isMovingRef.current = true;
      
      if (mouseStopTimeoutId.current) {
        clearTimeout(mouseStopTimeoutId.current);
      }
      
      mouseStopTimeoutId.current = window.setTimeout(() => {
        isMovingRef.current = false;
      }, 150); // After 150ms of no movement, consider it stopped
    };

    const animate = () => {
      let targetX = mousePosRef.current.x;
      let targetY = mousePosRef.current.y;

      particlesRef.current.forEach((p) => {
        // Lerp position towards the target (mouse or the particle in front)
        p.x += (targetX - p.x) * LERP_FACTOR_POS;
        p.y += (targetY - p.y) * LERP_FACTOR_POS;

        const size = parseFloat(p.el.style.width);
        p.el.style.transform = `translate(${p.x - size / 2}px, ${p.y - size / 2}px)`;
        
        // Lerp opacity based on mouse movement
        const currentTargetOpacity = isMovingRef.current ? p.targetOpacity : 0;
        p.opacity += (currentTargetOpacity - p.opacity) * LERP_FACTOR_OPACITY;

        // Prevent opacity from being a tiny fraction, which can impact performance
        if (p.opacity < 0.01) {
            p.opacity = 0;
        }
        
        p.el.style.opacity = `${p.opacity}`;

        // The next particle in the chain targets this particle's new position
        targetX = p.x;
        targetY = p.y;
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId.current = requestAnimationFrame(animate);

    // Cleanup function to run when the component unmounts
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (mouseStopTimeoutId.current) {
        clearTimeout(mouseStopTimeoutId.current);
      }
      // Remove all created particle elements from the DOM
      particlesRef.current.forEach(p => p.el.remove());
    };
  }, []); // Empty dependency array ensures this runs only once

  return null; // The component itself doesn't render anything in the React tree
};

export default CursorTrail;