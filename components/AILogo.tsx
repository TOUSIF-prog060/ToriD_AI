import React from 'react';

const AILogo = () => (
  <div className="relative w-72 h-24">
    <style>
      {`
        @keyframes rgb-pulse-glow {
          0%   { filter: drop-shadow(0 0 1px hsl(0, 100%, 65%)) drop-shadow(0 0 3px hsl(0, 100%, 65%)); }
          16%  { filter: drop-shadow(0 0 2px hsl(60, 100%, 65%)) drop-shadow(0 0 4px hsl(60, 100%, 65%)); }
          33%  { filter: drop-shadow(0 0 1px hsl(120, 100%, 65%)) drop-shadow(0 0 3px hsl(120, 100%, 65%)); }
          50%  { filter: drop-shadow(0 0 2px hsl(180, 100%, 65%)) drop-shadow(0 0 4px hsl(180, 100%, 65%)); }
          66%  { filter: drop-shadow(0 0 1px hsl(240, 100%, 65%)) drop-shadow(0 0 3px hsl(240, 100%, 65%)); }
          83%  { filter: drop-shadow(0 0 2px hsl(300, 100%, 65%)) drop-shadow(0 0 4px hsl(300, 100%, 65%)); }
          100% { filter: drop-shadow(0 0 1px hsl(360, 100%, 65%)) drop-shadow(0 0 3px hsl(360, 100%, 65%)); }
        }
        .circuit-glow {
          animation: rgb-pulse-glow 5s infinite ease-in-out;
        }
        @keyframes draw-line {
            from { stroke-dashoffset: 1000; }
            to { stroke-dashoffset: 0; }
        }
        .animate-draw {
            stroke-dasharray: 1000;
            animation: draw-line 3s ease-out forwards;
        }
      `}
    </style>
    <svg viewBox="0 0 288 96" className="w-full h-full text-text-primary">
      {/* Text */}
      <text 
        x="50%" 
        y="50%" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontFamily="Poppins, sans-serif"
        fontSize="36" 
        fontWeight="600" 
        fill="currentColor"
        letterSpacing="2"
      >
        TORID
        <tspan className="accent-fill" fontWeight="700">_AI</tspan>
      </text>
      
      {/* Abstract Framing Elements */}
      <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="animate-draw" style={{ animationDelay: '0.5s' }}>
          {/* Top Left */}
          <path d="M20 20 L 60 20 L 75 35" />
          {/* Bottom Left */}
          <path d="M20 76 L 60 76 L 75 61" />
          
          {/* Top Right */}
          <path d="M268 20 L 228 20 L 213 35" />
           {/* Bottom Right */}
          <path d="M268 76 L 228 76 L 213 61" />
      </g>

      {/* Glowing Nodes */}
      <g fill="currentColor" className="circuit-glow">
          <circle cx="20" cy="20" r="3.5" />
          <circle cx="20" cy="76" r="3.5" />
          <circle cx="268" cy="20" r="3.5" />
          <circle cx="268" cy="76" r="3.5" />
      </g>
    </svg>
  </div>
);

export default AILogo;