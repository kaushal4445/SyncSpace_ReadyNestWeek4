const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-200",
  danger: "bg-red-500 text-white hover:bg-red-600",
  ghost: "bg-transparent text-primary hover:bg-primary/10",
};

const Button = ({ variant = "primary", className = "", children, ...props }) => (
  <button
    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
