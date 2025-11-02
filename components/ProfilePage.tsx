

import React, { useRef, useState, useEffect } from 'react';
import { Post, EditableProfileData, Profile } from '../types';
import PostCard from './PostCard';
import { ArrowRightIcon, CameraIcon, PencilIcon, AcademicCapIcon, GlobeAltIcon, IdentificationIcon } from './Icons';
import CreatePostWidget from './CreatePostWidget';
import { uploadImage } from '../services/imageService';
import DeleteConfirmationModal from './DeleteConfirmationModal';

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
  onDeleteAccount: () => Promise<void>;
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
    onUpdateProfile,
    onDeleteAccount
}) => {
  const userPosts = posts.filter(p => p.userId === userId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const isMyProfile = userId === myUserId;
  const isFollowing = following.has(userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  let userToDisplay: Profile | undefined = userProfile;
  if (!userToDisplay && userPosts.length > 0) {
      const p = userPosts[0];
      userToDisplay = {
          username: p.username,
          avatarUrl: p.avatarUrl,
          gender: p.gender || '',
          qualification: p.qualification || '',
          country: p.country || '',
      };
  }
  if (!userToDisplay && isMyProfile) {
      userToDisplay = {
          username: myDisplayName || 'مستخدم جديد',
          avatarUrl: myAvatarUrl,
          gender: '',
          qualification: '',
          country: '',
      };
  }
  
  const [newUsername, setNewUsername] = useState(userToDisplay?.username || '');
  const [newGender, setNewGender] = useState(userToDisplay?.gender || '');
  const [newQualification, setNewQualification] = useState(userToDisplay?.qualification || '');
  const [newCountry, setNewCountry] = useState(userToDisplay?.country || '');

  useEffect(() => {
    if (userToDisplay && !isEditing) {
      setNewUsername(userToDisplay.username);
      setNewGender(userToDisplay.gender || '');
      setNewQualification(userToDisplay.qualification || '');
      setNewCountry(userToDisplay.country || '');
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
    if (!userToDisplay || !newUsername.trim()) return;
    setIsSaving(true);
    try {
        await onUpdateProfile({
            username: newUsername.trim(),
            gender: newGender.trim(),
            qualification: newQualification.trim(),
            country: newCountry.trim(),
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

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAccount();
      // No need to close modal or set loading, as the component will unmount on logout.
    } catch (error) {
      console.error("Failed to delete account:", error);
      onShowToast("حدث خطأ أثناء حذف الحساب.");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (!userToDisplay) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">لم يتم العثور على المستخدم.</p>
        <button onClick={onBack} className="text-blue-600 hover:underline mt-4 font-semibold">
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
    );
  }

  const hasChanges = userToDisplay ? (
    newUsername.trim() !== userToDisplay.username ||
    newGender.trim() !== (userToDisplay.gender || '') ||
    newQualification.trim() !== (userToDisplay.qualification || '') ||
    newCountry.trim() !== (userToDisplay.country || '')
  ) : false;

  return (
    <div>
        <div className="mb-6">
            <button onClick={onBack} className="inline-flex items-center text-blue-600 hover:underline font-semibold">
                <ArrowRightIcon className="w-5 h-5 ml-2" />
                <span>العودة</span>
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
                                className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 ring-white ring-offset-2 ring-offset-blue-600"
                                aria-label="تغيير الصورة الشخصية"
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
                
                {isEditing ? (
                <div className="mt-6 w-full max-w-sm mx-auto space-y-4 text-right">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="text-center bg-gray-100 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full"
                        autoFocus
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                    <input
                        type="text"
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value)}
                        className="text-center bg-gray-100 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="مثال: ذكر، أنثى"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المؤهل الدراسي</label>
                    <input
                        type="text"
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        className="text-center bg-gray-100 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="مثال: هندسة برمجيات"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الدولة</label>
                    <input
                        type="text"
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                        className="text-center bg-gray-100 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="مثال: مصر"
                    />
                    </div>
                </div>

                ) : (
                <>
                    <h2 className="text-3xl font-bold text-gray-800">{userToDisplay.username}</h2>
                    <p className="text-gray-500 mt-1">@{userId.substring(0,12)}...</p>

                    <div className="mt-6 border-t border-gray-200 pt-4 max-w-sm mx-auto">
                        <div className="text-right space-y-3">
                            <div className="flex items-center">
                                <IdentificationIcon className="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" />
                                <span className="font-semibold text-gray-600">النوع:</span>
                                <span className="mr-2 text-gray-800 truncate">{userToDisplay.gender || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center">
                                <AcademicCapIcon className="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" />
                                <span className="font-semibold text-gray-600">المؤهل الدراسي:</span>
                                <span className="mr-2 text-gray-800 truncate">{userToDisplay.qualification || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center">
                                <GlobeAltIcon className="w-6 h-6 text-gray-400 ml-4 flex-shrink-0" />
                                <span className="font-semibold text-gray-600">الدولة:</span>
                                <span className="mr-2 text-gray-800 truncate">{userToDisplay.country || 'غير محدد'}</span>
                            </div>
                        </div>
                    </div>
                </>
                )}
            </div>

            <div className="flex justify-around items-center mt-6 border-t border-gray-200 py-4">
                <div className="text-center w-1/3">
                    <p className="font-bold text-xl text-gray-800">{userPosts.length}</p>
                    <p className="text-sm text-gray-500">المنشورات</p>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold text-xl text-gray-800">{userToDisplay.followers?.length || 0}</p>
                    <p className="text-sm text-gray-500">المتابعون</p>
                </div>
                <div className="text-center w-1/3">
                    <p className="font-bold text-xl text-gray-800">{userToDisplay.following?.length || 0}</p>
                    <p className="text-sm text-gray-500">يتابع</p>
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
                        {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                    </button>
                )}

                {isMyProfile && !isEditing && (
                    <div className="flex justify-center mt-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="font-semibold px-6 py-2 rounded-full transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                        >
                            <PencilIcon className="w-5 h-5" />
                            <span>تعديل الملف الشخصي</span>
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
                                إلغاء
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving || !newUsername.trim() || !hasChanges}
                                className="font-semibold px-8 py-2 rounded-full transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed w-32"
                            >
                                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                            </button>
                        </div>
                        <div className="mt-6 border-t pt-4 text-center">
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={isSaving}
                                className="font-semibold text-sm text-red-600 hover:text-red-800 hover:bg-red-50 py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                حذف الحساب نهائياً
                            </button>
                        </div>
                    </>
                )}
            </div>
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

        <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            isLoading={isDeleting}
        />
    </div>
  );
};

export default ProfilePage;