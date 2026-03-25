export const Input = ({ label, className = "", ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs font-semibold text-text-secondary">
        {label}
      </label>
    )}
    <input className={`input ${className}} {...props`} />
  </div>
);
