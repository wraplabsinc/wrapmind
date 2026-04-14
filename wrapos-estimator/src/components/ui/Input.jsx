// src/components/ui/Input.jsx
const baseCls = [
  'w-full rounded border',
  'border-gray-200 dark:border-[#243348]',
  'bg-white dark:bg-[#0F1923]',
  'text-[#0F1923] dark:text-[#F8FAFE]',
  'placeholder:text-[#64748B] dark:placeholder:text-[#4A6380]',
  'transition-colors',
].join(' ');

export function TextInput({ className = '', height = 'h-8', ...props }) {
  return (
    <input
      className={`${baseCls} ${height} px-3 text-sm ${className}`}
      {...props}
    />
  );
}

export function SelectInput({ className = '', height = 'h-8', children, ...props }) {
  return (
    <select
      className={`${baseCls} ${height} px-3 text-sm pr-8 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function TextArea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${baseCls} px-3 py-2 text-sm resize-none ${className}`}
      {...props}
    />
  );
}

export default TextInput;
