"use client";

import * as React from "react";
import { Input } from "./input";

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange: (value: number | undefined) => void;
  value: number | undefined;
}

export function NumericInput({ onChange, value, ...props }: NumericInputProps) {
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (val === '') {
      onChange(undefined);
      return;
    }

    // Remove any non-numeric characters except decimal point and minus sign
    const sanitizedValue = val.replace(/[^\d.-]/g, '');
    const num = parseFloat(sanitizedValue);
    
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <Input
      type="number"
      step="any"
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
      value={value !== undefined ? String(value) : ''}
      onChange={handleChange}
      {...props}
    />
  );
}