import React from 'react';
import { Notification } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { formatTimeAgo } from '../utils/time';
import { BellIcon, HeartIcon, ChatBubbleOvalLeftIcon, UserIcon } from './Icons';

interface NotificationsPageProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, onNotificationClick, onMarkAllRead }) => {
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
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h2 className="text-xl font-bold text-gray-800">{t('notifications')}</h2>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-sm text-blue-600 hover:underline font-semibold">
            {t('markAllAsRead')}
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => onNotificationClick(n)}
              className={`w-full text-start p-3 flex items-start gap-4 transition-colors rounded-lg ${!n.read ? 'bg-blue-100' : 'bg-white hover:bg-gray-100'}`}
            >
              <div className="relative flex-shrink-0">
                  <img src={n.actorAvatarUrl} alt={n.actorUsername} className="w-12 h-12 rounded-full object-cover" />
                  <span className="absolute -bottom-1 -end-1 bg-white rounded-full p-0.5 shadow">
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
          <div className="text-center text-gray-500 py-16 bg-gray-100 rounded-lg">
            <BellIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold">{t('noNotifications')}</h3>
            <p className="mt-2">{t('welcomeCallToAction')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
