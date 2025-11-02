
import React, { useState } from 'react';

interface PostFormProps {
  onAddPost: (content: string) => void;
  onClose: () => void;
}

const PostForm: React.FC<PostFormProps> = ({ onAddPost, onClose }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAddPost(content.trim());
      setContent('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800">إنشاء منشور جديد</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder="بماذا تفكر؟"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          ></textarea>
          <div className="mt-4 flex justify-end space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              نشر
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;
