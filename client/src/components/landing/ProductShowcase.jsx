import { motion } from "framer-motion";

const screenshots = [
  {
    title: "Dashboard",
    image: "/images/dashboard.png",
  },
  {
    title: "Documents",
    image: "/images/documents.png",
  },
  {
    title: "Workspace Chat",
    image: "/images/chat.png",
  },
  {
    title: "Analytics",
    image: "/images/analytics.png",
  },
];

export default function ProductShowcase() {
  return (
    <section
      id="showcase"
      className="py-24 bg-gradient-to-b from-white to-slate-100"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold uppercase tracking-wider">
            Product Preview
          </span>

          <h2 className="text-4xl font-bold mt-3">
            Explore TeamSync in Action
          </h2>

          <p className="mt-5 text-gray-600 max-w-2xl mx-auto">
            Experience an intuitive collaboration platform designed to improve
            teamwork with real-time communication, shared documents,
            analytics, and workspace management.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">

          {screenshots.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl overflow-hidden shadow-xl border"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full"
              />

              <div className="p-6">
                <h3 className="text-2xl font-semibold">
                  {item.title}
                </h3>

                <p className="text-gray-600 mt-2">
                  Beautiful, responsive and optimized for collaboration.
                </p>
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}