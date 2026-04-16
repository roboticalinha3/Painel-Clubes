export function FormTextInput({
  label,
  className = 'w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700',
  inputClassName,
  ...props
}) {
  const resolvedClassName = inputClassName || className;

  if (!label) {
    return <input className={resolvedClassName} {...props} />;
  }

  return (
    <label className="block">
      <span className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">{label}</span>
      <input className={resolvedClassName} {...props} />
    </label>
  );
}
