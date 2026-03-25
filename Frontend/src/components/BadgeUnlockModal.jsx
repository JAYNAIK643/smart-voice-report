import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BadgeDisplay from "./BadgeDisplay";
import { useBadges } from "@/context/badges-context";

// Confetti particle component
const ConfettiParticle = ({ delay, color }) => {
  const randomX = Math.random() * 400 - 200;
  const randomRotation = Math.random() * 720 - 360;
  
  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{
        x: 0,
        y: 0,
        rotate: 0,
        opacity: 1,
        scale: 0,
      }}
      animate={{
        x: randomX,
        y: [0, -150, 400],
        rotate: randomRotation,
        opacity: [1, 1, 0],
        scale: [0, 1, 0.5],
      }}
      transition={{
        duration: 2,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
};

const confettiColors = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", 
  "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"
];

const BadgeUnlockModal = () => {
  const { newBadge, dismissNewBadge } = useBadges();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (newBadge) {
      setShowConfetti(true);
      // Play celebration sound
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  }, [newBadge]);

  const handleClose = () => {
    setShowConfetti(false);
    dismissNewBadge();
  };

  return (
    <Dialog open={!!newBadge} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md overflow-visible bg-background border-border">
        <div className="relative flex flex-col items-center py-8">
          {/* Confetti */}
          <AnimatePresence>
            {showConfetti && (
              <div className="absolute top-1/2 left-1/2 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <ConfettiParticle
                    key={i}
                    delay={i * 0.05}
                    color={confettiColors[i % confettiColors.length]}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Celebration rays */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-24 bg-gradient-to-t from-primary/20 to-transparent origin-bottom"
                style={{
                  transform: `rotate(${i * 30}deg)`,
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 0.5 }}
                transition={{
                  delay: 0.5 + i * 0.05,
                  duration: 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>

          {/* Trophy icon animation */}
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            <div className="text-6xl mb-4">🏆</div>
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Badge Unlocked!
          </motion.h2>

          {/* Badge display */}
          {newBadge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="my-6"
            >
              <BadgeDisplay badge={newBadge} earned={true} size="lg" showTooltip={false} />
            </motion.div>
          )}

          {/* Badge name and description */}
          {newBadge && (
            <motion.div
              className="text-center space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold">{newBadge.name}</h3>
              <p className="text-muted-foreground max-w-xs">
                {newBadge.description}
              </p>
            </motion.div>
          )}

          {/* Close button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <Button onClick={handleClose} size="lg">
              Awesome! 🎉
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeUnlockModal;
