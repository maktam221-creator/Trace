import React, { useState, memo } from 'react';
import { Comment, Profile } from '../types';
import { PaperAirplaneIcon } from './Icons';
import { useTranslations } from '../hooks/useTranslations';
import { formatTimeAgo } from '../utils/time';

interface CommentSectionProps {
    comments: Comment[];
    onAddComment: (commentText: string) => void;
    myUserId: string;
    myAvatarUrl: string;
    profiles: Record<string, Profile>;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment, myUserId, myAvatarUrl, profiles }) => {
    const { t } = useTranslations();
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <form onSubmit={handleSubmit} className="flex items-start space-x-3 rtl:space-x-reverse mb-4">
                <img src={myAvatarUrl} alt={t('currentUserAlt')} className="w-9 h-9 rounded-full mt-1 object-cover" />
                <div className="flex-1 relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('addCommentPlaceholder')}
                        className="w-full p-2 ps-10 pe-2 border border-gray-200 rounded-lg focus:border-blue-500 resize-none"
                        rows={2}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute top-1/2 -translate-y-1/2 end-2 p-2 text-blue-600 disabled:text-gray-400 rounded-full"
                        aria-label={t('sendCommentAria')}
                    >
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </div>
            </form>
            <div className="space-y-4">
                {comments.length > 0 ? [...comments].reverse().map(comment => {
                    const commenterProfile = profiles[comment.userId];
                    const avatarUrl = commenterProfile?.avatarUrl || `https://picsum.photos/seed/${comment.userId}/48`;
                    return (
                        <div key={comment.id} className="flex items-start space-x-3 rtl:space-x-reverse">
                            <img src={avatarUrl} alt={comment.username} className="w-9 h-9 rounded-full object-cover" />
                            <div className="flex-1 bg-gray-100 rounded-xl p-3">
                                <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
                                    <span className="font-bold text-sm">{comment.username}</span>
                                    <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp, t)}</span>
                                </div>
                                <p className="text-sm text-gray-800">{comment.text}</p>
                            </div>
                        </div>
                    );
                }) : <p className="text-center text-sm text-gray-500 py-2">{t('noCommentsYet')}</p>}
            </div>
        </div>
    );
}

export default memo(CommentSection);