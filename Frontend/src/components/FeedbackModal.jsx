import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Clock, ThumbsUp, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import StarRating from "./StarRating";

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  complaint,
  onFeedbackSubmitted,
  allowSkip = true 
}) => {
  const [rating, setRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setTimelinessRating(0);
      setComment("");
      setStep(1);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit feedback via MongoDB backend
      await apiService.submitFeedback({
        complaintId: complaint.complaintId,
        rating,
        timelinessRating: timelinessRating || null,
        comment: comment.trim() || null,
      });

      toast.success("Thank you for your feedback!");
      onFeedbackSubmitted?.();
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(error.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await apiService.skipFeedback(complaint.complaintId);
      onClose();
    } catch (error) {
      console.error("Error skipping feedback:", error);
      onClose();
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { opacity: 0, scale: 0.9, y: 20 }
  };

  const stepVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Rate Your Experience
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
                initial={false}
                animate={{ 
                  backgroundColor: s <= step ? "hsl(var(--primary))" : "hsl(var(--muted))" 
                }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Complaint Resolved!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    "{complaint?.title}" has been marked as resolved
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium mb-3">How satisfied are you overall?</p>
                  <div className="flex justify-center">
                    <StarRating 
                      rating={rating} 
                      onRatingChange={setRating}
                      size="xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  {allowSkip && (
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={handleSkip}
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip
                    </Button>
                  )}
                  <Button
                    className="flex-1 gradient-button"
                    onClick={() => setStep(2)}
                    disabled={rating === 0}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-3">How was the response time?</p>
                  <div className="flex justify-center">
                    <StarRating 
                      rating={timelinessRating} 
                      onRatingChange={setTimelinessRating}
                      size="lg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Optional</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 gradient-button"
                    onClick={() => setStep(3)}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Any additional comments? (Optional)
                  </label>
                  <Textarea
                    placeholder="Share your experience with the resolution process..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Rating</span>
                    <StarRating rating={rating} readonly size="sm" />
                  </div>
                  {timelinessRating > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Timeliness</span>
                      <StarRating rating={timelinessRating} readonly size="sm" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 gradient-button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
