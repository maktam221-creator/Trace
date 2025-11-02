import React from 'react';
import { HomeIcon, PlusIcon, UserIcon } from './Icons';

interface BottomNavBarProps {
  onGoHome: () => void;
  onNewPost: () => void;
  onGoToProfile: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onGoHome, onNewPost, onGoToProfile }) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={onGoHome}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 transition-colors w-1/3"
          aria-label="الرئيسية"
        >
          <HomeIcon className="w-7 h-7" />
          <span className="text-xs mt-1">الرئيسية</span>
        </button>
        <button
          onClick={onNewPost}
          className="flex items-center justify-center bg-blue-600 text-white rounded-full w-14 h-14 -mt-6 shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="منشور جديد"
        >
          <PlusIcon className="w-8 h-8" />
        </button>
        <button
          onClick={onGoToProfile}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-600 transition-colors w-1/3"
          aria-label="الملف الشخصي"
        >
          <UserIcon className="w-7 h-7" />
          <span className="text-xs mt-1">ملفي</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;