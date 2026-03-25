import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RippleButton = ({ 
  children, 
  className, 
  rippleColor = "rgba(255, 255, 255, 0.4)",
  onClick,
  ...props 
}) => {
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback((e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  }, [onClick]);

  return (
    <Button
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      {...props}
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: rippleColor,
            }}
            initial={{
              width: 0,
              height: 0,
              opacity: 0.6,
              x: 0,
              y: 0,
            }}
            animate={{
              width: ripple.size,
              height: ripple.size,
              opacity: 0,
              x: -ripple.size / 2,
              y: -ripple.size / 2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
      {children}
    </Button>
  );
};

export default RippleButton;
