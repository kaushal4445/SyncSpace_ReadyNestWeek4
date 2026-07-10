const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  ghost:
    "bg-transparent text-primary hover:bg-primary/10 dark:hover:bg-primary/20",
};

const Button = ({
  variant = "primary",
  className = "",
  children,
  ...props
}) => (
  <button
    className={`min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
