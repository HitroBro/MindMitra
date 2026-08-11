import { useEffect, useState } from 'react';
import { Search, FileText, Image as ImageIcon, Music, Video, Download, Bookmark, Library } from 'lucide-react';
import toast from 'react-hot-toast';
import { resourceApi } from '../../services/resource.api';
import { bookmarkApi } from '../../services/bookmark.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';

const typeIcon = { pdf: FileText, image: ImageIcon, audio: Music, video: Video, article: FileText };

const ResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    resourceApi.getAll({ search: search || undefined, type: type || undefined })
      .then((res) => setResources(res.data.data.resources))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleDownload = async (r) => {
    try {
      await resourceApi.trackDownload(r._id);
      window.open(r.fileUrl, '_blank');
    } catch (err) {
      window.open(r.fileUrl, '_blank');
    }
  };

  const handleBookmark = async (r) => {
    try {
      await bookmarkApi.create({ resourceType: 'resource', resourceId: r._id });
      toast.success('Bookmarked');
    } catch (err) {
      toast.error('Failed to bookmark');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Resource Library</h1>

      <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="focus-ring w-full rounded-xl border border-teal-600/20 bg-white dark:bg-teal-900 pl-9 pr-4 py-2.5 text-sm text-teal-900 dark:text-white"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="focus-ring rounded-xl border border-teal-600/20 bg-white dark:bg-teal-900 px-4 py-2.5 text-sm text-teal-900 dark:text-white">
          <option value="">All types</option>
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
        </select>
        <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">Search</button>
      </form>

      {loading ? (
        <span className="loading loading-spinner text-teal-600" />
      ) : resources.length === 0 ? (
        <EmptyState icon={Library} title="No resources found" message="Try a different search or check back later." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {resources.map((r) => {
            const Icon = typeIcon[r.type] || FileText;
            return (
              <Card key={r._id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-600 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-teal-900 dark:text-white truncate">{r.title}</p>
                    <p className="text-xs text-teal-600/70 mb-2 line-clamp-2">{r.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <button onClick={() => handleDownload(r)} className="flex items-center gap-1 text-teal-600 hover:underline">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button onClick={() => handleBookmark(r)} className="flex items-center gap-1 text-teal-600/70 hover:text-teal-700">
                        <Bookmark className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
