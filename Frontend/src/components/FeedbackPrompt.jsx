import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import useFeedback from "@/hooks/useFeedback";
import FeedbackModal from "./FeedbackModal";

const FeedbackPrompt = () => {
  const { user, isAuthenticated } = useAuth();
  const { checkPendingFeedback } = useFeedback();
  const [pendingComplaint, setPendingComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkForPendingFeedback = async () => {
      if (!isAuthenticated || !user) return;
      
      const complaint = await checkPendingFeedback();
      if (complaint) {
        // Small delay to not interrupt user immediately
        setTimeout(() => {
          setPendingComplaint(complaint);
          setShowModal(true);
        }, 2000);
      }
    };

    checkForPendingFeedback();
  }, [isAuthenticated, user, checkPendingFeedback]);

  if (!pendingComplaint) return null;

  return (
    <FeedbackModal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        setPendingComplaint(null);
      }}
      complaint={pendingComplaint}
      onFeedbackSubmitted={() => {
        setPendingComplaint(null);
      }}
      allowSkip={true}
    />
  );
};

export default FeedbackPrompt;
