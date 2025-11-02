import React, { useState, useRef } from 'react';
import { PhotoIcon, XCircleIcon } from './Icons';

interface CreatePostWidgetProps {
  onAddPost: (content: string, imageUrl: string | null) => void;
}

const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({ onAddPost }) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() || imagePreview) {
      onAddPost(content.trim(), imagePreview);
      setContent('');
      setImagePreview(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="hidden sm:block bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3 space-x-reverse">
          <img
            src="https://picsum.photos/seed/new-user/48"
            alt="مستخدم جديد"
            className="w-12 h-12 rounded-full object-cover"
          />
          <textarea
            className="w-full min-h-[50px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
            placeholder="بماذا تفكر؟"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          ></textarea>
        </div>

        {imagePreview && (
          <div className="mt-4 ml-16 relative">
            <img src={imagePreview} alt="معاينة الصورة" className="w-full h-auto rounded-lg max-h-80 object-contain" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-colors"
              aria-label="إزالة الصورة"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="mt-4 ml-16 flex justify-between items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 space-x-reverse p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <PhotoIcon className="w-6 h-6" />
            <span className="font-semibold">إضافة صورة</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          <button
            type="submit"
            disabled={!content.trim() && !imagePreview}
            className="px-8 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            نشر
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostWidget;
