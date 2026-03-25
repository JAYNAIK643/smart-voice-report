import { motion } from "framer-motion";
import { Zap, Shield, Clock, BarChart } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast Response",
    description: "Issues are prioritized and assigned to relevant departments within hours",
    color: "from-yellow-400 to-orange-500",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Your data is encrypted and protected with industry-standard security",
    color: "from-green-400 to-emerald-500",
  },
  {
    icon: Clock,
    title: "24/7 Tracking",
    description: "Monitor your complaint status anytime, anywhere with real-time updates",
    color: "from-blue-400 to-cyan-500",
  },
  {
    icon: BarChart,
    title: "Data Analytics",
    description: "City officials use insights to improve services and infrastructure",
    color: "from-purple-400 to-pink-500",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Platform
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with cutting-edge technology to serve you better
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="relative p-8 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-all duration-300">
                {/* Gradient Background */}
                <div className="absolute inset-0 gradient-card rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-6 shadow-glow`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
