import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Clock, Target, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { trackAdvisor } from "@/lib/advisor/analytics";

interface Props {
  onStart: () => void;
}

export default function AdvisorHero({ onStart }: Props) {
  useEffect(() => {
    trackAdvisor("hero_view");
  }, []);

  const handleStart = () => {
    trackAdvisor("wizard_start");
    onStart();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-teal-500 text-white">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          AI-powered career guidance
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold mb-5 tracking-tight"
        >
          Find your perfect <br className="hidden md:block" />
          learning pathway
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10"
        >
          Answer 7 quick questions and get a personalised recommendation across our Certificates, Bootcamps, and Talent Accelerator — built around your goal, time, and budget.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button
            size="lg"
            onClick={handleStart}
            className="bg-white text-indigo-700 hover:bg-white/90 hover-lift text-base px-8 py-6 rounded-full font-semibold shadow-2xl"
          >
            Start your assessment
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="mt-4 text-sm text-white/80">Takes about 2 minutes • Free • No signup required</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-16">
          {[
            { icon: Target, title: "Honest fit", desc: "We won't sell you the most expensive option — just the most aligned." },
            { icon: Clock, title: "Fast & free", desc: "A 2-minute assessment plus an instant pathway plan." },
            { icon: MessageCircle, title: "Refine with AI", desc: "Chat with the advisor to compare or ask follow-ups." },
          ].map((f) => (
            <div key={f.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-left">
              <f.icon className="w-6 h-6 mb-2 text-white/90" />
              <div className="font-semibold mb-1">{f.title}</div>
              <div className="text-sm text-white/80">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}