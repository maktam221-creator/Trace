import React, { useState, memo } from 'react';
import { Post, Profile } from '../types';
import { HeartIcon, ChatBubbleOvalLeftIcon, ArrowUpOnSquareIcon } from './Icons';
import CommentSection from './CommentSection';
import { useTranslations } from '../hooks/useTranslations';
import { formatTimeAgo } from '../utils/time';

interface PostCardProps {
  post: Post;
  myUserId: string;
  profiles: Record<string, Profile>;
  onSelectUser: (userId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onShowToast: (message: string) => void;
  onLikePost: (postId: string) => void;
  onSharePost: (postId: string) => void;
  myAvatarUrl: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, myUserId, profiles, onSelectUser, onAddComment, onShowToast, onLikePost, onSharePost, myAvatarUrl }) => {
  const { t } = useTranslations();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (!isLiked) {
      onLikePost(post.id);
      setIsLiked(true);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: t('postShareTitle', { username: post.username }),
      text: post.content,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        onSharePost(post.id);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err: any) {
      // Don't show an error toast if the user simply cancelled the share dialog.
      if (err.name === 'AbortError') {
        console.log('Share was cancelled by the user.');
        return;
      }

      console.error('Share failed:', err);
      
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(post.content);
        onShowToast(t('postCopiedToClipboard'));
        onSharePost(post.id);
      } catch (clipErr) {
        console.error('Clipboard write failed:', clipErr);
        // This toast is shown if both share and clipboard fail.
        onShowToast(t('postShareAndCopyFailed'));
      }
    }
  };
  
  const handleAddComment = (commentText: string) => {
    onAddComment(post.id, commentText);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
      <div className="flex items-center mb-4">
        <button onClick={() => onSelectUser(post.userId)} className="flex items-center text-start group">
          <img
            src={post.avatarUrl}
            alt={post.username}
            className="w-12 h-12 rounded-full object-cover me-4"
          />
          <div>
            <p className="font-bold text-gray-800">{post.username}</p>
            <p className="text-sm text-gray-500">{formatTimeAgo(post.timestamp, t)}</p>
          </div>
        </button>
      </div>

      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
        {post.content}
      </p>

      {post.imageUrl && (
        <div className="mb-4 -mx-5 -mt-2 aspect-video bg-gray-100">
          <img 
            src={post.imageUrl}
            alt={t('postContentAlt')}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="pt-4 mt-auto border-t border-gray-100 flex justify-around text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg ${isLiked ? 'text-red-500' : ''}`}
        >
          <HeartIcon className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          <span className="font-semibold">{t('like')} ({post.likes || 0})</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg"
        >
          <ChatBubbleOvalLeftIcon className="w-6 h-6" />
          <span className="font-semibold">{t('comment')} ({post.comments?.length || 0})</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg"
        >
          <ArrowUpOnSquareIcon className="w-6 h-6" />
          <span className="font-semibold">{t('share')} ({post.shares || 0})</span>
        </button>
      </div>
      {showComments && (
        <CommentSection 
            comments={post.comments || []}
            onAddComment={handleAddComment}
            myUserId={myUserId}
            myAvatarUrl={myAvatarUrl}
            profiles={profiles}
        />
      )}
    </div>
  );
};

export default memo(PostCard);