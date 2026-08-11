const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    {Icon && <Icon className="w-12 h-12 text-teal-600/30 mb-4" />}
    <h3 className="font-display text-lg font-semibold text-teal-800 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-teal-600/70 dark:text-white/60 max-w-sm mb-4">{message}</p>
    {action}
  </div>
);

export default EmptyState;
