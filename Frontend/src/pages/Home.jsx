import HeroSection from "@/components/HeroSection";
import ServicesSlider from "@/components/ServicesSlider";
import FeaturesSection from "@/components/FeaturesSection";
import TrendingIssues from "@/components/TrendingIssues";
import Leaderboard from "@/components/Leaderboard";

const Home = () => {
  console.log('🏠 Home component rendering');
  
  return (
    <main>
      <HeroSection />
      <ServicesSlider />
      <TrendingIssues />
      <FeaturesSection />
      <Leaderboard />
    </main>
  );
};

export default Home;
