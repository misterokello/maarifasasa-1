import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const STAGES = [
  "Reading your responses...",
  "Loading our course catalog...",
  "Matching against decision rules...",
  "Crafting your honest pathway...",
];

export default function ThinkingState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-500 mb-6 shadow-2xl"
        >
          <Sparkles className="w-9 h-9 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-3">The advisor is thinking...</h2>
        <p className="text-muted-foreground mb-6">
          Reviewing every active programme to find the most honest fit for you.
        </p>
        <ul className="space-y-2 text-left">
          {STAGES.map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.6 }}
              className="text-sm text-muted-foreground flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {s}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}