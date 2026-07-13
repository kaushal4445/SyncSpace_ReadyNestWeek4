import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
      <div className="max-w-5xl mx-auto px-6 text-center">

        <h2 className="text-5xl font-bold">
          Ready to Transform Team Collaboration?
        </h2>

        <p className="mt-6 text-xl text-blue-100">
          Join TeamSync today and experience real-time collaboration,
          secure workspaces, powerful analytics, and seamless teamwork.
        </p>

        <Link
          to="/register"
          className="inline-flex items-center gap-3 mt-10 bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
        >
          Get Started
          <ArrowRight size={20} />
        </Link>

      </div>
    </section>
  );
}