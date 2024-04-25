import HeroSection from "./components/hero-section";
import AboutInahefSection from "./components/about-inahef-section";
import FeatureSection from "./components/feature-section";
import ScheduleSection from "./components/schedule-section";
import OrganizerSection from "./components/organizer-section";
import ContactUsSection from "./components/contact-us-section";
import FooterSection from "./components/footer-section";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <AboutInahefSection />
      <FeatureSection />
      <ScheduleSection />
      <OrganizerSection />
      <ContactUsSection />
      <FooterSection />
    </div>
  );
}
