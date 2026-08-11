const StatCard = ({ label, value, icon: Icon, accent = 'text-teal-600' }) => (
  <div className="bg-sand-50 dark:bg-teal-800 rounded-2xl shadow-card p-5 flex items-center gap-4">
    {Icon && (
      <div className={`w-11 h-11 rounded-xl bg-teal-600/10 flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
    )}
    <div>
      <p className="text-2xl font-display font-semibold text-teal-800 dark:text-white">{value}</p>
      <p className="text-xs text-teal-600/70 dark:text-white/60">{label}</p>
    </div>
  </div>
);

export default StatCard;
