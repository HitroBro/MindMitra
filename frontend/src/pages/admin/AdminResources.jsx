import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, Trash2, Library } from 'lucide-react';
import { resourceApi } from '../../services/resource.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';
import Input from '../../components/forms/Input';
import TextArea from '../../components/forms/TextArea';

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'pdf', category: '', tags: '' });
  const [file, setFile] = useState(null);

  const load = () => resourceApi.getAll({ limit: 50 }).then((res) => setResources(res.data.data.resources)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please choose a file');
    setSubmitting(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);
    try {
      await resourceApi.upload(formData);
      toast.success('Resource uploaded');
      setForm({ title: '', description: '', type: 'pdf', category: '', tags: '' });
      setFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await resourceApi.delete(id);
      toast.success('Resource deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Manage Resources</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-teal-800">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="focus-ring rounded-xl border border-teal-600/20 bg-white px-4 py-2.5 text-sm">
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="article">Article</option>
              </select>
            </div>
          </div>
          <TextArea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-teal-800">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="file-input file-input-bordered file-input-sm" required />
          </div>
          <button type="submit" disabled={submitting} className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl gap-2">
            {submitting ? <span className="loading loading-spinner loading-sm" /> : <><Upload className="w-4 h-4" /> Upload</>}
          </button>
        </form>
      </Card>

      {loading ? (
        <span className="loading loading-spinner text-teal-600" />
      ) : resources.length === 0 ? (
        <EmptyState icon={Library} title="No resources yet" message="Upload the first one above." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {resources.map((r) => (
            <Card key={r._id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-teal-900">{r.title}</p>
                <p className="text-xs text-teal-600/60 capitalize">{r.type} · {r.downloadCount} downloads</p>
              </div>
              <button onClick={() => handleDelete(r._id)} className="text-teal-600/50 hover:text-clay-600"><Trash2 className="w-4 h-4" /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminResources;
