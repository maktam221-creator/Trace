
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-pulse bg-blue-200 rounded-full h-12 w-12"></div>
    </div>
  );
};

export default LoadingSpinner;
