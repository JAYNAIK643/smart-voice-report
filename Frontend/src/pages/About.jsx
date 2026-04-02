import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Users,
  Zap,
  Mail,
  MapPin,
  Phone,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Clock,
  FileEdit,
  Trash2,
  AlertCircle,
} from "lucide-react";

const About = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    ward: "",
  });

  // Available wards list
  const wards = [
    "Ward 1",
    "Ward 2",
    "Ward 3",
    "Ward 4",
    "Ward 5",
    "Ward 6",
    "Ward 7",
    "Ward 8",
    "Ward 9",
    "Ward 10",
  ];

  const faqs = [
    {
      id: 1,
      question: "How do I submit a complaint?",
      answer:
        "You can submit a complaint through multiple ways: (1) Use the 'Submit Complaint' button on the home page, (2) Use voice input for hands-free reporting, or (3) Navigate to the Services section and select your issue category. You'll need to provide details about the issue, location, and optionally upload photos.",
      icon: <FileEdit className="h-5 w-5" />,
    },
    {
      id: 2,
      question: "How can I track my complaint status?",
      answer:
        "You can track your complaint status by clicking 'Track Complaint' on the home page or visiting your User Dashboard. Enter your Complaint ID (e.g., CMP-XXXXX) to see real-time updates including when it was assigned, current status (Pending/In Progress/Resolved), and expected resolution time.",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      id: 3,
      question: "How long does resolution typically take?",
      answer:
        "Resolution times vary based on issue type and complexity: Simple issues (street lights, garbage) are typically resolved within 3-5 days. Moderate issues (road repairs, water supply) may take 7-14 days. Complex infrastructure projects may require 30+ days. You'll receive notifications at each milestone.",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      id: 4,
      question: "How are issues prioritized?",
      answer:
        "Issues are prioritized using multiple factors: (1) Upvotes from community members, (2) Severity and safety impact, (3) Number of affected residents, (4) Available resources, and (5) Ward-level priorities. High-priority issues are escalated to Ward Administrators for faster resolution.",
      icon: <Target className="h-5 w-5" />,
    },
    {
      id: 5,
      question: "Can I edit or delete my complaint?",
      answer:
        "You can edit your complaint details only while it has 'Pending' status. Once the complaint is assigned and 'In Progress', editing is restricted to ensure accountability. If you need to make changes to an active complaint, please contact support with your Complaint ID. Deletion is not allowed to maintain transparency records.",
      icon: <FileEdit className="h-5 w-5" />,
    },
    {
      id: 6,
      question: "How does the leaderboard and points system work?",
      answer:
        "You earn points for community participation: +10 points for each complaint submitted, +5 points when others upvote your complaint, +15 bonus points when your issue is resolved. These points determine your rank on the Citizen Leaderboard. Top contributors receive special badges and recognition from municipal authorities.",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id.replace("contact-", "")]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message || !formData.ward) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields including ward selection.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.submitContactMessage(formData);

      if (response.success) {
        toast({
          title: "Message Sent Successfully!",
          description: `Your support ticket ${response.data.ticketId} has been created. We'll respond within 24-48 hours.`,
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          ward: "",
        });
      } else {
        toast({
          title: "Failed to Send",
          description: response.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <main className="pt-24 pb-20 min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SmartCity Portal
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Empowering citizens and transforming cities through technology-driven civic engagement
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Target,
                title: "Our Mission",
                description: "To bridge the gap between citizens and municipal authorities through seamless digital communication",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Users,
                title: "Our Vision",
                description: "Creating smarter, more responsive cities where every voice is heard and every issue is addressed",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Zap,
                title: "Our Impact",
                description: "25,000+ issues resolved, 10,000+ active users, and countless improved neighborhoods",
                color: "from-orange-500 to-red-500",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="p-8 bg-card rounded-3xl shadow-card border border-border hover:shadow-elevated transition-all"
              >
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.color} mb-6 shadow-glow`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">Help Center</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about using SmartCity Portal
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center gap-4 p-6 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {faq.icon}
                  </div>
                  <span className="flex-1 font-semibold text-foreground">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                      openFaq === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === faq.id ? "auto" : 0,
                    opacity: openFaq === faq.id ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pl-20">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get in{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Touch
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Have questions? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full gradient-button flex items-center justify-center flex-shrink-0 shadow-glow">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Email</div>
                      <div className="text-muted-foreground">naikjay643@gmail.com</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full gradient-button flex items-center justify-center flex-shrink-0 shadow-glow">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Phone</div>
                      <div className="text-muted-foreground">9307707643</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full gradient-button flex items-center justify-center flex-shrink-0 shadow-glow">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Address</div>
                      <div className="text-muted-foreground">
                        123 Smart City Boulevard<br />
                        Tech District, TC 12345
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl gradient-hero shadow-elevated">
                <h4 className="text-2xl font-bold text-white mb-4">Office Hours</h4>
                <div className="space-y-2 text-white/90">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-semibold">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-semibold">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-semibold">Closed</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form
                onSubmit={handleSubmit}
                className="space-y-6 p-8 bg-card rounded-3xl shadow-card border border-border"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Send us a Message</h3>
                </div>

                <div>
                  <Label htmlFor="contact-name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    required
                    placeholder="Your full name"
                    className="mt-2"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="mt-2"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="contact-subject">
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-subject"
                    required
                    placeholder="How can we help?"
                    className="mt-2"
                    value={formData.subject}
                    onChange={handleInputChange}
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="contact-ward">
                    Ward <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.ward}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, ward: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact-message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="contact-message"
                    required
                    placeholder="Describe your query in detail..."
                    className="mt-2 min-h-32"
                    value={formData.message}
                    onChange={handleInputChange}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formData.message.length}/2000 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your message will be assigned a ticket ID for tracking
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
