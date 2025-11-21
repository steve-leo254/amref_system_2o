import React from 'react';
import type { CheckboxProps } from '../types';

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  label,
  checked,
  onChange,
  required,
}) => {
  return (
    <div className="flex items-start mb-3">
      <div className="flex items-center h-5">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="text-gray-700 cursor-pointer">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
    </div>
  );
};

export default Checkbox;
