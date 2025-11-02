import React, { useState, useRef } from 'react';
import { PhotoIcon, XCircleIcon, LoadingSpinnerIcon, SparklesIcon } from './Icons';
import { uploadImage } from '../services/imageService';
import { useTranslations } from '../hooks/useTranslations';
import { generatePostContent } from '../services/geminiService';

interface PostFormProps {
  onAddPost: (content: string, imageUrl: string | null) => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onAddPost, onClose, onShowToast }) => {
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
    if(fileInputRef.current) {
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
        // Resetting the form is now handled by the parent, since it closes the modal
    } catch (error) {
        console.error("Image upload failed:", error);
        onShowToast(t('imageUploadFailed'));
    } finally {
        setIsUploading(false);
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
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('createNewPost')}</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:border-blue-500"
            placeholder={t('postPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          ></textarea>

            <div className={`transition-[max-height,margin] duration-300 ease-in-out overflow-hidden ${imagePreview ? 'max-h-60 mt-4' : 'max-h-0'}`}>
                <div className="relative">
                {imagePreview && (
                    <>
                    <img src={imagePreview} alt={t('imagePreviewAlt')} className="w-full h-60 rounded-lg object-contain bg-gray-100" />
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

          <div className="mt-4 flex justify-between items-center">
             <div className="flex items-center">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-blue-600 rounded-full hover:bg-blue-50 disabled:text-gray-400"
                    disabled={isUploading || isGenerating}
                    aria-label={t('addImage')}
                >
                    <PhotoIcon className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={handleGenerateContent}
                    className="p-2 text-purple-600 rounded-full hover:bg-purple-50 disabled:text-gray-400"
                    disabled={isUploading || isGenerating}
                    aria-label={t('suggestWithAi')}
                >
                    {isGenerating ? <LoadingSpinnerIcon className="w-6 h-6 text-purple-600" /> : <SparklesIcon className="w-6 h-6" />}
                </button>
             </div>
            <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
            />

            <div className="space-x-2 rtl:space-x-reverse">
                <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                disabled={isUploading || isGenerating}
                >
                {t('cancel')}
                </button>
                <button
                    type="submit"
                    disabled={(!content.trim() && !imagePreview) || isUploading || isGenerating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300 disabled:cursor-not-allowed w-24 flex justify-center items-center"
                >
                    {isUploading ? <LoadingSpinnerIcon className="w-5 h-5" /> : t('publish')}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;