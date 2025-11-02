import React from 'react';
import { Notification } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { formatTimeAgo } from '../utils/time';
import { HeartIcon, ChatBubbleOvalLeftIcon, UserIcon } from './Icons';

interface NotificationsPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onNotificationClick, onMarkAllRead }) => {
  const { t } = useTranslations();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <HeartIcon className="w-5 h-5 text-red-500" />;
      case 'comment': return <ChatBubbleOvalLeftIcon className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserIcon className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };
  
  const getNotificationText = (notification: Notification) => {
    const actor = <strong className="font-bold">{notification.actorUsername}</strong>;
    switch (notification.type) {
        case 'like':
            return <>{actor} {t('notificationLike')} <em className="text-gray-600">"{notification.postContentSample}..."</em></>;
        case 'comment':
            return <>{actor} {t('notificationComment')} <em className="text-gray-600">"{notification.postContentSample}..."</em></>;
        case 'follow':
            return <>{actor} {t('notificationFollow')}</>;
        default:
            return '';
    }
  };

  return (
    <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl z-20 border border-gray-100 max-h-[70vh] flex flex-col">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-bold text-lg text-gray-800">{t('notifications')}</h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-sm text-blue-600 hover:underline font-semibold">
            {t('markAllAsRead')}
          </button>
        )}
      </div>
      <div className="overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => onNotificationClick(n)}
              className={`w-full text-start p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
            >
              <div className="relative flex-shrink-0">
                  <img src={n.actorAvatarUrl} alt={n.actorUsername} className="w-10 h-10 rounded-full object-cover" />
                  <span className="absolute -bottom-1 -end-1 bg-white rounded-full p-0.5">
                    {getNotificationIcon(n.type)}
                  </span>
              </div>
              <div className="flex-grow">
                <p className="text-sm text-gray-800 leading-tight">{getNotificationText(n)}</p>
                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(n.timestamp, t)}</p>
              </div>
              {!n.read && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-center flex-shrink-0"></div>
              )}
            </button>
          ))
        ) : (
          <p className="text-center text-gray-500 py-10 px-4">{t('noNotifications')}</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
