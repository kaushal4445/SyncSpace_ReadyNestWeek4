import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Background Blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-300 rounded-full blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-12 items-center">

        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-4 py-1 mb-5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
            🚀 Modern Team Collaboration Platform
          </span>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Collaborate
            <span className="text-blue-600"> Smarter.</span>
            <br />
            Build Together.
          </h1>

          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            TeamSync helps teams manage workspaces, collaborate on documents,
            chat in real time, share files, schedule meetings, and track
            productivity—all in one secure platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>

            <a
              href="#showcase"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
            >
              <PlayCircle size={18} />
              View Demo
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-gray-600">
            <div>✔ Real-Time Chat</div>
            <div>✔ File Sharing</div>
            <div>✔ Analytics</div>
            <div>✔ Workspace Management</div>
          </div>
        </motion.div>

        {/* Right Side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="rounded-3xl overflow-hidden shadow-2xl border bg-white">
            <img
              src="/images/dashboard-preview.png"
              alt="TeamSync Dashboard"
              className="w-full"
            />
          </div>

          <div className="absolute -bottom-6 -left-6 bg-white shadow-lg rounded-xl p-4">
            <p className="text-sm text-gray-500">Active Members</p>
            <h3 className="text-2xl font-bold text-blue-600">25+</h3>
          </div>

          <div className="absolute -top-6 -right-6 bg-white shadow-lg rounded-xl p-4">
            <p className="text-sm text-gray-500">Projects</p>
            <h3 className="text-2xl font-bold text-indigo-600">100+</h3>
          </div>
        </motion.div>

      </div>
    </section>
  );
}