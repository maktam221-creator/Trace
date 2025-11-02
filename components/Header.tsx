import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightOnRectangleIcon, HomeIcon, GlobeAltIcon } from './Icons';
import { useTranslations } from '../hooks/useTranslations';

interface HeaderProps {
  onGoHome: () => void;
  onGoToProfile: () => void;
  onLogout: () => void;
  myAvatarUrl: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onGoHome, 
  onGoToProfile, 
  onLogout, 
  myAvatarUrl
}) => {
  const { t, setLanguage, language } = useTranslations();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const languages = {
    en: 'English',
    ar: 'العربية',
    es: 'Español',
    fr: 'Français'
  };

  const handleSetLanguage = (lang: 'en' | 'ar' | 'es' | 'fr') => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
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
        
        <div className="flex-grow"></div>

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
