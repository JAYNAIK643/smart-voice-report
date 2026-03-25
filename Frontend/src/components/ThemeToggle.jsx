import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  // Determine actual theme (resolve "system" to actual value)
  const isDark = theme === "dark" || 
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full overflow-hidden"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ y: -30, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 30, opacity: 0, rotate: 90 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.68, -0.55, 0.265, 1.55] 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-5 w-5 text-primary" />
            {/* Stars around moon */}
            <motion.span
              className="absolute top-1 right-1.5 w-1 h-1 bg-primary/60 rounded-full"
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.span
              className="absolute bottom-2 left-1 w-0.5 h-0.5 bg-primary/40 rounded-full"
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 30, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -30, opacity: 0, rotate: -90 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.68, -0.55, 0.265, 1.55] 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sun className="h-5 w-5 text-warning" />
            </motion.div>
            {/* Sun rays */}
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-0.5 h-1.5 bg-warning/40 rounded-full"
                style={{
                  transformOrigin: "center",
                  transform: `rotate(${i * 45}deg) translateY(-14px)`,
                }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scaleY: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-full ${
          isDark ? "bg-primary/10" : "bg-warning/10"
        }`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </Button>
  );
};

export default ThemeToggle;
