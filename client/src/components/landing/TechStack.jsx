import { motion } from "framer-motion";
import {
  FaReact,
  FaNodeJs,
  FaGithub,
  FaDocker,
} from "react-icons/fa";

import {
  SiExpress,
  SiMongodb,
  SiTailwindcss,
  SiSocketdotio,
  SiCloudinary,
  SiJsonwebtokens,
  SiVite,
} from "react-icons/si";

const techs = [
  {
    icon: <FaReact size={45} className="text-cyan-500" />,
    name: "React",
    desc: "Modern UI Library",
  },
  {
    icon: <SiVite size={45} className="text-purple-500" />,
    name: "Vite",
    desc: "Fast Build Tool",
  },
  {
    icon: <SiTailwindcss size={45} className="text-sky-500" />,
    name: "Tailwind CSS",
    desc: "Utility First CSS",
  },
  {
    icon: <FaNodeJs size={45} className="text-green-600" />,
    name: "Node.js",
    desc: "Backend Runtime",
  },
  {
    icon: <SiExpress size={45} />,
    name: "Express",
    desc: "REST API",
  },
  {
    icon: <SiMongodb size={45} className="text-green-700" />,
    name: "MongoDB",
    desc: "Database",
  },
  {
    icon: <SiSocketdotio size={45} />,
    name: "Socket.IO",
    desc: "Real-Time Communication",
  },
  {
    icon: <SiCloudinary size={45} className="text-blue-600" />,
    name: "Cloudinary",
    desc: "Media Storage",
  },
  {
    icon: <SiJsonwebtokens size={45} className="text-orange-500" />,
    name: "JWT",
    desc: "Authentication",
  },
  {
    icon: <FaGithub size={45} />,
    name: "GitHub",
    desc: "Version Control",
  },
  {
    icon: <FaDocker size={45} className="text-blue-500" />,
    name: "Docker",
    desc: "Containerization",
  },
];

export default function TechStack() {
  return (
    <section
      id="tech"
      className="py-24 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <span className="text-blue-600 uppercase tracking-widest font-semibold">
            Tech Stack
          </span>

          <h2 className="text-5xl font-bold mt-4">
            Built with Modern Technologies
          </h2>

          <p className="text-gray-600 mt-5 max-w-3xl mx-auto">
            TeamSync is powered by a modern MERN architecture with
            real-time communication, secure authentication and
            scalable cloud services.
          </p>

        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">

          {techs.map((tech, index) => (

            <motion.div
              key={index}
              whileHover={{
                y: -8,
                scale: 1.05,
              }}
              transition={{
                duration: 0.25,
              }}
              className="bg-white rounded-3xl shadow-lg border p-8 text-center"
            >

              <div className="flex justify-center mb-6">
                {tech.icon}
              </div>

              <h3 className="text-xl font-bold">
                {tech.name}
              </h3>

              <p className="text-gray-500 mt-2">
                {tech.desc}
              </p>

            </motion.div>

          ))}

        </div>

      </div>
    </section>
  );
}