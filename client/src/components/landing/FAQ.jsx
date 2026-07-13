import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What is TeamSync?",
    answer:
      "TeamSync is a modern collaboration platform that enables teams to communicate, manage workspaces, share files, edit documents, schedule meetings, and track analytics in one place.",
  },
  {
    question: "Can multiple users collaborate simultaneously?",
    answer:
      "Yes. TeamSync supports real-time collaboration with live chat, shared workspaces, and instant synchronization.",
  },
  {
    question: "Is TeamSync secure?",
    answer:
      "Yes. It uses JWT authentication, protected routes, and role-based access control to secure user data and workspaces.",
  },
  {
    question: "Can I upload and share files?",
    answer:
      "Absolutely. Team members can upload, organize, and securely share files within their workspaces.",
  },
  {
    question: "Is TeamSync mobile responsive?",
    answer:
      "Yes. TeamSync is fully responsive and works seamlessly across desktops, tablets, and smartphones.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">

        <div className="text-center mb-14">

          <span className="text-blue-600 uppercase tracking-widest font-semibold">
            FAQ
          </span>

          <h2 className="text-5xl font-bold mt-4">
            Frequently Asked Questions
          </h2>

          <p className="text-gray-600 mt-4">
            Everything you need to know about TeamSync.
          </p>

        </div>

        <div className="space-y-5">

          {faqs.map((faq, index) => (

            <div
              key={index}
              className="border rounded-2xl overflow-hidden shadow-sm"
            >

              <button
                onClick={() => setOpen(open === index ? -1 : index)}
                className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-slate-50 transition"
              >

                <span className="font-semibold text-lg">
                  {faq.question}
                </span>

                {open === index ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}

              </button>

              {open === index && (

                <div className="px-6 pb-6 text-gray-600 leading-7">

                  {faq.answer}

                </div>

              )}

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}