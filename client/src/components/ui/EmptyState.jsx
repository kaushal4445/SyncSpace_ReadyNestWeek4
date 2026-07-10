const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    {icon && <div className="text-4xl text-secondary mb-3">{icon}</div>}
    <h3 className="text-lg font-semibold">{title}</h3>
    {description && <p className="text-secondary text-sm mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
