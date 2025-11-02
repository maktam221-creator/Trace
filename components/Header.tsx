import React from 'react';
import { UserIcon } from './Icons';

interface HeaderProps {
  onGoHome: () => void;
  onGoToProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, onGoToProfile }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto max-w-5xl px-4 py-3 flex justify-between items-center">
        <button onClick={onGoHome} className="text-left">
           <h1 className="text-2xl font-bold text-blue-600">
            Trace <span className="text-gray-700">| تريس</span>
          </h1>
        </button>
        <div className="hidden sm:flex items-center space-x-4 space-x-reverse">
          <button
              onClick={onGoToProfile}
              className="flex items-center space-x-2 space-x-reverse text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="الملف الشخصي"
          >
              <UserIcon className="w-5 h-5" />
              <span>ملفي الشخصي</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;