import React, { useState, useRef } from 'react';
import { PhotoIcon, XCircleIcon, LoadingSpinnerIcon } from './Icons';
import { uploadImage } from '../services/imageService';
import { useTranslations } from '../hooks/useTranslations';

interface CreatePostWidgetProps {
  onAddPost: (content: string, imageUrl: string | null) => void;
  myAvatarUrl: string;
  onShowToast: (message: string) => void;
}

const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({ onAddPost, myAvatarUrl, onShowToast }) => {
  const { t } = useTranslations();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) {
        return;
    }
    
    setIsUploading(true);
    let uploadedImageUrl: string | null = null;
    
    try {
        if (imageFile) {
            uploadedImageUrl = await uploadImage(imageFile);
        }
        onAddPost(content.trim(), uploadedImageUrl);

        // Reset form on success
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    } catch (error) {
        console.error("Image upload failed:", error);
        onShowToast(t('imageUploadFailed'));
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="hidden sm:block bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3 rtl:space-x-reverse">
          <img
            src={myAvatarUrl}
            alt={t('currentUserAlt')}
            className="w-12 h-12 rounded-full object-cover"
          />
          <textarea
            className="w-full min-h-[50px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
            placeholder={t('postPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          ></textarea>
        </div>

        <div className={`transition-[max-height,margin] duration-300 ease-in-out overflow-hidden ${imagePreview ? 'max-h-80 mt-4' : 'max-h-0'}`}>
            <div className="ms-16 relative">
                {imagePreview && (
                <>
                    <img src={imagePreview} alt={t('imagePreviewAlt')} className="w-full h-80 rounded-lg object-contain bg-gray-100" />
                    <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 end-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition-colors"
                    aria-label={t('removeImageAria')}
                    >
                    <XCircleIcon className="w-6 h-6" />
                    </button>
                </>
                )}
            </div>
        </div>


        <div className="mt-4 ms-16 flex justify-between items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 rtl:space-x-reverse p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <PhotoIcon className="w-6 h-6" />
            <span className="font-semibold">{t('addImage')}</span>
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
            disabled={(!content.trim() && !imagePreview) || isUploading}
            className="px-8 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed w-28 flex justify-center items-center"
          >
            {isUploading ? <LoadingSpinnerIcon className="w-5 h-5" /> : t('publish')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostWidget;
