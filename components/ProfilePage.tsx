import React from 'react';
import { Post } from '../types';
import PostCard from './PostCard';
import { ArrowRightIcon } from './Icons';

interface ProfilePageProps {
  userId: string;
  myUserId: string;
  posts: Post[];
  onSelectUser: (userId:string) => void;
  onBack: () => void;
  onAddComment: (postId: string, commentText: string) => void;
  onShowToast: (message: string) => void;
  onLikePost: (postId: string) => void;
  onSharePost: (postId: string) => void;
  following: Set<string>;
  onToggleFollow: (userId: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
    userId, 
    myUserId, 
    posts, 
    onSelectUser, 
    onBack, 
    onAddComment, 
    onShowToast, 
    onLikePost, 
    onSharePost,
    following,
    onToggleFollow
}) => {
  const userPosts = posts.filter(p => p.userId === userId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const user = userPosts.length > 0 ? userPosts[0] : posts.find(p => p.userId === userId);
  const isMyProfile = userId === myUserId;
  const isFollowing = following.has(userId);

  if (!user) {
    // A special case for "new-user" who might not have posts yet
    if (userId === 'new-user') {
      return (
        <div className="text-center py-10">
          <p className="text-gray-600">هذا ملفك الشخصي. لم تقم بنشر أي شيء بعد.</p>
          <button onClick={onBack} className="text-blue-600 hover:underline mt-4 font-semibold">
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      );
    }
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">لم يتم العثور على المستخدم.</p>
        <button onClick={onBack} className="text-blue-600 hover:underline mt-4 font-semibold">
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-6">
            <button onClick={onBack} className="inline-flex items-center text-blue-600 hover:underline font-semibold">
                <ArrowRightIcon className="w-5 h-5 ml-2" />
                <span>العودة</span>
            </button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8 text-center">
            <img 
                src={user.avatarUrl.replace('/48', '/128')} // Get a larger image
                alt={user.username}
                className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md"
            />
            <h2 className="text-3xl font-bold text-gray-800">{user.username}</h2>
            <p className="text-gray-500 mt-1">@{user.userId}</p>
            {!isMyProfile && (
                <button 
                    onClick={() => onToggleFollow(userId)}
                    className={`mt-4 font-semibold px-8 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-40 ${
                        isFollowing
                            ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                </button>
            )}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">المنشورات</h3>
        <div className="space-y-6">
            {userPosts.length > 0 ? (
                userPosts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onSelectUser={onSelectUser}
                      onAddComment={onAddComment}
                      onShowToast={onShowToast}
                      onLikePost={onLikePost}
                      onSharePost={onSharePost}
                    />
                ))
            ) : (
                <div className="text-center text-gray-500 py-10 bg-gray-100 rounded-lg">
                    <p>لا توجد منشورات من هذا المستخدم بعد.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ProfilePage;
