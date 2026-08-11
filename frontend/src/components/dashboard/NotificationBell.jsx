import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, CalendarDays, MessageSquare, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../services/notification.api';
import { useSocket } from '../../contexts/SocketContext';
import { formatRelativeTime } from '../../utils/formatters';

const ICON_BY_TYPE = { appointment: CalendarDays, forum: MessageSquare, emergency: AlertTriangle, system: Info };

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const ref = useRef(null);

  const load = () => notificationApi.getMy().then((res) => setNotifications(res.data.data));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => setNotifications((prev) => [n, ...prev]);
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = (n) => {
    if (!n.isRead) {
      notificationApi.markRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
    }
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="focus-ring relative p-2 rounded-full hover:bg-teal-600/10" aria-label="Notifications">
        <Bell className="w-5 h-5 text-teal-700 dark:text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-clay-500 text-white text-[10px] flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-sand-50 dark:bg-teal-800 rounded-2xl shadow-soft border border-teal-600/10 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-teal-600/10">
            <p className="font-semibold text-sm text-teal-900 dark:text-white">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-teal-600 flex items-center gap-1 hover:underline">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-teal-600/60 text-center py-8">No notifications yet.</p>
          ) : (
            <ul>
              {notifications.map((n) => {
                const Icon = ICON_BY_TYPE[n.type] || Info;
                return (
                  <li key={n._id}>
                    <button
                      onClick={() => handleOpen(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 border-b border-teal-600/5 last:border-0 hover:bg-teal-600/5 ${!n.isRead ? 'bg-teal-600/5' : ''}`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${n.type === 'emergency' ? 'text-clay-600' : 'text-teal-600'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-teal-900 dark:text-white truncate">{n.title}</p>
                        <p className="text-xs text-teal-700/70 dark:text-white/50 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-teal-600/50 mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0 mt-1.5 ml-auto" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;