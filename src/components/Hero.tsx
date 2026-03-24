import { motion } from "framer-motion";
import { Camera, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onScrollToUpload: () => void;
  onScrollToText: () => void;
}

const Hero = ({ onScrollToUpload, onScrollToText }: HeroProps) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center grain-overlay overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-6">
            Powered by Artificial Intelligence
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
            Identifica il Tuo
            <br />
            <span className="text-primary">Orologio</span> con l'AI
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-body font-light">
            Carica una foto o descrivi l'orologio. L'intelligenza artificiale lo riconoscerà in pochi secondi.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <Button variant="gold" size="lg" className="text-base px-8 py-6" onClick={onScrollToUpload}>
            <Camera className="mr-2 h-5 w-5" />
            Carica Foto
          </Button>
          <Button variant="gold-outline" size="lg" className="text-base px-8 py-6" onClick={onScrollToText}>
            <PenLine className="mr-2 h-5 w-5" />
            Descrivi a Parole
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
