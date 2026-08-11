const Card = ({ children, className = '' }) => (
  <div className={`bg-sand-50 dark:bg-teal-800 rounded-2xl shadow-card p-6 ${className}`}>{children}</div>
);

export default Card;
