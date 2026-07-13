import { motion } from "framer-motion";
import {
  MessageSquare,
  FileText,
  FolderOpen,
  CalendarDays,
  BarChart3,
  Users,
  Bell,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description:
      "Communicate instantly with your teammates using fast and reliable real-time messaging.",
  },
  {
    icon: FileText,
    title: "Collaborative Documents",
    description:
      "Create, edit, and organize documents together inside shared workspaces.",
  },
  {
    icon: FolderOpen,
    title: "File Management",
    description:
      "Upload, organize, preview, and securely share files across your team.",
  },
  {
    icon: CalendarDays,
    title: "Calendar & Meetings",
    description:
      "Schedule meetings, deadlines, and important events in one centralized calendar.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track workspace activity, productivity, and collaboration through interactive charts.",
  },
  {
    icon: Users,
    title: "Workspace Management",
    description:
      "Create multiple workspaces, invite members, and manage team collaboration effortlessly.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay informed with instant notifications for messages, file updates, and workspace activity.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description:
      "JWT-based authentication and protected routes keep your data secure and private.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-blue-600 font-semibold uppercase tracking-widest">
            Features
          </span>

          <h2 className="text-4xl md:text-5xl font-bold mt-4">
            Everything You Need to Collaborate
          </h2>

          <p className="mt-5 text-gray-600 max-w-3xl mx-auto text-lg">
            TeamSync combines communication, document collaboration, file
            management, analytics, and workspace organization into one modern
            collaboration platform.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                whileHover={{
                  y: -10,
                  scale: 1.03,
                }}
                className="group bg-white rounded-3xl p-8 shadow-md border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition mb-6">
                  <Icon
                    size={30}
                    className="text-blue-600 group-hover:text-white transition"
                  />
                </div>

                <h3 className="text-xl font-bold mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-7">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}

        </div>
      </div>
    </section>
  );
}