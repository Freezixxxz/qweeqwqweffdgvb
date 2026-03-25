export const Button = ({
  children,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
  onClick,
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-accent hover:bg-accent/80 text-white",
    secondary: "bg-bg2 border border-brd hover:border-accent text-text-primary",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
