import React from 'react';

interface CreatePostWidgetProps {
  onNewPost: () => void;
}

const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({ onNewPost }) => {
  return (
    <div className="hidden sm:block bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center space-x-3 space-x-reverse">
        <img
          src="https://picsum.photos/seed/new-user/48"
          alt="مستخدم جديد"
          className="w-12 h-12 rounded-full object-cover"
        />
        <button
          onClick={onNewPost}
          className="flex-grow bg-gray-100 hover:bg-gray-200 text-gray-500 text-right rounded-full px-4 py-3 transition-colors text-lg"
        >
          بماذا تفكر؟
        </button>
      </div>
    </div>
  );
};

export default CreatePostWidget;
