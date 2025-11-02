import React, { useRef, useState, useEffect } from 'react';
import { Post, EditableProfileData, Profile } from '../types';
import PostCard from './PostCard';
import { ArrowRightIcon, CameraIcon, PencilIcon } from './Icons';
import CreatePostWidget from './CreatePostWidget';
import { uploadImage } from '../services/imageService';
import { useTranslations } from '../hooks/useTranslations';

interface ProfilePageProps {
  userId: string;
  myUserId: string;
  myDisplayName: string;
  posts: Post[];
  userProfile?: Profile;
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
  onUpdateProfile: (profileData: EditableProfileData) => Promise<void>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
    userId, 
    myUserId, 
    myDisplayName,
    posts, 
    userProfile,
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
  const { t } = useTranslations();
  const userPosts = posts.filter(p => p.userId === userId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const isMyProfile = userId === myUserId;
  const isFollowing = following.has(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  let userToDisplay: Profile | undefined = userProfile;
  if (!userToDisplay && userPosts.length > 0) {
      const p = userPosts[0];
      userToDisplay = {
          username: p.username,
          avatarUrl: p.avatarUrl,
      };
  }
  if (!userToDisplay && isMyProfile) {
      userToDisplay = {
          username: myDisplayName || t('newUser'),
          avatarUrl: myAvatarUrl,
      };
  }
  
  const [newUsername, setNewUsername] = useState(userToDisplay?.username || '');

  useEffect(() => {
    if (userToDisplay && !isEditing) {
      setNewUsername(userToDisplay.username);
    }
  }, [userToDisplay, isEditing]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsUploadingAvatar(true);
        try {
            const newImageUrl = await uploadImage(file);
            onUpdateAvatar(newImageUrl);
        } catch(error) {
            onShowToast(t('imageUpdateFailed'));
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }
  };

  const handleSaveProfile = async () => {
    if (!userToDisplay || !newUsername.trim()) return;
    setIsSaving(true);
    try {
        await onUpdateProfile({
            username: newUsername.trim()
        });
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to update profile:", error);
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (userToDisplay) {
        setNewUsername(userToDisplay.username);
    }
  };

  if (!userToDisplay) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">{t('userNotFound')}</p>
        <button onClick={onBack} className="text-blue-600 hover:underline mt-4 font-semibold">
          {t('backToHome')}
        </button>
      </div>
    );
  }

  const hasChanges = userToDisplay ? newUsername.trim() !== userToDisplay.username : false;

  return (
    <div>
        <div className="mb-6">
            <button onClick={onBack} className="inline-flex items-center text-blue-600 hover:underline font-semibold">
                <ArrowRightIcon className="w-5 h-5 me-2" />
                <span>{t('back')}</span>
            </button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
            <div className='text-center'>

                <div className="relative w-32 h-32 mx-auto mb-4">
                    <img 
                        src={isMyProfile ? myAvatarUrl.replace('/48', '/128') : userToDisplay.avatarUrl.replace('/48', '/128')}
                        alt={userToDisplay.username}
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
                                className="absolute bottom-1 end-1 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 ring-white ring-offset-2 ring-offset-blue-600"
                                aria-label={t('changeProfilePictureAria')}
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
                
                {isEditing ? (
                <div className="mt-6 w-full max-w-sm mx-auto space-y-4 text-start">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label>
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="text-center bg-gray-100 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full"
                        autoFocus
                    />
                    </div>
                </div>

                ) : (
                <>
                    <h2 className="text-3xl font-bold text-gray-800">{userToDisplay.username}</h2>
                    <p className="text-gray-500 mt-1">@{userId.substring(0,12)}...</p>
                </>
                )}
            </div>

            <div className="flex justify-around items-center mt-6 border-t border-gray-200 py-4">
                <div className="text-center w-1/3">
                    <p className="font-bold text-xl text-gray-800">{userPosts.length}</p>
                    <p className="text-sm text-gray-500">{t('posts')}</p>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold text-xl text-gray-800">{userToDisplay.followers?.length || 0}</p>
                    <p className="text-sm text-gray-500">{t('followers')}</p>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold text-xl text-gray-800">{userToDisplay.following?.length || 0}</p>
                    <p className="text-sm text-gray-500">{t('following')}</p>
                </div>
            </div>

            <div className="mt-4 text-center">
                {!isMyProfile && (
                    <button 
                        onClick={() => onToggleFollow(userId)}
                        className={`font-semibold px-8 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-40 ${
                            isFollowing
                                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isFollowing ? t('unfollow') : t('follow')}
                    </button>
                )}

                {isMyProfile && !isEditing && (
                    <div className="flex justify-center mt-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="font-semibold px-6 py-2 rounded-full transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                        >
                            <PencilIcon className="w-5 h-5" />
                            <span>{t('editProfile')}</span>
                        </button>
                    </div>
                )}
                {isMyProfile && isEditing && (
                    <>
                        <div className="mt-4 flex gap-4 justify-center">
                            <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="font-semibold px-8 py-2 rounded-full transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving || !newUsername.trim() || !hasChanges}
                                className="font-semibold px-8 py-2 rounded-full transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed w-32"
                            >
                                {isSaving ? t('saving') : t('save')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        {isMyProfile && <CreatePostWidget onAddPost={onAddPost} myAvatarUrl={myAvatarUrl} onShowToast={onShowToast} />}

        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{t('posts')}</h3>
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
                    <p>{t('noPostsYet')}</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ProfilePage;
