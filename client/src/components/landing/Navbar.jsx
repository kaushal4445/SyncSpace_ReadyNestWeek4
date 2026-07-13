import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link to="/" className="text-3xl font-bold text-blue-600">
          TeamSync
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="hover:text-blue-600 transition">
            Features
          </a>

          <a href="#showcase" className="hover:text-blue-600 transition">
            Showcase
          </a>

          <a href="#workflow" className="hover:text-blue-600 transition">
            How It Works
          </a>

          <a href="#faq" className="hover:text-blue-600 transition">
            FAQ
          </a>
        </nav>

        {/* Buttons */}
        <div className="hidden md:flex gap-4">
          <Link
            to="/login"
            className="px-5 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden px-6 pb-6 bg-white border-t">

          <div className="flex flex-col gap-4 mt-4">

            <a href="#features">Features</a>

            <a href="#showcase">Showcase</a>

            <a href="#workflow">How It Works</a>

            <a href="#faq">FAQ</a>

            <Link
              to="/login"
              className="border border-blue-600 rounded-lg text-center py-2 text-blue-600"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="bg-blue-600 rounded-lg py-2 text-center text-white"
            >
              Get Started
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}