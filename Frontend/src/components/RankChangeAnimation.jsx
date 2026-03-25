import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const RankChangeAnimation = ({ 
  previousRank, 
  currentRank, 
  show = false,
  onComplete 
}) => {
  const rankChange = previousRank - currentRank;
  const improved = rankChange > 0;

  if (!show || rankChange === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, y: -20 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2000);
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative"
        >
          {/* Background glow */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1.2] }}
            transition={{ duration: 0.8 }}
            className={cn(
              "absolute inset-0 rounded-full blur-3xl opacity-30",
              improved ? "bg-success" : "bg-destructive"
            )}
          />

          {/* Main content */}
          <motion.div
            className={cn(
              "relative flex flex-col items-center gap-4 p-10 rounded-3xl border-2",
              improved
                ? "bg-success/10 border-success/30"
                : "bg-destructive/10 border-destructive/30"
            )}
          >
            {/* Icon animation */}
            <motion.div
              initial={{ y: improved ? 30 : -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={cn(
                "flex items-center justify-center w-20 h-20 rounded-full",
                improved ? "bg-success/20" : "bg-destructive/20"
              )}
            >
              {improved ? (
                <ChevronUp className="h-12 w-12 text-success" />
              ) : (
                <ChevronDown className="h-12 w-12 text-destructive" />
              )}
            </motion.div>

            {/* Rank change text */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
              className="text-center"
            >
              <p className="text-lg text-muted-foreground mb-1">
                {improved ? "Rank Up!" : "Rank Change"}
              </p>
              <div className="flex items-center gap-3 text-4xl font-bold">
                <span className="text-muted-foreground">#{previousRank}</span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className={cn(improved ? "text-success" : "text-destructive")}
                >
                  →
                </motion.span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className={cn(improved ? "text-success" : "text-destructive")}
                >
                  #{currentRank}
                </motion.span>
              </div>
            </motion.div>

            {/* Improvement indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                improved
                  ? "bg-success/20 text-success"
                  : "bg-destructive/20 text-destructive"
              )}
            >
              {improved ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {Math.abs(rankChange)} position{Math.abs(rankChange) > 1 ? "s" : ""} up!
                  </span>
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  <span>Keep contributing to climb back!</span>
                </>
              )}
            </motion.div>

            {/* Sparkle particles for rank up */}
            {improved && (
              <>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                      y: Math.sin((i * 30 * Math.PI) / 180) * 100,
                    }}
                    transition={{
                      delay: 0.3 + i * 0.05,
                      duration: 1,
                      ease: "easeOut",
                    }}
                    className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-success"
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RankChangeAnimation;
