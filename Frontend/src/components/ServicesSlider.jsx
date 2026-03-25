


import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ✅ IMPORT ALL REQUIRED VIDEOS
import streetLightVideo from "@/assets/videos/Street-Light.mp4";
import wasteManagementVideo from "@/assets/videos/Waste-Management.mp4";
import waterSupplyVideo from "@/assets/videos/Water-Supply.mp4";
import publicBuildingVideo from "@/assets/videos/Public-Building.mp4";

const slides = [
  {
    title: "Street Lighting",
    description:
      "Report non-functional street lights or request new lighting installations",
    mediaType: "video",
    media: streetLightVideo,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Waste Management",
    description:
      "Report garbage collection issues, illegal dumping, or request bulk waste pickup",
    mediaType: "video",
    media: wasteManagementVideo,
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "Water Management",
    description: 
    "Report problems related to water supply, leakage, contamination, and water management services",
    mediaType: "video",
    media: waterSupplyVideo,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Public Buildings",
    description:
      "Report maintenance issues or infrastructure problems in public buildings",
    mediaType: "video",
    media: publicBuildingVideo,
    color: "from-blue-500 to-indigo-500",
  },
];

const ServicesSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // ✅ PREVENT CRASH ON REFRESH - Ensure valid slide index
  const safeSlideIndex = currentSlide >= 0 && currentSlide < slides.length ? currentSlide : 0;
  const currentSlideData = slides[safeSlideIndex];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Our{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Services
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive civic services at your fingertips
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-elevated">
            <AnimatePresence mode="wait">
              <motion.div
                key={safeSlideIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.color} opacity-90`}
                />

                <div className="relative h-full flex items-center">
                  <div className="container mx-auto px-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      {/* TEXT */}
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white"
                      >
                        <h3 className="text-4xl md:text-5xl font-bold mb-4">
                          {currentSlideData.title}
                        </h3>
                        <p className="text-xl mb-8 text-white/90">
                          {currentSlideData.description}
                        </p>
                        <Button
                          variant="outline"
                          size="lg"
                          className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                        >
                          Report Issue
                        </Button>
                      </motion.div>

                      {/* VIDEO */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center"
                      >
                        {currentSlideData.mediaType === "video" && currentSlideData.media && (
                          <video
                            key={currentSlideData.media}
                            src={currentSlideData.media}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-150 h-150 object-contain drop-shadow-2xl rounded-2xl"
                          />
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* NAV BUTTONS */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
          >
            <ChevronRight size={24} />
          </button>

          {/* DOTS */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === safeSlideIndex
                    ? "bg-primary w-8"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSlider;

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import garbageImg from "@/assets/service-garbage.png";
// import waterImg from "@/assets/service-water.png";
// import roadsImg from "@/assets/service-roads.png";
// import lightingImg from "@/assets/service-lighting.png";

// const slides = [
//   {
//     title: "Waste Management",
//     description: "Report garbage collection issues, illegal dumping, or request bulk waste pickup",
//     image: garbageImg,
//     color: "from-cyan-500 to-blue-500",
//   },
//   {
//     title: "Water Supply",
//     description: "Report water leakage, contamination, or irregular supply in your area",
//     image: waterImg,
//     color: "from-blue-500 to-indigo-500",
//   },
//   {
//     title: "Road Maintenance",
//     description: "Report potholes, broken pavements, or damaged road infrastructure",
//     image: roadsImg,
//     color: "from-indigo-500 to-purple-500",
//   },
//   {
//     title: "Street Lighting",
//     description: "Report non-functional street lights or request new lighting installations",
//     image: lightingImg,
//     color: "from-purple-500 to-pink-500",
//   },
// ];

// const ServicesSlider = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % slides.length);
//     }, 5000);
//     return () => clearInterval(timer);
//   }, []);

//   const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
//   const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

//   return (
//     <section className="py-20 bg-muted/30">
//       <div className="container mx-auto px-4">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           className="text-center mb-12"
//         >
//           <h2 className="text-4xl md:text-5xl font-bold mb-4">
//             Our <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Services</span>
//           </h2>
//           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//             Comprehensive civic services at your fingertips
//           </p>
//         </motion.div>

//         <div className="relative max-w-5xl mx-auto">
//           {/* Slider Container */}
//           <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-elevated">
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={currentSlide}
//                 initial={{ opacity: 0, x: 100 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -100 }}
//                 transition={{ duration: 0.5 }}
//                 className="absolute inset-0"
//               >
//                 <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} opacity-90`} />
                
//                 <div className="relative h-full flex items-center">
//                   <div className="container mx-auto px-8">
//                     <div className="grid md:grid-cols-2 gap-8 items-center">
//                       {/* Text Content */}
//                       <motion.div
//                         initial={{ opacity: 0, x: -50 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: 0.2 }}
//                         className="text-white"
//                       >
//                         <h3 className="text-4xl md:text-5xl font-bold mb-4">
//                           {slides[currentSlide].title}
//                         </h3>
//                         <p className="text-xl mb-8 text-white/90">
//                           {slides[currentSlide].description}
//                         </p>
//                         <Button
//                           variant="outline"
//                           size="lg"
//                           className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
//                         >
//                           Report Issue
//                         </Button>
//                       </motion.div>

//                       {/* Image */}
//                       <motion.div
//                         initial={{ opacity: 0, scale: 0.8 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ delay: 0.3 }}
//                         className="flex justify-center"
//                       >
//                         <img
//                           src={slides[currentSlide].image}
//                           alt={slides[currentSlide].title}
//                           className="w-64 h-64 object-contain drop-shadow-2xl animate-float"
//                         />
//                       </motion.div>
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//             </AnimatePresence>
//           </div>

//           {/* Navigation Buttons */}
//           <button
//             onClick={prevSlide}
//             className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
//           >
//             <ChevronLeft size={24} />
//           </button>
//           <button
//             onClick={nextSlide}
//             className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
//           >
//             <ChevronRight size={24} />
//           </button>

//           {/* Indicators */}
//           <div className="flex justify-center gap-2 mt-6">
//             {slides.map((_, index) => (
//               <button
//                 key={index}
//                 onClick={() => setCurrentSlide(index)}
//                 className={`w-3 h-3 rounded-full transition-all ${
//                   index === currentSlide
//                     ? "bg-primary w-8"
//                     : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
//                 }`}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ServicesSlider;
