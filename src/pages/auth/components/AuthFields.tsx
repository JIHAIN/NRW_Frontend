import React, { memo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// --------------------------------------------------------------------------
// 공통 스타일 정의
// --------------------------------------------------------------------------
const baseInputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all";

const baseButtonClass =
  "w-full py-2 rounded-xl font-semibold transition-colors duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed";

// --------------------------------------------------------------------------
// Input Field 컴포넌트
// --------------------------------------------------------------------------
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorText?: string;
}

export const InputField = memo(function InputField({
  label,
  id,
  type = "text",
  className,
  errorText,
  ...props
}: InputFieldProps) {
  const inputId = id || label;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        className={`${baseInputClass} ${className || ""}`}
        {...props}
      />
      {errorText && <p className="text-xs text-red-500">{errorText}</p>}
    </div>
  );
});

// --------------------------------------------------------------------------
// Password Input 컴포넌트
// --------------------------------------------------------------------------
interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const PasswordInput = memo(function PasswordInput({
  label,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className={`${baseInputClass} pr-10`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
});

// --------------------------------------------------------------------------
// Primary Button 컴포넌트
// --------------------------------------------------------------------------
interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const PrimaryButton = memo(function PrimaryButton({
  children,
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`${baseButtonClass} ${
        !disabled ? "bg-blue-600 text-white hover:bg-blue-700" : ""
      } ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
});
