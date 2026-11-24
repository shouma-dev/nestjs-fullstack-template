import { Input, type InputProps } from 'antd';

export function SearchField({ prefix, allowClear = true, ...props }: InputProps) {
  return (
    <Input {...props} allowClear={allowClear} prefix={prefix ?? (
      <svg className="workos-search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="m10.25 10.25 3.25 3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    )} />
  );
}
