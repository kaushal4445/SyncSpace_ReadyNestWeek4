import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-14">

        <div className="grid md:grid-cols-4 gap-10">

          <div>
            <h2 className="text-3xl font-bold text-blue-400">
              TeamSync
            </h2>

            <p className="mt-4 text-slate-400">
              A modern collaboration platform for teams to communicate,
              manage workspaces, share files and stay productive.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>

            <ul className="space-y-2 text-slate-400">
              <li>Features</li>
              <li>Analytics</li>
              <li>Documents</li>
              <li>Workspaces</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>

            <ul className="space-y-2 text-slate-400">
              <li>FAQ</li>
              <li>Documentation</li>
              <li>GitHub</li>
              <li>Support</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Connect</h3>

            <div className="flex gap-5 text-2xl">

              <a href="#">
                <FaGithub />
              </a>

              <a href="#">
                <FaLinkedin />
              </a>

              <a href="#">
                <FaEnvelope />
              </a>

            </div>

          </div>

        </div>

        <div className="border-t border-slate-700 mt-10 pt-6 text-center text-slate-400">
          © 2026 TeamSync • Built with ❤️ using the MERN Stack
        </div>

      </div>
    </footer>
  );
}