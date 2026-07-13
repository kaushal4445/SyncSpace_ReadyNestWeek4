import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

const stats = [
  {
    number: 25,
    suffix: "+",
    title: "Active Members",
    description: "Collaborating in real time",
  },
  {
    number: 50,
    suffix: "+",
    title: "Workspaces",
    description: "Organized project spaces",
  },
  {
    number: 100,
    suffix: "+",
    title: "Documents",
    description: "Shared across teams",
  },
  {
    number: 99.9,
    suffix: "%",
    decimals: 1,
    title: "Availability",
    description: "Reliable collaboration",
  },
];

export default function Statistics() {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <span className="uppercase tracking-widest text-blue-100">
            Statistics
          </span>

          <h2 className="text-4xl md:text-5xl font-bold mt-4">
            Trusted for Modern Collaboration
          </h2>

          <p className="mt-4 text-blue-100 max-w-2xl mx-auto">
            Everything you need to build productive teams in one unified
            collaboration platform.
          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {stats.map((item, index) => (

            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center"
            >

              <div className="text-5xl font-extrabold mb-4">

                {inView && (
                  <CountUp
                    end={item.number}
                    duration={2}
                    decimals={item.decimals || 0}
                  />
                )}

                {item.suffix}

              </div>

              <h3 className="text-xl font-semibold">
                {item.title}
              </h3>

              <p className="text-blue-100 mt-3">
                {item.description}
              </p>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}