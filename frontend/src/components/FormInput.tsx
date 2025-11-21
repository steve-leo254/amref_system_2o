import React from 'react';
import type { FormInputProps } from '../types';

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required,
  autocomplete,
  icon,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-gray-600">{icon}</div>}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autocomplete}
          required={required}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          } ${icon ? 'pl-10' : ''}`}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;
