export const Input = ({
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-bg border border-brd rounded-lg p-2.5 text-text-primary focus:border-accent outline-none transition-colors"
      />
    </div>
  );
};
