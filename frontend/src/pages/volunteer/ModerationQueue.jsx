import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Flag, Trash2 } from 'lucide-react';
import { volunteerActivityApi } from '../../services/volunteerActivity.api';
import { forumApi } from '../../services/forum.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';

const ModerationQueue = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => volunteerActivityApi.getRecentPosts().then((res) => setPosts(res.data.data.posts)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleRemove = async (id) => {
    try {
      await forumApi.deletePost(id);
      toast.success('Post removed');
      load();
    } catch (err) {
      toast.error('Failed to remove post');
    }
  };

  if (loading) return <span className="loading loading-spinner text-teal-600" />;

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Moderation Queue</h1>
      {posts.length === 0 ? (
        <EmptyState icon={Flag} title="Nothing to review" message="No active posts are available for moderation." />
      ) : (
        posts.map((p) => (
          <Card key={p._id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-teal-900 dark:text-white">{p.title}</p>
                <p className="text-sm text-teal-800/70 dark:text-white/60 mt-1">{p.content}</p>
                {typeof p.reportCount !== 'undefined' && (
                  <p className="text-xs text-clay-600 mt-2">Reported {p.reportCount} time(s)</p>
                )}
              </div>
              <button onClick={() => handleRemove(p._id)} className="btn btn-sm btn-outline border-clay-500 text-clay-600 hover:bg-clay-500 hover:text-white rounded-full gap-1 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default ModerationQueue;
