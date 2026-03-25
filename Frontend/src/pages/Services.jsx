import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, Droplet, Construction, Lightbulb, TreePine, Building } from "lucide-react";

const services = [
  {
    icon: Trash2,
    title: "Waste Management",
    description: "Report garbage collection issues, illegal dumping, or request bulk waste pickup services",
    color: "from-cyan-500 to-blue-500",
    items: ["Missed Collection", "Illegal Dumping", "Bulk Waste", "Bin Damage"],
  },
  {
    icon: Droplet,
    title: "Water Supply",
    description: "Report water leakage, contamination, supply issues, or pressure problems",
    color: "from-blue-500 to-indigo-500",
    items: ["Leakage", "Contamination", "No Supply", "Low Pressure"],
  },
  {
    icon: Construction,
    title: "Road Maintenance",
    description: "Report potholes, damaged pavements, broken sidewalks, or drainage issues",
    color: "from-indigo-500 to-purple-500",
    items: ["Potholes", "Damaged Roads", "Broken Sidewalks", "Drainage"],
  },
  {
    icon: Lightbulb,
    title: "Street Lighting",
    description: "Report non-functional lights, request new installations, or report damaged poles",
    color: "from-yellow-400 to-orange-500",
    items: ["Not Working", "Flickering", "Damaged Pole", "New Installation"],
  },
  {
    icon: TreePine,
    title: "Parks & Gardens",
    description: "Report maintenance issues, damaged equipment, or request tree trimming",
    color: "from-green-400 to-emerald-500",
    items: ["Damaged Equipment", "Tree Trimming", "Overgrown Grass", "Litter"],
  },
  {
    icon: Building,
    title: "Public Buildings",
    description: "Report maintenance issues in public buildings, damaged facilities, or safety concerns",
    color: "from-purple-500 to-pink-500",
    items: ["Building Damage", "Safety Issues", "Cleanliness", "Access Problems"],
  },
];

const Services = () => {
  return (
    <main className="pt-24 pb-20 min-h-screen bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Services</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose a service category to report your civic issue. Our team will respond promptly to address your concerns.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group"
            >
              <div className="h-full p-8 rounded-3xl bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300">
                {/* Icon */}
                <motion.div
                  className={`inline-flex p-5 rounded-2xl bg-gradient-to-br ${service.color} mb-6 shadow-glow`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <service.icon className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title & Description */}
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Issue Types */}
                <div className="mb-6">
                  <div className="text-sm font-semibold text-foreground mb-3">Common Issues:</div>
                  <div className="flex flex-wrap gap-2">
                    {service.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-medium bg-muted rounded-full text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Button */}
                <Link to="/submit" state={{ service: service.title }}>
                  <Button variant="gradient" className="w-full">
                    Report Issue
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 p-12 rounded-3xl gradient-hero shadow-elevated text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Can't Find Your Issue?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Submit a general complaint and our team will categorize and address it appropriately.
          </p>
          <Link to="/submit">
            <Button variant="outline" size="lg" className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30">
              Submit General Complaint
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
};

export default Services;
