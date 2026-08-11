import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Heart, MessageCircle, Flag, Plus, X, Send } from 'lucide-react';
import { forumApi } from '../../services/forum.api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';
import Input from '../../components/forms/Input';
import TextArea from '../../components/forms/TextArea';

const PostComments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => forumApi.getComments(postId).then((res) => setComments(res.data.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [postId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await forumApi.createComment({ post: postId, content: text });
      setText('');
      load();
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  if (loading) return <span className="loading loading-spinner loading-xs text-teal-600" />;

  return (
    <div className="mt-4 pt-4 border-t border-teal-600/10 space-y-3">
      {comments.map((c) => (
        <div key={c._id} className="text-sm">
          <span className="font-semibold text-teal-800 dark:text-white/90">{c.isAnonymous ? 'Anonymous' : c.author?.name || 'Anonymous'}: </span>
          <span className="text-teal-700/80 dark:text-white/60">{c.content}</span>
        </div>
      ))}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a supportive reply..."
          className="focus-ring flex-1 rounded-lg border border-teal-600/20 bg-white dark:bg-teal-900 px-3 py-1.5 text-xs text-teal-900 dark:text-white"
        />
        <button type="submit" className="text-teal-600"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
};

const ForumPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', isAnonymous: true });

  const load = () => forumApi.getPosts().then((res) => setPosts(res.data.data.posts)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forumApi.createPost(form);
      toast.success('Posted to community');
      setForm({ title: '', content: '', isAnonymous: true });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id) => {
    try {
      await forumApi.likePost(id);
      load();
    } catch (err) {
      toast.error('Failed to like post');
    }
  };

  const handleReport = async (id) => {
    try {
      await forumApi.reportPost(id);
      toast.success('Post reported to moderators');
    } catch (err) {
      toast.error('Failed to report post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Community</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white border-none rounded-full gap-1">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showForm ? 'Cancel' : 'New post'}
        </button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" placeholder="What's this about?" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextArea label="Share what's on your mind" rows={4} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <label className="flex items-center gap-2 text-sm text-teal-800 dark:text-white/80">
              <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} className="checkbox checkbox-sm" />
              Post anonymously
            </label>
            <button type="submit" disabled={submitting} className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">
              {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Post'}
            </button>
          </form>
        </Card>
      )}

      {loading ? (
        <span className="loading loading-spinner text-teal-600" />
      ) : posts.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No posts yet" message="Be the first to share with the community." />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <Card key={p._id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-teal-600/10 flex items-center justify-center text-xs font-semibold text-teal-700">
                  {p.isAnonymous ? 'A' : (p.author?.name?.charAt(0) || 'U')}
                </div>
                <span className="text-xs text-teal-600/70">{p.isAnonymous ? 'Anonymous' : p.author?.name || 'User'} · {new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="font-display font-semibold text-teal-900 dark:text-white mb-1">{p.title}</p>
              <p className="text-sm text-teal-800/80 dark:text-white/70 mb-3">{p.content}</p>
              <div className="flex items-center gap-4 text-xs text-teal-600/70">
                <button onClick={() => handleLike(p._id)} className="flex items-center gap-1 hover:text-teal-700">
                  <Heart className={`w-3.5 h-3.5 ${p.likes?.includes(user?._id) ? 'fill-clay-500 text-clay-500' : ''}`} /> {p.likes?.length || 0}
                </button>
                <button onClick={() => setExpanded(expanded === p._id ? null : p._id)} className="flex items-center gap-1 hover:text-teal-700">
                  <MessageCircle className="w-3.5 h-3.5" /> {p.commentCount || 0}
                </button>
                <button onClick={() => handleReport(p._id)} className="flex items-center gap-1 hover:text-clay-600 ml-auto">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
              {expanded === p._id && <PostComments postId={p._id} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumPage;
