import React, { useState } from 'react';
import { Post } from '../types';
import { HeartIcon, ChatBubbleOvalLeftIcon, ArrowUpOnSquareIcon } from './Icons';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  myUserId: string;
  onSelectUser: (userId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onShowToast: (message: string) => void;
  onLikePost: (postId: string) => void;
  onSharePost: (postId: string) => void;
  myAvatarUrl: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, myUserId, onSelectUser, onAddComment, onShowToast, onLikePost, onSharePost, myAvatarUrl }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `منذ ${Math.floor(interval)} سنوات`;
    interval = seconds / 2592000;
    if (interval > 1) return `منذ ${Math.floor(interval)} أشهر`;
    interval = seconds / 86400;
    if (interval > 1) return `منذ ${Math.floor(interval)} أيام`;
    interval = seconds / 3600;
    if (interval > 1) return `منذ ${Math.floor(interval)} ساعات`;
    interval = seconds / 60;
    if (interval > 1) return `منذ ${Math.floor(interval)} دقائق`;
    return `الآن`;
  };

  const handleLike = () => {
    if (!isLiked) {
      onLikePost(post.id);
      setIsLiked(true);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `منشور من ${post.username}`,
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
        onShowToast('تم نسخ المنشور إلى الحافظة');
        onSharePost(post.id);
      } catch (clipErr) {
        console.error('Clipboard write failed:', clipErr);
        // This toast is shown if both share and clipboard fail.
        onShowToast('فشلت المشاركة والنسخ');
      }
    }
  };
  
  const handleAddComment = (commentText: string) => {
    onAddComment(post.id, commentText);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 transition-shadow hover:shadow-md flex flex-col">
      <div className="flex items-center mb-4">
        <button onClick={() => onSelectUser(post.userId)} className="flex items-center text-right group">
          <img
            src={post.avatarUrl}
            alt={post.username}
            className="w-12 h-12 rounded-full object-cover mr-4 ml-0" // RTL margin
          />
          <div>
            <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{post.username}</p>
            <p className="text-sm text-gray-500">{timeAgo(post.timestamp)}</p>
          </div>
        </button>
      </div>

      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
        {post.content}
      </p>

      {post.imageUrl && (
        <div className="mb-4 -mx-5 -mt-2">
          <img 
            src={post.imageUrl}
            alt="محتوى المنشور"
            className="w-full h-auto object-cover max-h-96"
          />
        </div>
      )}

      <div className="pt-4 mt-auto border-t border-gray-100 flex justify-around text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 space-x-reverse transition-colors p-2 rounded-lg ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
        >
          <HeartIcon className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          <span className="font-semibold">إعجاب ({post.likes || 0})</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 space-x-reverse hover:text-blue-500 transition-colors p-2 rounded-lg"
        >
          <ChatBubbleOvalLeftIcon className="w-6 h-6" />
          <span className="font-semibold">تعليق ({post.comments?.length || 0})</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center space-x-2 space-x-reverse hover:text-green-500 transition-colors p-2 rounded-lg"
        >
          <ArrowUpOnSquareIcon className="w-6 h-6" />
          <span className="font-semibold">مشاركة ({post.shares || 0})</span>
        </button>
      </div>
      {showComments && (
        <CommentSection 
            comments={post.comments || []}
            onAddComment={handleAddComment}
            myUserId={myUserId}
            myAvatarUrl={myAvatarUrl}
        />
      )}
    </div>
  );
};

export default PostCard;