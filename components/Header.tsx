
import React from 'react';
import { UserIcon, SearchIcon, ArrowRightOnRectangleIcon } from './Icons';

interface HeaderProps {
  onGoHome: () => void;
  onGoToProfile: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, onGoToProfile, searchQuery, onSearch, onLogout }) => {
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto max-w-5xl px-4 py-3 flex justify-between items-center gap-4">
        <button onClick={onGoHome} className="text-left flex-shrink-0">
          <h1 className="text-2xl font-bold text-blue-600">
            Aegypt
          </h1>
        </button>
        
        <div className="flex-grow max-w-lg mx-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              placeholder="ابحث عن منشورات أو مستخدمين..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-gray-100 border-2 border-transparent rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
          </form>
        </div>

        <div className="hidden sm:flex items-center space-x-2 space-x-reverse flex-shrink-0">
          <button
              onClick={onGoToProfile}
              className="flex items-center space-x-2 space-x-reverse text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="الملف الشخصي"
          >
              <UserIcon className="w-5 h-5" />
              <span>ملفي الشخصي</span>
          </button>
          <button
              onClick={onLogout}
              className="flex items-center space-x-2 space-x-reverse text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="تسجيل الخروج"
          >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;