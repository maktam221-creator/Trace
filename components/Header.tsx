import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, ArrowRightOnRectangleIcon, HomeIcon, GlobeAltIcon, BellIcon } from './Icons';
import { useTranslations } from '../hooks/useTranslations';
import { Notification } from '../types';
import NotificationsPanel from './NotificationsPanel';

interface HeaderProps {
  onGoHome: () => void;
  onGoToProfile: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  onLogout: () => void;
  myAvatarUrl: string;
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onGoHome, 
  onGoToProfile, 
  searchQuery, 
  onSearch, 
  onLogout, 
  myAvatarUrl,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllRead 
}) => {
  const { t, setLanguage, language } = useTranslations();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const languages = {
    en: 'English',
    ar: 'العربية',
    es: 'Español',
    fr: 'Français'
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSetLanguage = (lang: 'en' | 'ar' | 'es' | 'fr') => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  const handleNotificationIconClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  }

  const handleNotificationPanelClick = (notification: Notification) => {
    onNotificationClick(notification);
    setIsNotificationsOpen(false); // Close panel on click
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto max-w-5xl px-4 py-3 flex justify-between items-center gap-4">
        <button onClick={onGoHome} className="text-start flex-shrink-0">
          <h1 className="text-2xl font-bold text-blue-600">
            Aegypt
          </h1>
        </button>
        
        <div className="flex-grow max-w-lg mx-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => onSearch(searchQuery)}
              className="w-full bg-gray-100 border-2 border-transparent rounded-full py-2 ps-10 pe-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
          </form>
        </div>

        <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0">
           <div className="relative" ref={langDropdownRef}>
            <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={t('changeLanguage')}
            >
                <GlobeAltIcon className="w-7 h-7" />
            </button>
            {isLangDropdownOpen && (
                <div className="absolute start-0 mt-2 w-36 bg-white rounded-md shadow-lg z-20 border border-gray-100">
                    {Object.entries(languages).map(([code, name]) => (
                        <button
                            key={code}
                            onClick={() => handleSetLanguage(code as 'en' | 'ar' | 'es' | 'fr')}
                            className={`block w-full text-start px-4 py-2 text-sm ${language === code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} hover:bg-gray-100`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
           </div>
           
           <div className="relative" ref={notificationsRef}>
             <button
                onClick={handleNotificationIconClick}
                className="text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                aria-label={t('notifications')}
             >
                <BellIcon className="w-7 h-7" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 end-1 block w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
             </button>
             {isNotificationsOpen && (
               <NotificationsPanel 
                  notifications={notifications}
                  onNotificationClick={handleNotificationPanelClick}
                  onMarkAllRead={onMarkAllRead}
               />
             )}
           </div>

           <button
              onClick={onGoHome}
              className="text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t('homeAria')}
          >
              <HomeIcon className="w-7 h-7" />
          </button>
           <button
              onClick={onGoToProfile}
              className="block rounded-full hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all"
              aria-label={t('profileAria')}
          >
              <img src={myAvatarUrl} alt={t('profileAria')} className="w-10 h-10 rounded-full object-cover" />
          </button>
          <button
              onClick={onLogout}
              className="text-gray-600 p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label={t('logoutAria')}
          >
              <ArrowRightOnRectangleIcon className="w-7 h-7" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
