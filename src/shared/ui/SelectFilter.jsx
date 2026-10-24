// A labelled <select> with an "Any" option, for filter bars.
export function SelectFilter({ label, value, options, onChange }) {
  return (
    <label className="select-filter">
      <span>{label}</span>
      <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Any</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
