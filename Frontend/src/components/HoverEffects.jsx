import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Tilt on hover effect
export const TiltCard = ({ 
  children, 
  className = "",
  intensity = 10,
  ...props 
}) => {
  return (
    <motion.div
      className={cn("transition-transform", className)}
      whileHover={{
        rotateX: intensity,
        rotateY: intensity,
        scale: 1.02,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ transformStyle: "preserve-3d" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Magnetic hover effect (follows cursor)
export const MagneticHover = ({ 
  children, 
  className = "",
  strength = 0.3,
  ...props 
}) => {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    e.currentTarget.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "translate(0, 0)";
  };

  return (
    <motion.div
      className={cn("transition-transform duration-300", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Glow on hover
export const GlowHover = ({ 
  children, 
  className = "",
  glowColor = "hsl(var(--primary))",
  ...props 
}) => {
  return (
    <motion.div
      className={cn("relative", className)}
      whileHover="hover"
      {...props}
    >
      <motion.div
        className="absolute inset-0 rounded-inherit opacity-0 blur-xl"
        style={{ backgroundColor: glowColor }}
        variants={{
          hover: { opacity: 0.4, scale: 1.1 },
        }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// Scale bounce effect
export const BounceHover = ({ 
  children, 
  className = "",
  scale = 1.05,
  ...props 
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Shine effect on hover
export const ShineHover = ({ 
  children, 
  className = "",
  ...props 
}) => {
  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      whileHover="hover"
      {...props}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        variants={{
          hover: { x: ["0%", "200%"] },
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      {children}
    </motion.div>
  );
};

// Border glow animation
export const BorderGlow = ({ 
  children, 
  className = "",
  borderColor = "hsl(var(--primary))",
  ...props 
}) => {
  return (
    <motion.div
      className={cn("relative", className)}
      whileHover="hover"
      {...props}
    >
      <motion.div
        className="absolute inset-0 rounded-inherit"
        style={{
          background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
          backgroundSize: "200% 100%",
        }}
        variants={{
          hover: {
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          },
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="relative bg-card m-[1px] rounded-inherit">{children}</div>
    </motion.div>
  );
};

// Underline slide effect for links
export const UnderlineHover = ({ 
  children, 
  className = "",
  underlineColor = "hsl(var(--primary))",
  ...props 
}) => {
  return (
    <motion.span
      className={cn("relative inline-block", className)}
      whileHover="hover"
      {...props}
    >
      {children}
      <motion.span
        className="absolute left-0 bottom-0 w-full h-0.5"
        style={{ backgroundColor: underlineColor }}
        initial={{ scaleX: 0, originX: 0 }}
        variants={{
          hover: { scaleX: 1 },
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </motion.span>
  );
};

// Float up effect
export const FloatHover = ({ 
  children, 
  className = "",
  distance = -8,
  ...props 
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{ y: distance }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Rotate on hover
export const RotateHover = ({ 
  children, 
  className = "",
  rotation = 5,
  ...props 
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{ rotate: rotation }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Expand on hover
export const ExpandHover = ({ 
  children, 
  className = "",
  ...props 
}) => {
  return (
    <motion.div
      className={cn("cursor-pointer", className)}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 50px -15px hsl(var(--primary) / 0.3)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default {
  TiltCard,
  MagneticHover,
  GlowHover,
  BounceHover,
  ShineHover,
  BorderGlow,
  UnderlineHover,
  FloatHover,
  RotateHover,
  ExpandHover,
};
