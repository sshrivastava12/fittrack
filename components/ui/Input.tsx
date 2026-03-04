"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm text-text-secondary font-medium px-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            bg-card border border-separator rounded-ios px-4 py-3
            text-white placeholder-text-secondary
            focus:outline-none focus:border-primary
            transition-colors duration-150
            ${error ? "border-danger" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-danger text-sm px-1">{error}</p>
        )}
        {hint && !error && (
          <p className="text-text-secondary text-sm px-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
