import React, { useState } from 'react';
import { Comment } from '../types';
import { PaperAirplaneIcon } from './Icons';

interface CommentSectionProps {
    comments: Comment[];
    onAddComment: (commentText: string) => void;
    myAvatarUrl: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment, myAvatarUrl }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    const timeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `منذ ${Math.floor(interval)} س`;
        interval = seconds / 2592000;
        if (interval > 1) return `منذ ${Math.floor(interval)} ش`;
        interval = seconds / 86400;
        if (interval > 1) return `منذ ${Math.floor(interval)} ي`;
        interval = seconds / 3600;
        if (interval > 1) return `منذ ${Math.floor(interval)} س`;
        interval = seconds / 60;
        if (interval > 1) return `منذ ${Math.floor(interval)} د`;
        return `الآن`;
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <form onSubmit={handleSubmit} className="flex items-start space-x-3 space-x-reverse mb-4">
                <img src={myAvatarUrl} alt="مستخدم جديد" className="w-9 h-9 rounded-full mt-1 object-cover" />
                <div className="flex-1 relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="أضف تعليقاً..."
                        className="w-full p-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                        rows={1}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute top-1/2 -translate-y-1/2 left-2 p-2 text-blue-600 disabled:text-gray-400 hover:bg-blue-50 disabled:hover:bg-transparent rounded-full transition-colors"
                        aria-label="إرسال التعليق"
                    >
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </div>
            </form>
            <div className="space-y-4">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3 space-x-reverse">
                         <img src={comment.userId === 'new-user' ? myAvatarUrl : `https://picsum.photos/seed/${comment.userId}/48`} alt={comment.username} className="w-9 h-9 rounded-full object-cover" />
                         <div className="flex-1 bg-gray-100 rounded-xl p-3">
                             <div className="flex items-baseline space-x-2 space-x-reverse">
                                <span className="font-bold text-sm">{comment.username}</span>
                                <span className="text-xs text-gray-500">{timeAgo(comment.timestamp)}</span>
                             </div>
                             <p className="text-sm text-gray-800">{comment.text}</p>
                         </div>
                    </div>
                )).reverse() : <p className="text-center text-sm text-gray-500 py-2">لا توجد تعليقات بعد.</p>}
            </div>
        </div>
    );
}

export default CommentSection;