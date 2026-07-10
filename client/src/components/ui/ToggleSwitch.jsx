const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-secondary">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <span
        className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

export default ToggleSwitch;
