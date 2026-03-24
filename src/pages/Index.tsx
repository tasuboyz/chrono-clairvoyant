import { useRef } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import IdentifierTabs from "@/components/IdentifierTabs";
import TrustSection from "@/components/TrustSection";
import BrandMarquee from "@/components/BrandMarquee";
import Footer from "@/components/Footer";

const Index = () => {
  const identifierRef = useRef<HTMLDivElement>(null);

  const scrollToIdentifier = (tab?: string) => {
    identifierRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <Hero
          onScrollToUpload={() => scrollToIdentifier("image")}
          onScrollToText={() => scrollToIdentifier("text")}
        />
        <IdentifierTabs ref={identifierRef} />
        <TrustSection />
        <BrandMarquee />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
