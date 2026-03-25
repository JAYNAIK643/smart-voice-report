import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

const ParticleBackground = ({ 
  particleCount = 50, 
  className = "",
  colors = ["primary", "accent", "secondary"]
}) => {
  const containerRef = useRef(null);

  // Generate particles with random properties
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, [particleCount, colors]);

  const getColorClass = (color) => {
    const colorMap = {
      primary: "bg-primary",
      accent: "bg-accent",
      secondary: "bg-secondary",
      white: "bg-white",
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${getColorClass(particle.color)}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -100, -200, -100, 0],
            x: [0, 30, -20, 40, 0],
            scale: [1, 1.2, 0.8, 1.1, 1],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity * 0.5, particle.opacity * 1.2, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating orbs with blur effect */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className={`absolute rounded-full blur-3xl ${getColorClass(colors[i % colors.length])}`}
          style={{
            left: `${20 + i * 15}%`,
            top: `${10 + i * 20}%`,
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
            opacity: 0.1,
          }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 60, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 15 + i * 3,
            delay: i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Connection lines between nearby particles (subtle grid effect) */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={`line-${i}`}
            x1={`${10 + i * 12}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${20 + i * 10}%`}
            y2={`${Math.random() * 100}%`}
            stroke="url(#lineGradient)"
            strokeWidth="0.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 0],
              opacity: [0, 0.3, 0.3, 0]
            }}
            transition={{
              duration: 8,
              delay: i * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default ParticleBackground;
