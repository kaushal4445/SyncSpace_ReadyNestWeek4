import { motion } from "framer-motion";
import {
  Zap,
  ShieldCheck,
  Globe,
  BarChart3,
} from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built with React, Vite, Socket.IO and MongoDB for a seamless real-time experience.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Collaboration",
    description:
      "JWT authentication, protected routes and role-based access keep your workspace secure.",
  },
  {
    icon: Globe,
    title: "Access Anywhere",
    description:
      "Responsive design lets your team collaborate from desktop, tablet and mobile devices.",
  },
  {
    icon: BarChart3,
    title: "Productivity Insights",
    description:
      "Visual analytics help you track workspace activity and team performance.",
  },
];

export default function WhyChoose() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <span className="text-blue-600 font-semibold uppercase tracking-widest">
            Why TeamSync
          </span>

          <h2 className="text-4xl md:text-5xl font-bold mt-4">
            Everything Your Team Needs
          </h2>

          <p className="mt-5 text-gray-600 max-w-3xl mx-auto">
            TeamSync combines communication, collaboration, file management,
            analytics and workspace organization into one powerful platform.
          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {benefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={index}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl p-8 shadow-xl border bg-gradient-to-br from-white to-slate-50"
              >

                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">

                  <Icon
                    className="text-blue-600"
                    size={32}
                  />

                </div>

                <h3 className="text-2xl font-bold mb-4">
                  {item.title}
                </h3>

                <p className="text-gray-600 leading-7">
                  {item.description}
                </p>

              </motion.div>
            );
          })}

        </div>

      </div>
    </section>
  );
}