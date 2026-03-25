import clsx from "clsx";

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const variants = {
    primary: "btn-primary",
    success: "btn-success",
    secondary: "btn-secondary",
    danger:
      "btn bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
