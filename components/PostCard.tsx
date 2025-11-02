
import React from 'react';
import { Post } from '../types';
import { HeartIcon, ChatBubbleOvalLeftIcon, ArrowUpOnSquareIcon } from './Icons';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  
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
    return `منذ ${Math.floor(seconds)} ثوان`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center mb-4">
        <img
          src={post.avatarUrl}
          alt={post.username}
          className="w-12 h-12 rounded-full object-cover mr-4 ml-0" // RTL margin
        />
        <div>
          <p className="font-bold text-gray-800">{post.username}</p>
          <p className="text-sm text-gray-500">{timeAgo(post.timestamp)}</p>
        </div>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-around text-gray-500">
        <button className="flex items-center space-x-2 space-x-reverse hover:text-red-500 transition-colors p-2 rounded-lg">
          <HeartIcon className="w-6 h-6" />
          <span className="font-semibold">إعجاب</span>
        </button>
        <button className="flex items-center space-x-2 space-x-reverse hover:text-blue-500 transition-colors p-2 rounded-lg">
          <ChatBubbleOvalLeftIcon className="w-6 h-6" />
          <span className="font-semibold">تعليق</span>
        </button>
        <button className="flex items-center space-x-2 space-x-reverse hover:text-green-500 transition-colors p-2 rounded-lg">
          <ArrowUpOnSquareIcon className="w-6 h-6" />
          <span className="font-semibold">مشاركة</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
