type RadioProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
};

const baseClass = 'cursor-pointer accent-blue-600';
const labelClass =
  'flex items-center gap-1.5 text-sm text-zinc-500 has-checked:text-blue-600 has-checked:font-medium cursor-pointer';

export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <label className={labelClass}>
      <input
        type="radio"
        className={`${baseClass} ${className ?? ''}`}
        {...props}
      />
      {label}
    </label>
  );
}
