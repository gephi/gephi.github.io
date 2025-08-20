import type { FC } from "react";

interface Props {
  options: {
    values: {
      value: string;
      count: number;
    }[];
    total: number;
  };
  onChange: (value: string, checked: boolean) => void;
  selected: string[];
}

export const CheckboxInputGroup: FC<Props> = ({ options, selected, onChange }) => {
  return (
    <div className="checkbox-group">
      {options.values.map((o) => (
        <div key={o.value} className="checkbox d-flex align-items-center gap-2">
          <input
            type="checkbox"
            id={`version-checkbox-${o.value}`}
            checked={selected.includes(o.value)}
            onChange={(e) => onChange(o.value, e.target.checked)}
            className="form-check-input"
          />
          <div className="flex-grow-1 position-relative">
            <label className="form-check-label" htmlFor={`version-checkbox-${o.value}`}>
              {o.value}
            </label>
            <div className="bar bg-primary" style={{ width: `${(o.count / options.total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
