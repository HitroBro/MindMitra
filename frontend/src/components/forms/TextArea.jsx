const TextArea = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-teal-800 dark:text-white/90">{label}</label>}
    <textarea
      className={`focus-ring w-full rounded-xl border border-teal-600/20 bg-white dark:bg-teal-900 px-4 py-2.5 text-sm text-teal-900 dark:text-white placeholder:text-teal-600/40 ${error ? 'border-clay-500' : ''} ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-clay-600">{error}</span>}
  </div>
);

export default TextArea;
