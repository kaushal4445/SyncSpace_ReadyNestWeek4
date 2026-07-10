import { useRef, useEffect } from "react";
import { FiBold, FiItalic, FiUnderline, FiList, FiLink } from "react-icons/fi";

const ToolbarButton = ({ icon, onClick, label }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={label}
    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-secondary"
  >
    {icon}
  </button>
);

const RichTextEditor = ({
  value,
  onChange,
  onFocus,
  onBlur,
  onTyping,
  onCursorChange,
  remoteCursors = [],
  placeholder = "Start writing...",
}) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onCursorChange?.({
        x: rect.left,
        y: rect.top,
        offset: range.startOffset,
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [onCursorChange]);

  const exec = (command, arg) => {
    document.execCommand(command, false, arg);
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-700 px-2 py-1">
        <ToolbarButton
          icon={<FiBold />}
          label="Bold"
          onClick={() => exec("bold")}
        />
        <ToolbarButton
          icon={<FiItalic />}
          label="Italic"
          onClick={() => exec("italic")}
        />
        <ToolbarButton
          icon={<FiUnderline />}
          label="Underline"
          onClick={() => exec("underline")}
        />
        <ToolbarButton
          icon={<FiList />}
          label="Bullet list"
          onClick={() => exec("insertUnorderedList")}
        />
        <ToolbarButton
          icon={<FiLink />}
          label="Insert link"
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) exec("createLink", url);
          }}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => onFocus?.()}
        onBlur={() => onBlur?.()}
        onInput={(e) => {
          onTyping?.();
          onChange(e.currentTarget.innerHTML);
        }}
        onClick={() => onCursorChange?.({ x: 0, y: 0, offset: 0 })}
        data-placeholder={placeholder}
        className="relative min-h-[300px] p-4 text-sm outline-none max-w-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-secondary"
      >
        {remoteCursors.map((cursor) => (
          <div
            key={cursor.userId}
            className="pointer-events-none absolute z-10 -translate-y-full rounded bg-slate-900 px-2 py-1 text-[11px] text-white"
            style={{
              left: `${Math.max(8, cursor.position?.x || 8)}px`,
              top: `${Math.max(8, cursor.position?.y || 8)}px`,
            }}
          >
            {cursor.userName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RichTextEditor;
