import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useComplaints } from "@/context/complaints-context";
import { Search, CheckCircle2, Clock, AlertCircle, Star } from "lucide-react";
import FeedbackModal from "@/components/FeedbackModal";
import FeedbackDisplay from "@/components/FeedbackDisplay";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/apiService";

const STATUS_LABEL = {
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

const PRIORITY_LABEL = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const STATUS_STEPS = [
  { key: "pending", label: "Submitted" },
  { key: "in-progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

function upsertMeta(name, content) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  if (typeof document === "undefined") return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const TrackComplaint = () => {
  const { complaints, getComplaintById } = useComplaints();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [complaintId, setComplaintId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    document.title = "Track Complaint Status | SmartCity";
    upsertMeta(
      "description",
      "Track your complaint status using your complaint ID. View details, priority, and timeline updates."
    );
    upsertCanonical(`${window.location.origin}/track`);
  }, []);

  const getStatusTone = (status) => {
    switch (status) {
      case "resolved":
        return "bg-success/20 text-success-foreground border-success";
      case "in-progress":
        return "bg-primary/15 text-primary border-primary/30";
      case "pending":
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPriorityTone = (priority) => {
    switch (priority) {
      case "high":
        return "bg-destructive/15 text-destructive border-destructive/30";
      case "medium":
        return "bg-warning/15 text-warning border-warning/30";
      case "low":
      default:
        return "bg-success/15 text-success border-success/30";
    }
  };

  const timeline = useMemo(() => {
    if (!searchResult) return [];

    const statusIndex = Math.max(
      0,
      STATUS_STEPS.findIndex((s) => s.key === searchResult.status)
    );

    return STATUS_STEPS.map((step, idx) => {
      const completed = idx <= statusIndex;

      const date =
        step.key === "pending"
          ? searchResult.createdAt
          : step.key === "resolved" && searchResult.status === "resolved"
            ? searchResult.updatedAt
            : "";

      return {
        ...step,
        completed,
        date,
      };
    });
  }, [searchResult]);

  const handleSearch = async (e) => {
    e.preventDefault();

    const normalized = complaintId.trim().toUpperCase();
    setHasSearched(true);
    setSearching(true);

    try {
      // First try to find in local context
      let found = normalized ? getComplaintById(normalized) : null;
      
      // If not found locally, try direct API call to backend
      if (!found) {
        try {
          const response = await apiService.getGrievanceById(normalized);
          if (response.success && response.data) {
            found = response.data;
          }
        } catch (apiError) {
          // API call failed, will show "not found" message
          console.log("Complaint not found in backend either:", apiError.message);
        }
      }
      
      setSearchResult(found);
    } finally {
      setSearching(false);
    }
  };

  return (
  <>
    <main className="pt-24 pb-20 min-h-screen bg-background">
      <section className="container mx-auto px-4 max-w-4xl">
        <header className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold mb-4">
              Track Your{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Complaint
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Enter your complaint ID to view status, priority, and timeline.
            </p>
          </motion.div>
        </header>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              type="text"
              placeholder="Enter your Complaint ID"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              className="flex-1 h-14 text-lg"
              required
              aria-label="Complaint ID"
            />
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="px-8"
              disabled={searching}
            >
              <Search className="mr-2" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>

          {!hasSearched && complaints.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              No complaints submitted yet. Submit a complaint first, then track it here.
            </p>
          )}
        </motion.div>

        {/* Search Results */}
        {searchResult && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <article className="bg-card rounded-3xl shadow-elevated p-8 border border-border">
              <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{searchResult.title}</h2>
                  <p className="text-muted-foreground">ID: {searchResult.complaintId}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-4 py-2 rounded-full font-semibold border ${getStatusTone(searchResult.status)}`}
                  >
                    {STATUS_LABEL[searchResult.status] || searchResult.status}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full font-semibold border ${getPriorityTone(searchResult.priority)}`}
                  >
                    {PRIORITY_LABEL[searchResult.priority] || searchResult.priority}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <div className="font-semibold">{searchResult.category}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Submitted On</div>
                  <div className="font-semibold">
                    {new Date(searchResult.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Last Updated</div>
                  <div className="font-semibold">
                    {new Date(searchResult.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {searchResult.description && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3">Details</h3>
                  <div className="rounded-lg border border-border bg-background/50 p-4 text-muted-foreground">
                    {searchResult.description}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-2xl font-bold mb-6">Status Timeline</h3>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex items-start gap-4"
                    >
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-smooth ${
                            item.completed
                              ? "gradient-button text-white shadow-glow"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.completed ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                        </div>
                        {index < timeline.length - 1 && (
                          <div
                            className={`absolute top-12 left-1/2 w-0.5 h-12 -ml-px ${
                              item.completed ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        )}
                      </div>

                      <div className="flex-1 pt-2">
                        <div className="font-semibold text-lg">{item.label}</div>
                        {item.date && (
                          <div className="text-sm text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Feedback Section for Resolved Complaints */}
              {searchResult.status === "resolved" && isAuthenticated && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Star className="h-5 w-5 text-warning" />
                      Your Feedback
                    </h3>
                    {!feedback && !searchResult.feedback_submitted && (
                      <Button
                        variant="outline"
                        onClick={() => setShowFeedbackModal(true)}
                      >
                        Rate Experience
                      </Button>
                    )}
                  </div>
                  {feedback ? (
                    <FeedbackDisplay feedback={feedback} showUser={false} />
                  ) : searchResult.feedback_submitted ? (
                    <p className="text-sm text-muted-foreground">
                      Thank you for your feedback!
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Share your experience to help us improve our services.
                    </p>
                  )}
                </div>
              )}
            </article>

            <aside className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-3xl p-8 border border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Need help?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you need to add more details or have questions about your complaint, please contact support.
                  </p>
                  <Button variant="outline" onClick={() => navigate('/about')}>
                    Contact Support
                  </Button>
                </div>
              </div>
            </aside>
          </motion.section>
        )}

        {/* No Results */}
        {hasSearched && !searching && !searchResult && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
            aria-live="polite"
          >
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Complaint not found</h2>
            <p className="text-muted-foreground">
              No complaint found with ID: <span className="font-medium">{complaintId.trim()}</span>
            </p>
          </motion.section>
        )}
      </section>
    </main>

    {/* Feedback Modal */}
    {searchResult && (
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        complaint={searchResult}
        onFeedbackSubmitted={() => {
          setShowFeedbackModal(false);
        }}
        allowSkip={false}
      />
    )}
  </>
  );
};

export default TrackComplaint;
