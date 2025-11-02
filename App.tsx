import React, { useState, useEffect } from 'react';
import { Post, Comment, Profile, EditableProfileData, Notification } from './types';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostForm from './components/PostForm';
import LoadingSpinner from './components/LoadingSpinner';
import BottomNavBar from './components/BottomNavBar';
import ProfilePage from './components/ProfilePage';
import Toast from './components/Toast';
import CreatePostWidget from './components/CreatePostWidget';
import { SearchIcon } from './components/Icons';
import AuthPage from './components/AuthPage';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut, updateProfile, deleteUser } from 'firebase/auth';
import UserCard from './components/UserCard';
import FollowSuggestions from './components/FollowSuggestions';
import NotificationsPage from './components/NotificationsPage';
import { useTranslations } from './hooks/useTranslations';

const POSTS_STORAGE_KEY = 'aegypt_posts';
const PROFILES_STORAGE_KEY = 'aegypt_profiles';
const NOTIFICATIONS_STORAGE_KEY = 'aegypt_notifications';
const AVATAR_STORAGE_KEY_PREFIX = 'aegypt_avatar_';

const App: React.FC = () => {
  const { t } = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'search' | 'notifications'>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchPostResults, setSearchPostResults] = useState<Post[]>([]);
  const [searchUserResults, setSearchUserResults] = useState<(Profile & { id: string })[]>([]);
  const [showFollowSuggestions, setShowFollowSuggestions] = useState(false);
  const [homeFeedView, setHomeFeedView] = useState<'foryou' | 'following'>('foryou');


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
      setNotifications([]);
      setMyAvatarUrl('');
      setShowFollowSuggestions(false);
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
    
    let loadedNotifications: Notification[] = [];
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (storedNotifications) {
        try {
            loadedNotifications = JSON.parse(storedNotifications).map((n: any) => ({
                ...n,
                timestamp: new Date(n.timestamp)
            }));
        } catch (e) {
            console.error("Failed to parse notifications from localStorage", e);
            localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
        }
    }


    // Ensure the current user has a profile. This makes new users appear in search.
    if (!loadedProfiles[user.uid]) {
      loadedProfiles[user.uid] = {
        username: user.displayName || user.email?.split('@')[0] || t('user'),
        avatarUrl: `https://picsum.photos/seed/${user.uid}/48`,
        gender: '',
        qualification: '',
        country: '',
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
          gender: post.gender || '',
          qualification: post.qualification || '',
          country: post.country || '',
          followers: [],
          following: [],
        };
      }
    });

    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    setMyAvatarUrl(storedAvatar || loadedProfiles[user.uid]?.avatarUrl || `https://picsum.photos/seed/${user.uid}/48`);

    setPosts(loadedPosts);
    setProfiles(loadedProfiles);
    setNotifications(loadedNotifications);

    const isNewUser = localStorage.getItem('aegypt_is_new_user') === 'true';
    const myProfile = loadedProfiles[user.uid];
    const hasNotFollowedAnyone = !myProfile || !myProfile.following || myProfile.following.length === 0;

    if (isNewUser && hasNotFollowedAnyone) {
        const otherUsersExist = Object.keys(loadedProfiles).filter(id => id !== user.uid).length > 0;
        if (otherUsersExist) {
            setShowFollowSuggestions(true);
        }
        localStorage.removeItem('aegypt_is_new_user');
    } else {
        setShowFollowSuggestions(false);
    }
    
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
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications, isLoading, user]);

  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(`${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`, myAvatarUrl);
    }
  }, [myAvatarUrl, isLoading, user]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const createNotification = (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      // Avoid notifying users about their own actions
      if (data.actorId === data.recipientId) return;

      const newNotification: Notification = {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      setNotifications(current => [newNotification, ...current]);
  };

  const handleUpdateAvatar = (newImageUrl: string) => {
    if (!user) return;
    setMyAvatarUrl(newImageUrl);
    
    setProfiles(currentProfiles => ({
        ...currentProfiles,
        [user.uid]: {
            ...(currentProfiles[user.uid] || { 
                username: user.displayName || '', 
                gender: '', 
                qualification: '', 
                country: '' 
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

    const { username, gender, qualification, country } = profileData;

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
                gender,
                qualification,
                country,
            }
        }));
        
        setPosts(currentPosts => 
            currentPosts.map(post => {
                const updatedPost = post.userId === user.uid
                    ? { ...post, username, gender, qualification, country }
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
    const myProfile = profiles[user.uid];

    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.uid,
      username: user.displayName || user.email?.split('@')[0] || t('user'),
      avatarUrl: myAvatarUrl,
      gender: myProfile?.gender || '',
      qualification: myProfile?.qualification || '',
      country: myProfile?.country || '',
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
    
    createNotification({
        recipientId: post.userId,
        actorId: user.uid,
        actorUsername: user.displayName || t('user'),
        actorAvatarUrl: myAvatarUrl,
        type: 'comment',
        postId: post.id,
        postContentSample: post.content.substring(0, 50),
    });
  };

  const handleLikePost = (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setPosts(currentPosts => currentPosts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    
    createNotification({
        recipientId: post.userId,
        actorId: user.uid,
        actorUsername: user.displayName || t('user'),
        actorAvatarUrl: myAvatarUrl,
        type: 'like',
        postId: post.id,
        postContentSample: post.content.substring(0, 50),
    });
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
                gender: '', qualification: '', country: '' 
            }),
            followers: newProfiles[myId]?.followers || [],
            following: newProfiles[myId]?.following || [],
        };
        
        const targetUserPost = posts.find(p => p.userId === userIdToToggle);
        const otherProfile = { 
            ...(newProfiles[userIdToToggle] || { 
                username: targetUserPost?.username || t('user'), 
                avatarUrl: targetUserPost?.avatarUrl || `https://picsum.photos/seed/${userIdToToggle}/48`,
                gender: '', qualification: '', country: ''
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

            createNotification({
                recipientId: userIdToToggle,
                actorId: myId,
                actorUsername: myProfile.username,
                actorAvatarUrl: myAvatarUrl,
                type: 'follow',
            });
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
    setSearchQuery('');
  };

  const handleGoToNotifications = () => {
    setCurrentView('notifications');
  }

  const handleGoToSearch = () => {
    setCurrentView('search');
    handleSearch(''); // Show all users by default
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
    const lowercasedQuery = query.toLowerCase().trim();

    if (!lowercasedQuery) {
      const allUsers = Object.entries(profiles)
        .filter(([, profile]) => profile && typeof profile === 'object' && typeof (profile as Profile).username === 'string')
        .map(([userId, profile]) => ({...(profile as Profile), id: userId}));
      setSearchUserResults(allUsers);
      setSearchPostResults([]);
    } else {
      const postResults = posts.filter(p => p.content.toLowerCase().includes(lowercasedQuery) || p.username.toLowerCase().includes(lowercasedQuery));
      setSearchPostResults(postResults);

      const userResults = Object.entries(profiles)
          .filter(([, profile]) => profile && typeof profile === 'object' && typeof (profile as Profile).username === 'string' && (profile as Profile).username.toLowerCase().includes(lowercasedQuery))
          .map(([userId, profile]) => ({...(profile as Profile), id: userId}));
      setSearchUserResults(userResults);
    }
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    const userToDelete = auth.currentUser;
    if (!userToDelete) {
      showToast(t('deleteAccountRelogin'));
      await signOut(auth);
      return;
    }
  
    const userId = userToDelete.uid;
  
    setPosts(currentPosts => {
      const postsWithoutUser = currentPosts.filter(p => p.userId !== userId);
      return postsWithoutUser.map(post => ({
        ...post,
        comments: (post.comments || []).filter(c => c.userId !== userId)
      }));
    });
  
    setProfiles(currentProfiles => {
      const newProfiles = { ...currentProfiles };
      delete newProfiles[userId];
  
      Object.keys(newProfiles).forEach(profileId => {
        const profile = newProfiles[profileId];
        if (profile.followers) {
          profile.followers = profile.followers.filter(id => id !== userId);
        }
        if (profile.following) {
          profile.following = profile.following.filter(id => id !== userId);
        }
        newProfiles[profileId] = profile;
      });
  
      return newProfiles;
    });

    setNotifications(current => current.filter(n => n.recipientId !== userId && n.actorId !== userId));

    localStorage.removeItem(`${AVATAR_STORAGE_KEY_PREFIX}${userId}`);
    localStorage.removeItem('aegypt_is_new_user');
  
    try {
      await deleteUser(userToDelete);
      showToast(t('deleteAccountSuccess'));
    } catch (error: any) {
      console.error("Error deleting user from Firebase:", error);
      await signOut(auth);
      if (error.code === 'auth/requires-recent-login') {
        showToast(t('deleteAccountRequiresRelogin'));
      } else {
        showToast(t('deleteAccountError'));
      }
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    if (!user) return;
    setNotifications(current => current.map(n => n.recipientId === user.uid ? { ...n, read: true } : n));
  };
  
  const handleNotificationClick = (notification: Notification) => {
    setNotifications(current => 
      current.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // For 'follow', go to the actor's profile.
    // For 'like'/'comment', go to the post owner's profile. A direct link to the post would be a future enhancement.
    const targetUserId = notification.type === 'follow' 
        ? notification.actorId 
        : posts.find(p => p.id === notification.postId)?.userId;

    if (targetUserId) {
        handleSelectUser(targetUserId);
    } else {
        // Fallback to home if the post/user doesn't exist anymore
        handleGoHome();
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

  const filteredPosts = homeFeedView === 'following'
    ? posts.filter(post => followingSet.has(post.userId) || post.userId === user.uid)
    : posts;

  const suggestedUsers = Object.entries(profiles)
    .filter(([userId]) => userId !== user.uid)
    .map(([id, profile]) => ({ id, ...(profile as object) }))
    .sort(() => 0.5 - Math.random()) // Shuffle
    .slice(0, 5); // Take up to 5
  
  const myNotifications = notifications.filter(n => n.recipientId === user.uid);
  const unreadNotificationsCount = myNotifications.filter(n => !n.read).length;

  if (showFollowSuggestions && suggestedUsers.length > 0) {
    return (
      <FollowSuggestions
        suggestedUsers={suggestedUsers}
        following={followingSet}
        onToggleFollow={handleToggleFollow}
        onContinue={() => setShowFollowSuggestions(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header 
        onGoHome={handleGoHome}
        onGoToProfile={handleGoToMyProfile} 
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onLogout={handleLogout}
        myAvatarUrl={myAvatarUrl}
        notifications={myNotifications}
        unreadCount={unreadNotificationsCount}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllNotificationsAsRead}
      />
      <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
        
        {currentView === 'home' && (
          <>
            <CreatePostWidget onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onShowToast={showToast} />
            
            <div className="flex border-b border-gray-200 mb-4 bg-white rounded-t-xl sticky top-[77px] z-[5] -mx-4 sm:mx-0">
                <button
                onClick={() => setHomeFeedView('foryou')}
                className={`w-1/2 py-3 text-center font-semibold transition-colors ${homeFeedView === 'foryou' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                >
                {t('forYou')}
                </button>
                <button
                onClick={() => setHomeFeedView('following')}
                className={`w-1/2 py-3 text-center font-semibold transition-colors ${homeFeedView === 'following' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                >
                {t('followingFeed')}
                </button>
            </div>
            
            {filteredPosts.length > 0 ? (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} myUserId={user.uid} onSelectUser={handleSelectUser} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} myAvatarUrl={myAvatarUrl} />
                ))}
              </div>
            ) : (
                <div className="text-center text-gray-500 py-16 mt-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                    {homeFeedView === 'following' ? (
                        <>
                            <h3 className="text-2xl font-bold text-gray-800">{t('noPostsInFollowingFeedTitle')}</h3>
                            <p className="mt-2">{t('noPostsInFollowingFeedSubtitle')}</p>
                            <button onClick={() => { setHomeFeedView('foryou'); handleGoToSearch(); }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                {t('discoverPosts')}
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold text-gray-800">{t('welcomeTitle')}</h3>
                            <p className="mt-2">{t('welcomeSubtitle')}</p>
                            <p className="mt-1">{t('welcomeCallToAction')}</p>
                        </>
                    )}
                </div>
            )}
          </>
        )}

        {currentView === 'notifications' && (
            <NotificationsPage 
                notifications={myNotifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllRead={handleMarkAllNotificationsAsRead}
            />
        )}

        {currentView === 'search' && (() => {
            const filteredUserResults = searchUserResults.filter(p => p.id !== user.uid);
            const isSearching = searchQuery.trim().length > 0;
            
            return (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  {isSearching 
                    ? <>{t('searchResultsFor')} <span className="text-blue-600">"{searchQuery}"</span></>
                    : t('discoverUsers')
                  }
                </h2>
                
                {filteredUserResults.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('users')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredUserResults.map(userProfile => (
                                <UserCard key={userProfile.id} userProfile={userProfile} onSelectUser={handleSelectUser} />
                            ))}
                        </div>
                    </div>
                )}

                {isSearching && searchPostResults.length > 0 && (
                    <div>
                        {filteredUserResults.length > 0 && <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('posts')}</h3>}
                        <div className="space-y-6">
                          {searchPostResults.map((post) => (
                            <PostCard key={post.id} post={post} myUserId={user.uid} onSelectUser={handleSelectUser} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} myAvatarUrl={myAvatarUrl} />
                          ))
                          }
                        </div>
                    </div>
                )}

                {searchPostResults.length === 0 && filteredUserResults.length === 0 && (
                  <div className="text-center text-gray-500 py-10 bg-gray-100 rounded-lg">
                    <SearchIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold">
                      {isSearching ? t('noResultsFound') : t('noOtherUsers')}
                    </h3>
                    <p className="mt-2">
                      {isSearching ? t('tryDifferentQuery') : t('newUsersWillAppearHere')}
                    </p>
                  </div>
                )}
              </div>
            );
        })()}

        {currentView === 'profile' && selectedUserId && (
          <ProfilePage userId={selectedUserId} myUserId={user.uid} myDisplayName={user.displayName || ''} posts={posts} userProfile={profiles[selectedUserId]} onSelectUser={handleSelectUser} onBack={handleGoHome} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} following={followingSet} onToggleFollow={handleToggleFollow} onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onUpdateAvatar={handleUpdateAvatar} onUpdateProfile={handleUpdateProfile} onDeleteAccount={handleDeleteAccount} />
        )}
      </main>
      
      <BottomNavBar 
        currentView={currentView}
        onGoHome={handleGoHome} 
        onNewPost={() => setShowPostForm(true)} 
        onGoToProfile={handleGoToMyProfile}
        onGoToNotifications={handleGoToNotifications}
        onGoToSearch={handleGoToSearch}
        unreadNotificationsCount={unreadNotificationsCount}
      />
      
      {showPostForm && <PostForm onAddPost={handleAddPost} onClose={() => setShowPostForm(false)} onShowToast={showToast} />}

      <Toast message={toastMessage} />
    </div>
  );
};

export default App;