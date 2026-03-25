import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, ArrowUp, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { useState, useEffect } from "react";

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Submit Complaint", path: "/submit" },
    { name: "Track Status", path: "/track" },
    { name: "About Us", path: "/about" },
  ];

  const socialLinks = [
    { icon: Facebook, label: "Facebook", url: "#" },
    { icon: Twitter, label: "Twitter", url: "#" },
    { icon: Linkedin, label: "LinkedIn", url: "#" },
    { icon: Instagram, label: "Instagram", url: "#" },
  ];

  return (
    <>
      <footer className="relative mt-20 overflow-hidden">
        {/* Wave Animation Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent animate-pulse" />
        
        {/* Gradient Background */}
        <div className="gradient-hero">
          <div className="container mx-auto px-4 py-16">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
            >
              {/* Logo & About Section */}
              <motion.div variants={itemVariants} className="space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
                    <span className="text-2xl font-bold text-white">SC</span>
                  </div>
                  <span className="text-xl font-bold text-white">Smart City</span>
                </motion.div>
                <p className="text-white/90 text-sm leading-relaxed">
                  Connecting Citizens & Government for a Smarter Tomorrow. Building a transparent and efficient civic ecosystem.
                </p>
              </motion.div>

              {/* Quick Links */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                  Quick Links
                </h3>
                <ul className="space-y-2">
                  {quickLinks.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path}>
                        <motion.span
                          className="text-white/80 hover:text-white transition-colors text-sm inline-block relative group"
                          whileHover={{ x: 5 }}
                        >
                          {link.name}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
                        </motion.span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Contact Info */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                  Contact Info
                </h3>
                <ul className="space-y-3">
                  <motion.li
                    className="flex items-start gap-3 text-white/80 text-sm"
                    whileHover={{ x: 5 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    </motion.div>
                    <span>123 Smart City Drive, Innovation District, Metro City - 100001</span>
                  </motion.li>
                  <motion.li
                    className="flex items-center gap-3 text-white/80 text-sm"
                    whileHover={{ x: 5 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Phone className="w-5 h-5 flex-shrink-0" />
                    </motion.div>
                    <span>+91 1800-XXX-XXXX</span>
                  </motion.li>
                  <motion.li
                    className="flex items-center gap-3 text-white/80 text-sm"
                    whileHover={{ x: 5 }}
                  >
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Mail className="w-5 h-5 flex-shrink-0" />
                    </motion.div>
                    <span>support@smartcity.gov.in</span>
                  </motion.li>
                </ul>
              </motion.div>

              {/* Social Media */}
              <motion.div variants={itemVariants} className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                  Follow Us
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  Stay connected for updates and announcements
                </p>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.label}
                      href={social.url}
                      aria-label={social.label}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all shadow-glow"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Glowing Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-px bg-gradient-to-r from-transparent via-white/50 to-transparent my-8"
            />

            {/* Bottom Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-center text-white/70 text-sm"
            >
              <p>© {new Date().getFullYear()} Smart City Portal. All rights reserved.</p>
              <p className="mt-1">Developed with ❤️ for a Better Tomorrow</p>
            </motion.div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: showBackToTop ? 1 : 0,
          scale: showBackToTop ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full gradient-button text-white shadow-elevated flex items-center justify-center z-50 hover:shadow-glow transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </>
  );
};

export default Footer;
