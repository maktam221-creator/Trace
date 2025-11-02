
import React from 'react';

interface HeaderProps {
  onNewPost: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewPost }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto max-w-5xl px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">
          Trace <span className="text-gray-700">| تريس</span>
        </h1>
        <button
          onClick={onNewPost}
          className="hidden sm:inline-block bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          منشور جديد
        </button>
      </div>
    </header>
  );
};

export default Header;
