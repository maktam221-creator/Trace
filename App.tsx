import React, { useState, useEffect, useCallback } from 'react';
import { Post, Comment, Profile, EditableProfileData, Notification } from './types';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostForm from './components/PostForm';
import LoadingSpinner from './components/LoadingSpinner';
import BottomNavBar from './components/BottomNavBar';
import ProfilePage from './components/ProfilePage';
import NotificationsPage from './components/NotificationsPage';
import Toast from './components/Toast';
import CreatePostWidget from './components/CreatePostWidget';
import AuthPage from './components/AuthPage';
import FollowSuggestions from './components/FollowSuggestions';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { useTranslations } from './hooks/useTranslations';
import { useAppData } from './hooks/useAppData';

const App: React.FC = () => {
  const { t } = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'notifications'>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        const isNew = localStorage.getItem('aegypt_is_new_user') === 'true';
        setIsNewUser(isNew);
      } else {
        setIsNewUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const {
    posts,
    profiles,
    notifications,
    myAvatarUrl,
    isLoading: isDataLoading,
    suggestedUsers,
    handleAddPost: onAddPost,
    handleAddComment,
    handleLikePost,
    handleSharePost,
    handleToggleFollow,
    handleUpdateAvatar,
    handleUpdateProfile,
    handleMarkAllAsRead,
    handleNotificationClickLogic,
  } = useAppData(user);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleAddPost = useCallback((content: string, imageUrl: string | null) => {
    onAddPost(content, imageUrl);
    setShowPostForm(false);
    showToast(t('postAddedSuccess'));
  }, [onAddPost, showToast, t]);

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('profile');
  }, []);

  const handleGoToMyProfile = useCallback(() => {
    if (!user) return;
    handleSelectUser(user.uid);
  }, [user, handleSelectUser]);

  const handleGoHome = useCallback(() => {
    setCurrentView('home');
    setSelectedUserId(null);
  }, []);

  const handleGoToNotifications = useCallback(() => {
    setCurrentView('notifications');
    setSelectedUserId(null);
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    const navigationAction = handleNotificationClickLogic(notification);
    if (navigationAction.type === 'profile') {
      handleSelectUser(navigationAction.userId);
    } else {
      handleGoHome();
    }
  }, [handleNotificationClickLogic, handleSelectUser, handleGoHome]);
  
  const handleContinueFromSuggestions = useCallback(() => {
    localStorage.removeItem('aegypt_is_new_user');
    setIsNewUser(false);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast(t('logoutSuccess'));
    } catch (error) {
      console.error("Error signing out: ", error);
      showToast(t('logoutError'));
    }
  };

  if (isAuthLoading || isDataLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (isNewUser && suggestedUsers.length > 0) {
    return (
        <FollowSuggestions 
            suggestedUsers={suggestedUsers}
            following={new Set(profiles[user.uid]?.following || [])}
            onToggleFollow={handleToggleFollow}
            onContinue={handleContinueFromSuggestions}
        />
    );
  }

  const myCurrentProfile = profiles[user.uid];
  const followingSet = new Set(myCurrentProfile?.following || []);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header
        onGoHome={handleGoHome}
        onGoToProfile={handleGoToMyProfile}
        onLogout={handleLogout}
        myAvatarUrl={myAvatarUrl}
        unreadCount={unreadNotificationsCount}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllAsRead}
      />
      <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        {currentView === 'home' && (
          <>
            <CreatePostWidget onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onShowToast={showToast} />
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} myUserId={user.uid} profiles={profiles} onSelectUser={handleSelectUser} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} myAvatarUrl={myAvatarUrl} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16 mt-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-2xl font-bold text-gray-800">{t('welcomeTitle')}</h3>
                <p className="mt-2">{t('welcomeSubtitle')}</p>
                <p className="mt-1">{t('welcomeCallToAction')}</p>
              </div>
            )}
          </>
        )}

        {currentView === 'profile' && selectedUserId && (
          <ProfilePage userId={selectedUserId} myUserId={user.uid} myDisplayName={user.displayName || ''} posts={posts} profiles={profiles} userProfile={profiles[selectedUserId]} onSelectUser={handleSelectUser} onBack={handleGoHome} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} following={followingSet} onToggleFollow={handleToggleFollow} onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onUpdateAvatar={handleUpdateAvatar} onUpdateProfile={handleUpdateProfile} />
        )}

        {currentView === 'notifications' && (
          <NotificationsPage
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onMarkAllRead={handleMarkAllAsRead}
          />
        )}
      </main>

      <BottomNavBar
        currentView={currentView}
        onGoHome={handleGoHome}
        onNewPost={() => setShowPostForm(true)}
        onGoToProfile={handleGoToMyProfile}
        onGoToNotifications={handleGoToNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {showPostForm && <PostForm onAddPost={handleAddPost} onClose={() => setShowPostForm(false)} onShowToast={showToast} />}

      <Toast message={toastMessage} />
    </div>
  );
};

export default App;