export function FormSelect({
  label,
  options,
  className = 'w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700',
  selectClassName,
  getOptionKey,
  getOptionLabel,
  ...props
}) {
  const resolvedClassName = selectClassName || className;

  const selectElement = (
    <select className={resolvedClassName} {...props}>
      {options.map((option, index) => {
        const key = getOptionKey ? getOptionKey(option, index) : String(option);
        const text = getOptionLabel ? getOptionLabel(option, index) : String(option);
        const value = typeof option === 'object' && option !== null && 'value' in option ? option.value : option;
        return (
          <option key={key} value={value}>
            {text}
          </option>
        );
      })}
    </select>
  );

  if (!label) return selectElement;

  return (
    <label className="block">
      <span className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">{label}</span>
      {selectElement}
    </label>
  );
}
