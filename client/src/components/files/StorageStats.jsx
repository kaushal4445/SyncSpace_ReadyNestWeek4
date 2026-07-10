const formatSize = (bytes = 0) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const StorageStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Storage Usage</p>
        <p className="text-sm text-primary font-semibold">{formatSize(stats.totalSize)}</p>
      </div>
      <div className="space-y-2">
        {stats.byType?.map((t) => (
          <div key={t._id} className="flex items-center justify-between text-xs text-secondary">
            <span className="capitalize">{t._id}</span>
            <span>
              {t.count} files · {formatSize(t.size)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorageStats;
