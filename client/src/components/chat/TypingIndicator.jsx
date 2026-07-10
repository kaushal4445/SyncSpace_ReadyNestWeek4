const TypingIndicator = ({ userName }) => {
  if (!userName) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-secondary italic">
      <span className="flex gap-0.5">
        <span className="animate-bounce">.</span>
        <span className="animate-bounce [animation-delay:0.1s]">.</span>
        <span className="animate-bounce [animation-delay:0.2s]">.</span>
      </span>
      {userName} is typing
    </div>
  );
};

export default TypingIndicator;
