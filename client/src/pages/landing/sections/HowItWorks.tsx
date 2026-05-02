import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Create a project",
    description: "Start a new workspace for your team. You become the Admin automatically.",
  },
  {
    step: "02",
    title: "Invite your team",
    description: "Search by email and add members. Assign admin or member roles.",
  },
  {
    step: "03",
    title: "Assign & track tasks",
    description: "Create tasks, set priorities, assign due dates. Members progress them through the board.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
            Three steps to organized teamwork
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            No complicated setup. Get started in under a minute.
          </p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-6 group"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center text-lg font-bold text-violet-400 group-hover:from-violet-600/30 group-hover:to-indigo-600/30 transition-all">
                {item.step}
              </div>

              <div className="pt-1">
                <h3 className="text-xl font-semibold text-zinc-100 mb-1">
                  {item.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
