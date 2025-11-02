
import React, { useRef, useState } from 'react';
import { Post } from '../types';
import PostCard from './PostCard';
import { ArrowRightIcon, CameraIcon, PencilIcon } from './Icons';
import CreatePostWidget from './CreatePostWidget';
import { uploadImage } from '../services/imageService';

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
  onAddPost: (content: string, imageUrl: string | null) => void;
  myAvatarUrl: string;
  onUpdateAvatar: (newImageUrl: string) => void;
  onUpdateProfile: (newUsername: string) => Promise<void>;
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
    onToggleFollow,
    onAddPost,
    myAvatarUrl,
    onUpdateAvatar,
    onUpdateProfile
}) => {
  const userPosts = posts.filter(p => p.userId === userId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  let user: Post | Omit<Post, 'id'| 'content' | 'timestamp'> | undefined = userPosts.length > 0 ? userPosts[0] : posts.find(p => p.userId === userId);
  const isMyProfile = userId === myUserId;
  const isFollowing = following.has(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  // Special handling for my own profile to ensure it always renders, even without posts
  if (isMyProfile && !user) {
    user = {
        userId: myUserId,
        username: 'مستخدم جديد', // This will be updated by auth user's display name, but as fallback.
        avatarUrl: myAvatarUrl,
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsUploadingAvatar(true);
        try {
            const newImageUrl = await uploadImage(file);
            onUpdateAvatar(newImageUrl);
        } catch(error) {
            onShowToast('فشل تحديث الصورة. الرجاء المحاولة مرة أخرى.');
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !newUsername.trim() || newUsername.trim() === user.username) return;
    setIsSaving(true);
    try {
        await onUpdateProfile(newUsername.trim());
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to update profile:", error);
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
        setNewUsername(user.username);
    }
  };

  if (!user) {
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
            <div className="relative w-32 h-32 mx-auto mb-4">
                <img 
                    src={isMyProfile ? myAvatarUrl.replace('/48', '/128') : user.avatarUrl.replace('/48', '/128')}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
                />
                {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
                {isMyProfile && !isUploadingAvatar && (
                    <>
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 ring-white ring-offset-2 ring-offset-blue-600"
                            aria-label="تغيير الصورة الشخصية"
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
            
            {isEditing ? (
                <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="text-3xl font-bold text-gray-800 text-center bg-gray-100 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full max-w-xs mx-auto"
                    autoFocus
                />
            ) : (
                <h2 className="text-3xl font-bold text-gray-800">{user.username}</h2>
            )}

            <p className="text-gray-500 mt-1">@{user.userId.substring(0,8)}...</p>

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

            {isMyProfile && !isEditing && (
                <div className="flex justify-center">
                    <button
                        onClick={() => {
                            setIsEditing(true);
                            setNewUsername(user.username);
                        }}
                        className="mt-4 font-semibold px-6 py-2 rounded-full transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                    >
                        <PencilIcon className="w-5 h-5" />
                        <span>تعديل الملف الشخصي</span>
                    </button>
                </div>
            )}
            {isMyProfile && isEditing && (
                <div className="mt-4 flex gap-4 justify-center">
                    <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="font-semibold px-8 py-2 rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSaveProfile}
                        disabled={isSaving || !newUsername.trim() || newUsername.trim() === user.username}
                        className="font-semibold px-8 py-2 rounded-full transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed w-32"
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                </div>
            )}
        </div>

        {isMyProfile && <CreatePostWidget onAddPost={onAddPost} myAvatarUrl={myAvatarUrl} onShowToast={onShowToast} />}

        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">المنشورات</h3>
        <div className="space-y-6">
            {userPosts.length > 0 ? (
                userPosts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      myUserId={myUserId}
                      onSelectUser={onSelectUser}
                      onAddComment={onAddComment}
                      onShowToast={onShowToast}
                      onLikePost={onLikePost}
                      onSharePost={onSharePost}
                      myAvatarUrl={myAvatarUrl}
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
