import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONFETTI_COLORS = [
  "hsl(217 91% 60%)",   // primary
  "hsl(262 83% 58%)",   // accent
  "hsl(189 94% 43%)",   // secondary
  "hsl(142 76% 36%)",   // success
  "hsl(38 92% 50%)",    // warning
  "hsl(340 82% 52%)",   // pink
  "hsl(50 100% 50%)",   // gold
];

const CONFETTI_SHAPES = ["square", "circle", "triangle", "star"];

const ConfettiPiece = ({ index, originX, originY }) => {
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
  const size = Math.random() * 10 + 6;
  
  // Random spread direction
  const angle = (Math.random() * 360) * (Math.PI / 180);
  const velocity = Math.random() * 500 + 300;
  const endX = Math.cos(angle) * velocity;
  const endY = Math.sin(angle) * velocity - 200; // Bias upward initially
  
  const rotation = Math.random() * 720 - 360;
  const duration = Math.random() * 2 + 2;

  const getShapeStyle = () => {
    switch (shape) {
      case "circle":
        return { borderRadius: "50%" };
      case "triangle":
        return {
          width: 0,
          height: 0,
          backgroundColor: "transparent",
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        };
      case "star":
        return {
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: originX,
        top: originY,
        width: shape === "triangle" ? 0 : size,
        height: shape === "triangle" ? 0 : size,
        backgroundColor: shape === "triangle" ? "transparent" : color,
        ...getShapeStyle(),
      }}
      initial={{
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 1,
        scale: 0,
      }}
      animate={{
        x: endX,
        y: [0, endY, endY + 400],
        rotate: rotation,
        opacity: [1, 1, 0],
        scale: [0, 1, 0.5],
      }}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.3, 1],
      }}
    />
  );
};

const Sparkle = ({ delay, originX, originY }) => {
  const angle = Math.random() * 360;
  const distance = Math.random() * 150 + 50;

  return (
    <motion.div
      className="absolute w-2 h-2 bg-warning rounded-full"
      style={{
        left: originX,
        top: originY,
        boxShadow: "0 0 10px 2px hsl(38 92% 50% / 0.6)",
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        x: Math.cos(angle * (Math.PI / 180)) * distance,
        y: Math.sin(angle * (Math.PI / 180)) * distance,
      }}
      transition={{
        duration: 0.8,
        delay: delay * 0.05,
        ease: "easeOut",
      }}
    />
  );
};

const ConfettiEffect = ({ 
  isActive = false, 
  onComplete,
  particleCount = 80,
  duration = 3000,
  originX = "50%",
  originY = "50%",
}) => {
  const [particles, setParticles] = useState([]);
  const [sparkles, setSparkles] = useState([]);

  const triggerConfetti = useCallback(() => {
    // Generate confetti particles
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: `confetti-${Date.now()}-${i}`,
      index: i,
    }));
    setParticles(newParticles);

    // Generate sparkles
    const newSparkles = Array.from({ length: 20 }, (_, i) => ({
      id: `sparkle-${Date.now()}-${i}`,
      delay: i,
    }));
    setSparkles(newSparkles);

    // Clear after animation
    setTimeout(() => {
      setParticles([]);
      setSparkles([]);
      onComplete?.();
    }, duration);
  }, [particleCount, duration, onComplete]);

  useEffect(() => {
    if (isActive) {
      triggerConfetti();
    }
  }, [isActive, triggerConfetti]);

  return (
    <AnimatePresence>
      {(particles.length > 0 || sparkles.length > 0) && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Center burst glow */}
          <motion.div
            className="absolute rounded-full bg-primary/30 blur-3xl"
            style={{
              left: originX,
              top: originY,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{ 
              width: [0, 200, 0], 
              height: [0, 200, 0], 
              opacity: [0, 0.5, 0] 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Sparkles */}
          {sparkles.map((sparkle) => (
            <Sparkle
              key={sparkle.id}
              delay={sparkle.delay}
              originX={originX}
              originY={originY}
            />
          ))}

          {/* Confetti pieces */}
          {particles.map((particle) => (
            <ConfettiPiece
              key={particle.id}
              index={particle.index}
              originX={originX}
              originY={originY}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for easy confetti triggering
export const useConfetti = () => {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, trigger, reset };
};

export default ConfettiEffect;
