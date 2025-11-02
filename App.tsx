import React, { useState, useEffect } from 'react';
import { Post, Comment, Profile, EditableProfileData } from './types';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostForm from './components/PostForm';
import LoadingSpinner from './components/LoadingSpinner';
import BottomNavBar from './components/BottomNavBar';
import ProfilePage from './components/ProfilePage';
import Toast from './components/Toast';
import CreatePostWidget from './components/CreatePostWidget';
import AuthPage from './components/AuthPage';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut, updateProfile } from 'firebase/auth';
import { useTranslations } from './hooks/useTranslations';

const POSTS_STORAGE_KEY = 'aegypt_posts';
const PROFILES_STORAGE_KEY = 'aegypt_profiles';
const AVATAR_STORAGE_KEY_PREFIX = 'aegypt_avatar_';

const App: React.FC = () => {
  const { t } = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile'>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState('');


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
        return;
    }

    if (!user) {
      setPosts([]);
      setProfiles({});
      setMyAvatarUrl('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Heuristic for identifying Firebase UIDs. They are typically 28-character alphanumeric strings.
    const firebaseUidRegex = /^[a-zA-Z0-9]{28}$/;

    const AVATAR_STORAGE_KEY = `${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`;

    let loadedPosts: Post[] = [];
    const storedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts);
        // Filter out posts from non-Firebase UID authors (i.e., old AI-generated posts)
        loadedPosts = parsedPosts
          .filter((post: any) => post && typeof post.userId === 'string' && firebaseUidRegex.test(post.userId))
          .map((post: any) => ({
            ...post,
            timestamp: new Date(post.timestamp),
            comments: (post.comments || []).map((comment: any) => ({
              ...comment,
              timestamp: new Date(comment.timestamp),
            })),
          }));
      } catch (e) {
        console.error("Failed to parse posts from localStorage", e);
        localStorage.removeItem(POSTS_STORAGE_KEY);
      }
    }

    const storedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    let loadedProfiles: Record<string, Profile> = {};
    if (storedProfiles) {
      try {
        const parsedProfiles = JSON.parse(storedProfiles);
        // Filter out profiles from non-Firebase UIDs (i.e., old AI-generated users)
        Object.keys(parsedProfiles).forEach(userId => {
          if (firebaseUidRegex.test(userId)) {
            loadedProfiles[userId] = parsedProfiles[userId];
          }
        });
      } catch (e) {
        console.error("Failed to parse profiles from localStorage", e);
        localStorage.removeItem(PROFILES_STORAGE_KEY);
      }
    }
    
    // Ensure the current user has a profile. This makes new users appear in search.
    if (!loadedProfiles[user.uid]) {
      loadedProfiles[user.uid] = {
        username: user.displayName || user.email?.split('@')[0] || t('user'),
        avatarUrl: `https://picsum.photos/seed/${user.uid}/48`,
        followers: [],
        following: [],
      };
    }

    // Re-populate profiles from loaded posts to ensure all posting users are discoverable.
    loadedPosts.forEach(post => {
      if (!loadedProfiles[post.userId]) {
        loadedProfiles[post.userId] = {
          username: post.username,
          avatarUrl: post.avatarUrl || `https://picsum.photos/seed/${post.userId}/48`,
          followers: [],
          following: [],
        };
      }
    });

    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    setMyAvatarUrl(storedAvatar || loadedProfiles[user.uid]?.avatarUrl || `https://picsum.photos/seed/${user.uid}/48`);

    setPosts(loadedPosts);
    setProfiles(loadedProfiles);
    
    setIsLoading(false);

  }, [user, isAuthLoading, t]);

  useEffect(() => {
    if (!isLoading && user) {
      if (posts.length > 0) {
        localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
      } else {
        localStorage.removeItem(POSTS_STORAGE_KEY);
      }
    }
  }, [posts, isLoading, user]);

  useEffect(() => {
    if (!isLoading && user) {
      if (Object.keys(profiles).length > 0) {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
      } else {
        localStorage.removeItem(PROFILES_STORAGE_KEY);
      }
    }
  }, [profiles, isLoading, user]);
  
  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(`${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`, myAvatarUrl);
    }
  }, [myAvatarUrl, isLoading, user]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateAvatar = (newImageUrl: string) => {
    if (!user) return;
    setMyAvatarUrl(newImageUrl);
    
    setProfiles(currentProfiles => ({
        ...currentProfiles,
        [user.uid]: {
            ...(currentProfiles[user.uid] || { 
                username: user.displayName || '', 
            }),
            avatarUrl: newImageUrl,
        }
    }));

    setPosts(currentPosts => 
        currentPosts.map(post => 
            post.userId === user.uid 
            ? { ...post, avatarUrl: newImageUrl }
            : post
        )
    );
    showToast(t('avatarUpdatedSuccess'));
  };

  const handleUpdateProfile = async (profileData: EditableProfileData) => {
    if (!user) return Promise.reject("No user");

    const { username } = profileData;

    try {
        if (username !== user.displayName) {
            await updateProfile(user, {
                displayName: username
            });
        }
        
        setProfiles(currentProfiles => ({
            ...currentProfiles,
            [user.uid]: {
                ...(currentProfiles[user.uid] || { avatarUrl: myAvatarUrl }),
                username,
            }
        }));
        
        setPosts(currentPosts => 
            currentPosts.map(post => {
                const updatedPost = post.userId === user.uid
                    ? { ...post, username }
                    : post;
                
                const updatedComments = (updatedPost.comments || []).map(comment =>
                    comment.userId === user.uid
                    ? { ...comment, username: username }
                    : comment
                );

                return { ...updatedPost, comments: updatedComments };
            })
        );
        
        showToast(t('profileUpdatedSuccess'));
    } catch (error) {
        console.error("Error updating profile: ", error);
        showToast(t('profileUpdateError'));
        throw error; // Re-throw to be caught in ProfilePage if needed for UI state
    }
  };


  const handleAddPost = (content: string, imageUrl: string | null) => {
    if (!user) return;

    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.uid,
      username: user.displayName || user.email?.split('@')[0] || t('user'),
      avatarUrl: myAvatarUrl,
      content,
      timestamp: new Date(),
      comments: [],
      likes: 0,
      shares: 0,
      ...(imageUrl && { imageUrl }),
    };
    setPosts([newPost, ...posts]);
    setShowPostForm(false);
    showToast(t('postAddedSuccess'));
  };
  
  const handleAddComment = (postId: string, commentText: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setPosts(currentPosts => 
      currentPosts.map(p => {
        if (p.id === postId) {
          const newComment: Comment = {
            id: Date.now().toString(),
            userId: user.uid,
            username: user.displayName || user.email?.split('@')[0] || t('user'),
            text: commentText,
            timestamp: new Date(),
          };
          return { ...post, comments: [...(post.comments || []), newComment] };
        }
        return p;
      })
    );
  };

  const handleLikePost = (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setPosts(currentPosts => currentPosts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
  };

  const handleSharePost = (postId: string) => setPosts(currentPosts => currentPosts.map(p => p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p));

  const handleToggleFollow = (userIdToToggle: string) => {
    if (!user) return;
    const myId = user.uid;

    setProfiles(currentProfiles => {
        const newProfiles = { ...currentProfiles };

        const myProfile = { 
            ...(newProfiles[myId] || { 
                username: user.displayName || '', 
                avatarUrl: myAvatarUrl, 
            }),
            followers: newProfiles[myId]?.followers || [],
            following: newProfiles[myId]?.following || [],
        };
        
        const targetUserPost = posts.find(p => p.userId === userIdToToggle);
        const otherProfile = { 
            ...(newProfiles[userIdToToggle] || { 
                username: targetUserPost?.username || t('user'), 
                avatarUrl: targetUserPost?.avatarUrl || `https://picsum.photos/seed/${userIdToToggle}/48`,
            }),
            followers: newProfiles[userIdToToggle]?.followers || [],
            following: newProfiles[userIdToToggle]?.following || [],
        };

        const isFollowing = myProfile.following.includes(userIdToToggle);

        if (isFollowing) {
            myProfile.following = myProfile.following.filter(id => id !== userIdToToggle);
            otherProfile.followers = otherProfile.followers.filter(id => id !== myId);
            showToast(t('unfollowedUser', { username: otherProfile.username }));
        } else {
            myProfile.following.push(userIdToToggle);
            otherProfile.followers.push(myId);
            showToast(t('followedUser', { username: otherProfile.username }));
        }

        newProfiles[myId] = myProfile;
        newProfiles[userIdToToggle] = otherProfile;

        return newProfiles;
    });
  };


  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('profile');
  };
  
  const handleGoToMyProfile = () => {
    if (!user) return;
    handleSelectUser(user.uid);
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setSelectedUserId(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast(t('logoutSuccess'));
    } catch (error) {
      console.error("Error signing out: ", error);
      showToast(t('logoutError'));
    }
  };

  if (isAuthLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }
  
  if (!user) {
    return <AuthPage />;
  }
  
  const myCurrentProfile = profiles[user.uid];
  const followingSet = new Set(myCurrentProfile?.following || []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header 
        onGoHome={handleGoHome}
        onGoToProfile={handleGoToMyProfile} 
        onLogout={handleLogout}
        myAvatarUrl={myAvatarUrl}
      />
      <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
        
        {currentView === 'home' && (
          <>
            <CreatePostWidget onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onShowToast={showToast} />
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} myUserId={user.uid} onSelectUser={handleSelectUser} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} myAvatarUrl={myAvatarUrl} />
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
          <ProfilePage userId={selectedUserId} myUserId={user.uid} myDisplayName={user.displayName || ''} posts={posts} userProfile={profiles[selectedUserId]} onSelectUser={handleSelectUser} onBack={handleGoHome} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} following={followingSet} onToggleFollow={handleToggleFollow} onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onUpdateAvatar={handleUpdateAvatar} onUpdateProfile={handleUpdateProfile} />
        )}
      </main>
      
      <BottomNavBar 
        currentView={currentView}
        onGoHome={handleGoHome} 
        onNewPost={() => setShowPostForm(true)} 
        onGoToProfile={handleGoToMyProfile}
      />
      
      {showPostForm && <PostForm onAddPost={handleAddPost} onClose={() => setShowPostForm(false)} onShowToast={showToast} />}

      <Toast message={toastMessage} />
    </div>
  );
};

export default App;
