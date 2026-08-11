import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Ban, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { userApi } from '../../services/user.api';
import Card from '../../components/shared/Card';
import EmptyState from '../../components/shared/EmptyState';

const ROLES = ['student', 'volunteer', 'counselor', 'admin'];

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    userApi.getAll({ search: search || undefined, role: roleFilter || undefined })
      .then((res) => setUsers(res.data.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const handleRoleChange = async (id, role) => {
    try {
      await userApi.updateRole(id, role);
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleBanToggle = async (id) => {
    try {
      await userApi.toggleBan(id);
      load();
    } catch (err) {
      toast.error('Failed to update ban status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await userApi.delete(id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-xl font-semibold text-teal-900 dark:text-white">Manage Users</h1>

      <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="focus-ring w-full rounded-xl border border-teal-600/20 bg-white pl-9 pr-4 py-2.5 text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="focus-ring rounded-xl border border-teal-600/20 bg-white px-4 py-2.5 text-sm">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" className="btn bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl">Search</button>
      </form>

      {loading ? (
        <span className="loading loading-spinner text-teal-600" />
      ) : users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users found" message="Try a different search." />
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="text-xs text-teal-600/70">
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="text-sm border-t border-teal-600/5">
                  <td className="font-medium text-teal-900">{u.name}</td>
                  <td className="text-teal-700/70">{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} className="select select-xs border-teal-600/20 rounded-lg">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    {u.isBanned ? <span className="text-xs text-clay-600">Banned</span> : <span className="text-xs text-teal-600">Active</span>}
                  </td>
                  <td className="flex gap-2 py-2">
                    <button onClick={() => handleBanToggle(u._id)} title={u.isBanned ? 'Unban' : 'Ban'} className="text-teal-600/60 hover:text-amber-600">
                      {u.isBanned ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(u._id)} title="Delete" className="text-teal-600/60 hover:text-clay-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default ManageUsers;
