export function FormSelect({
  label,
  options,
  className = 'w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cetecGreen font-bold text-sm text-gray-700',
  selectClassName,
  optionClassName = 'bg-white text-gray-700 font-semibold',
  getOptionKey,
  getOptionLabel,
  ...props
}) {
  const resolvedClassName = selectClassName || className;

  const selectElement = (
    <select className={resolvedClassName} {...props}>
      {options.map((option, index) => {
        const isObjectOption = typeof option === 'object' && option !== null;
        const key = getOptionKey && isObjectOption ? getOptionKey(option, index) : String(isObjectOption && 'value' in option ? option.value : option);
        const text = getOptionLabel && isObjectOption ? getOptionLabel(option, index) : String(isObjectOption && 'label' in option ? option.label : option);
        const value = isObjectOption && 'value' in option ? option.value : option;
        const disabled = isObjectOption && 'disabled' in option ? Boolean(option.disabled) : false;
        return (
          <option key={key} value={value} className={optionClassName} disabled={disabled}>
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
