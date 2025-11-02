import React, { useState, useRef } from 'react';
import { PhotoIcon, XCircleIcon, LoadingSpinnerIcon, SparklesIcon } from './Icons';
import { uploadImage } from '../services/imageService';
import { useTranslations } from '../hooks/useTranslations';
import { generatePostContent } from '../services/geminiService';

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
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleGenerateContent = async () => {
    const topic = window.prompt(t('aiTopicPrompt'));
    if (!topic || !topic.trim()) return;

    setIsGenerating(true);
    try {
      const generatedContent = await generatePostContent(topic);
      setContent(generatedContent);
    } catch (error: any) {
      onShowToast(error.message || t('aiGenerationFailed'));
    } finally {
      setIsGenerating(false);
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
            className="w-full h-28 p-3 border border-gray-200 rounded-lg focus:border-blue-500 resize-none"
            placeholder={t('postPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
                    className="absolute top-2 end-2 bg-black bg-opacity-50 text-white rounded-full p-1"
                    aria-label={t('removeImageAria')}
                    >
                    <XCircleIcon className="w-6 h-6" />
                    </button>
                </>
                )}
            </div>
        </div>


        <div className="mt-4 ms-16 flex justify-between items-center">
          <div className="flex items-center">
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 rtl:space-x-reverse p-2 text-blue-600 rounded-lg hover:bg-blue-50 disabled:text-gray-400"
                disabled={isUploading || isGenerating}
                >
                <PhotoIcon className="w-6 h-6" />
                <span className="font-semibold">{t('addImage')}</span>
            </button>
            <button
                type="button"
                onClick={handleGenerateContent}
                className="flex items-center space-x-2 rtl:space-x-reverse p-2 text-purple-600 rounded-lg hover:bg-purple-50 disabled:text-gray-400"
                disabled={isUploading || isGenerating}
            >
                {isGenerating ? <LoadingSpinnerIcon className="w-6 h-6 text-purple-600" /> : <SparklesIcon className="w-6 h-6" />}
                <span className="font-semibold">{t('suggestWithAi')}</span>
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          <button
            type="submit"
            disabled={(!content.trim() && !imagePreview) || isUploading || isGenerating}
            className="px-8 py-2 bg-blue-600 text-white font-semibold rounded-full disabled:bg-blue-300 disabled:cursor-not-allowed w-28 flex justify-center items-center"
          >
            {isUploading ? <LoadingSpinnerIcon className="w-5 h-5" /> : t('publish')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostWidget;