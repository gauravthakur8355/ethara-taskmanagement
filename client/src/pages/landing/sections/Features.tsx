import { motion } from "framer-motion";
import { ClipboardCheck, Users, Shield, BarChart3 } from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Kanban Workflow",
    description: "Visual task board with TODO, In Progress, In Review, and Done columns. Drag tasks through your pipeline.",
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Admins create and assign. Members focus on their tasks. Strict permissions keep everything organized.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite members by email, assign tasks, and track who's working on what across all your projects.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    description: "See overdue tasks, status distribution, and team workload at a glance. Data-driven decisions.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Features() {
  return (
    <section className="py-24 px-6" id="features">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
            Everything your team needs
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Built with a strict RBAC workflow that keeps admins in control and members focused.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-7 hover:border-zinc-700 transition-all hover:bg-zinc-900/80"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Subtle hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
