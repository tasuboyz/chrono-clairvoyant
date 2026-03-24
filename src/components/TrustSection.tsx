import { motion } from "framer-motion";
import { Brain, ClipboardList, Link2, ShieldCheck } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Avanzata", desc: "Riconoscimento visivo di precisione con intelligenza artificiale di ultima generazione" },
  { icon: ClipboardList, title: "Scheda Completa", desc: "Specifiche tecniche, prezzo stimato e descrizione esperta" },
  { icon: Link2, title: "Link Utili", desc: "Collegamenti diretti a Chrono24, sito ufficiale e recensioni" },
  { icon: ShieldCheck, title: "Garanzia LuxuryInStock", desc: "Ogni orologio venduto ha 12 mesi di garanzia di autenticità" },
];

const TrustSection = () => (
  <section className="py-20 border-t border-border">
    <div className="container px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-card p-6 rounded-lg hover:scale-[1.02] gold-glow-hover transition-all duration-300"
          >
            <f.icon className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm font-body">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSection;
