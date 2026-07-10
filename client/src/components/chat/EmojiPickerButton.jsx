import { useState } from "react";
import { FiSmile } from "react-icons/fi";

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "👍",
  "🙏",
  "🎉",
  "🔥",
  "😢",
  "😮",
  "❤️",
  "👏",
  "🚀",
];

const EmojiPickerButton = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="text-secondary hover:text-primary rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <FiSmile size={18} />
      </button>
      {isOpen && (
        <div className="absolute bottom-12 right-0 z-50 w-64 sm:w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Emoji
            </p>
            <span className="text-[11px] text-secondary">Tap to insert</span>
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-44 overflow-y-auto pr-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  setIsOpen(false);
                }}
                className="flex h-10 items-center justify-center rounded-xl text-xl transition-all hover:scale-105 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
