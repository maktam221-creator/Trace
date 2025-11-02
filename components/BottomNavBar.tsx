import React from 'react';
import { HomeIcon, PlusIcon, UserIcon, BellIcon, SearchIcon } from './Icons';
import { useTranslations } from '../hooks/useTranslations';

interface BottomNavBarProps {
  currentView: 'home' | 'profile' | 'search' | 'notifications';
  onGoHome: () => void;
  onNewPost: () => void;
  onGoToProfile: () => void;
  onGoToNotifications: () => void;
  onGoToSearch: () => void;
  unreadNotificationsCount: number;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ 
  currentView,
  onGoHome, 
  onNewPost, 
  onGoToProfile,
  onGoToNotifications,
  onGoToSearch,
  unreadNotificationsCount
}) => {
  const { t } = useTranslations();

  const navItems = [
    { view: 'home', label: t('home'), icon: HomeIcon, action: onGoHome },
    { view: 'search', label: t('discoverUsers'), icon: SearchIcon, action: onGoToSearch },
    { view: 'notifications', label: t('notifications'), icon: BellIcon, action: onGoToNotifications, badge: unreadNotificationsCount },
    { view: 'profile', label: t('myProfile'), icon: UserIcon, action: onGoToProfile },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.slice(0, 2).map(item => (
            <NavItem key={item.view} {...item} currentView={currentView} />
        ))}

        <button
          onClick={onNewPost}
          className="flex items-center justify-center bg-blue-600 text-white rounded-full w-14 h-14 -mt-6 shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('newPostAria')}
        >
          <PlusIcon className="w-8 h-8" />
        </button>

        {navItems.slice(2, 4).map(item => (
            <NavItem key={item.view} {...item} currentView={currentView} />
        ))}
      </div>
    </nav>
  );
};

interface NavItemProps {
    view: string;
    label: string;
    icon: React.FC<{className?: string}>;
    action: () => void;
    badge?: number;
    currentView: string;
}

const NavItem: React.FC<NavItemProps> = ({ view, label, icon: Icon, action, badge = 0, currentView }) => {
    const isActive = view === currentView;
    return (
        <button
          onClick={action}
          className={`flex flex-col items-center justify-center transition-colors w-1/5 relative ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          aria-label={label}
        >
          <Icon className="w-7 h-7" />
          <span className={`text-xs mt-1 ${isActive ? 'font-bold' : ''}`}>{label}</span>
          {badge > 0 && (
            <span className="absolute top-0 end-3 block w-4 h-4 text-xs text-white bg-red-500 rounded-full flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>
    );
};

export default BottomNavBar;
