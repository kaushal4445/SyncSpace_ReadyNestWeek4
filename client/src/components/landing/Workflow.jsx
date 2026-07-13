import { motion } from "framer-motion";
import {
  UserPlus,
  LayoutDashboard,
  Users,
  MessageCircle,
  FileText,
  BarChart3,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create an Account",
    description:
      "Sign up securely and access your personalized collaboration workspace.",
  },
  {
    icon: LayoutDashboard,
    title: "Create a Workspace",
    description:
      "Organize projects with dedicated workspaces for every team.",
  },
  {
    icon: Users,
    title: "Invite Your Team",
    description:
      "Add members instantly and assign collaboration roles.",
  },
  {
    icon: MessageCircle,
    title: "Chat & Communicate",
    description:
      "Stay connected with real-time messaging and notifications.",
  },
  {
    icon: FileText,
    title: "Collaborate on Documents",
    description:
      "Share, edit and manage documents together in one place.",
  },
  {
    icon: BarChart3,
    title: "Track Productivity",
    description:
      "Monitor activity with analytics and performance insights.",
  },
];

export default function Workflow() {
  return (
    <section
      id="workflow"
      className="py-24 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <span className="text-blue-600 font-semibold uppercase tracking-wider">
            Workflow
          </span>

          <h2 className="text-4xl font-bold mt-4">
            How TeamSync Works
          </h2>

          <p className="mt-5 text-gray-600 max-w-3xl mx-auto">
            Start collaborating in minutes with a simple workflow designed
            for modern teams.
          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl shadow-lg p-8 border"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                  <Icon className="text-blue-600" size={30} />
                </div>

                <div className="text-sm font-bold text-blue-600 mb-2">
                  STEP {index + 1}
                </div>

                <h3 className="text-2xl font-semibold mb-4">
                  {step.title}
                </h3>

                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            );
          })}

        </div>

      </div>
    </section>
  );
}