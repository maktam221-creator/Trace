import React from 'react';
import { HomeIcon, PlusIcon, UserIcon } from './Icons';
import { useTranslations } from '../hooks/useTranslations';

interface BottomNavBarProps {
  currentView: 'home' | 'profile';
  onGoHome: () => void;
  onNewPost: () => void;
  onGoToProfile: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ 
  currentView,
  onGoHome, 
  onNewPost, 
  onGoToProfile,
}) => {
  const { t } = useTranslations();

  const navItems = [
    { view: 'home', label: t('home'), icon: HomeIcon, action: onGoHome },
    { view: 'profile', label: t('myProfile'), icon: UserIcon, action: onGoToProfile },
  ];

  const navItemsBefore = navItems.slice(0, 1);
  const navItemsAfter = navItems.slice(1);

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="flex justify-around items-center h-16">
        {navItemsBefore.map(item => (
            <NavItem key={item.view} {...item} currentView={currentView} />
        ))}

        <button
          onClick={onNewPost}
          className="flex items-center justify-center bg-blue-600 text-white rounded-full w-14 h-14 -mt-6 shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('newPostAria')}
        >
          <PlusIcon className="w-8 h-8" />
        </button>

        {navItemsAfter.map(item => (
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
    currentView: string;
}

const NavItem: React.FC<NavItemProps> = ({ view, label, icon: Icon, action, currentView }) => {
    const isActive = view === currentView;
    return (
        <button
          onClick={action}
          className={`flex flex-col items-center justify-center transition-colors w-1/4 ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
          aria-label={label}
        >
          <Icon className="w-7 h-7" />
          <span className={`text-xs mt-1 ${isActive ? 'font-bold' : ''}`}>{label}</span>
        </button>
    );
};

export default BottomNavBar;
