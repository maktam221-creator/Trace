

import React, { useState, useEffect } from 'react';
import { Post, Comment, Profile, EditableProfileData } from './types';
import { generateSamplePosts } from './services/geminiService';
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
import { onAuthStateChanged, User, signOut, updateProfile } from 'firebase/auth';
import UserCard from './components/UserCard';

const POSTS_STORAGE_KEY = 'aegypt_posts';
const PROFILES_STORAGE_KEY = 'aegypt_profiles';
const AVATAR_STORAGE_KEY_PREFIX = 'aegypt_avatar_';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'search'>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchPostResults, setSearchPostResults] = useState<Post[]>([]);
  const [searchUserResults, setSearchUserResults] = useState<(Profile & { id: string })[]>([]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setProfiles({});
      setMyAvatarUrl('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const AVATAR_STORAGE_KEY = `${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`;

    let loadedPosts: Post[] = [];
    const storedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
    if (storedPosts) {
      try {
        loadedPosts = JSON.parse(storedPosts).map((post: any) => ({
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
        loadedProfiles = JSON.parse(storedProfiles);
      } catch (e) {
        console.error("Failed to parse profiles from localStorage", e);
        localStorage.removeItem(PROFILES_STORAGE_KEY);
      }
    }

    // Ensure the current user has a profile. This makes new users appear in search.
    if (!loadedProfiles[user.uid]) {
      loadedProfiles[user.uid] = {
        username: user.displayName || user.email?.split('@')[0] || 'مستخدم',
        avatarUrl: `https://picsum.photos/seed/${user.uid}/48`,
        gender: '',
        qualification: '',
        country: '',
        followers: [],
        following: [],
      };
    }

    // Hydrate profiles from posts if they don't exist
    loadedPosts.forEach(post => {
      if (!loadedProfiles[post.userId]) {
        loadedProfiles[post.userId] = {
          username: post.username,
          avatarUrl: post.avatarUrl,
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

    if (loadedPosts.length > 0 || Object.keys(loadedProfiles).length > 0) {
      setPosts(loadedPosts);
      setProfiles(loadedProfiles);
      setIsLoading(false);
    } else {
      // No posts loaded, and we won't generate any. Just finish loading.
      setPosts([]);
      // Keep any profiles that might exist for users with no posts
      setProfiles(loadedProfiles);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    }
  }, [posts, isLoading]);

  useEffect(() => {
    if (!isLoading && Object.keys(profiles).length > 0) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles, isLoading]);
  
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
    showToast('تم تحديث صورة ملفك الشخصي بنجاح!');
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
        
        showToast('تم تحديث ملفك الشخصي بنجاح!');
    } catch (error) {
        console.error("Error updating profile: ", error);
        showToast("حدث خطأ أثناء تحديث الملف الشخصي.");
        throw error; // Re-throw to be caught in ProfilePage if needed for UI state
    }
  };


  const handleAddPost = (content: string, imageUrl: string | null) => {
    if (!user) return;
    const myProfile = profiles[user.uid];

    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'مستخدم',
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
    showToast('تم نشر منشورك بنجاح!');
  };
  
  const handleAddComment = (postId: string, commentText: string) => {
    if (!user) return;
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          const newComment: Comment = {
            id: Date.now().toString(),
            userId: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'مستخدم',
            text: commentText,
            timestamp: new Date(),
          };
          return { ...post, comments: [...(post.comments || []), newComment] };
        }
        return post;
      })
    );
  };

  const handleLikePost = (postId: string) => setPosts(currentPosts => currentPosts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
  const handleSharePost = (postId: string) => setPosts(currentPosts => currentPosts.map(p => p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p));

  const handleToggleFollow = (userIdToToggle: string) => {
    if (!user) return;
    const myId = user.uid;

    setProfiles(currentProfiles => {
        const newProfiles = { ...currentProfiles };

        // Get or create profile for current user, ensuring arrays exist
        const myProfile = { 
            ...(newProfiles[myId] || { 
                username: user.displayName || '', 
                avatarUrl: myAvatarUrl, 
                gender: '', qualification: '', country: '' 
            }),
            followers: newProfiles[myId]?.followers || [],
            following: newProfiles[myId]?.following || [],
        };
        
        // Get or create profile for target user, ensuring arrays exist
        const targetUserPost = posts.find(p => p.userId === userIdToToggle);
        const otherProfile = { 
            ...(newProfiles[userIdToToggle] || { 
                username: targetUserPost?.username || 'المستخدم', 
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
            showToast(`تم إلغاء متابعة ${otherProfile.username}`);
        } else {
            myProfile.following.push(userIdToToggle);
            otherProfile.followers.push(myId);
            showToast(`تمت متابعة ${otherProfile.username}`);
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
    setSearchPostResults([]);
    setSearchUserResults([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search'); // Always switch to search view
    const lowercasedQuery = query.toLowerCase().trim();

    if (!lowercasedQuery) {
      // If query is empty, show all users
      const allUsers = (Object.entries(profiles) as [string, Profile][])
        .map(([userId, profile]) => ({...profile, id: userId}));
      setSearchUserResults(allUsers);
      setSearchPostResults([]);
    } else {
      // If query is not empty, perform search
      const postResults = posts.filter(p => p.content.toLowerCase().includes(lowercasedQuery) || p.username.toLowerCase().includes(lowercasedQuery));
      setSearchPostResults(postResults);

      const userResults = (Object.entries(profiles) as [string, Profile][])
          .filter(([, profile]) => profile && profile.username.toLowerCase().includes(lowercasedQuery))
          .map(([userId, profile]) => ({...profile, id: userId}));
      setSearchUserResults(userResults);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("تم تسجيل الخروج بنجاح.");
    } catch (error) {
      console.error("Error signing out: ", error);
      showToast("حدث خطأ أثناء تسجيل الخروج.");
    }
  };

  if (isAuthLoading) {
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
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onLogout={handleLogout}
        myAvatarUrl={myAvatarUrl}
      />
      <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        {isLoading && <LoadingSpinner />}
        {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
        
        {!isLoading && !error && currentView === 'home' && (
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
                    <h3 className="text-2xl font-bold text-gray-800">مرحباً بك في Aegypt!</h3>
                    <p className="mt-2">يبدو أن الساحة هادئة...</p>
                    <p className="mt-1">كن أول من يشارك أفكاره ويبدأ النقاش!</p>
                </div>
            )}
          </>
        )}

        {!isLoading && !error && currentView === 'search' && (() => {
            const filteredUserResults = searchUserResults.filter(p => p.id !== user.uid);
            const isSearching = searchQuery.trim().length > 0;
            
            return (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  {isSearching 
                    ? <>نتائج البحث عن: <span className="text-blue-600">"{searchQuery}"</span></>
                    : 'اكتشف المستخدمين'
                  }
                </h2>
                
                {filteredUserResults.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">المستخدمون</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredUserResults.map(userProfile => (
                                <UserCard key={userProfile.id} userProfile={userProfile} onSelectUser={handleSelectUser} />
                            ))}
                        </div>
                    </div>
                )}

                {isSearching && searchPostResults.length > 0 && (
                    <div>
                        {filteredUserResults.length > 0 && <h3 className="text-lg font-semibold text-gray-700 mb-4">المنشورات</h3>}
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
                      {isSearching ? 'لم يتم العثور على نتائج' : 'لا يوجد مستخدمون آخرون للعرض'}
                    </h3>
                    <p className="mt-2">
                      {isSearching ? 'جرّب البحث عن كلمة أخرى.' : 'عندما يقوم مستخدمون جدد بالتسجيل، سيظهرون هنا.'}
                    </p>
                  </div>
                )}
              </div>
            );
        })()}

        {!isLoading && !error && currentView === 'profile' && selectedUserId && (
          <ProfilePage userId={selectedUserId} myUserId={user.uid} myDisplayName={user.displayName || ''} posts={posts} userProfile={profiles[selectedUserId]} onSelectUser={handleSelectUser} onBack={handleGoHome} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} following={followingSet} onToggleFollow={handleToggleFollow} onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onUpdateAvatar={handleUpdateAvatar} onUpdateProfile={handleUpdateProfile} />
        )}
      </main>

      {showPostForm && <PostForm onAddPost={handleAddPost} onClose={() => setShowPostForm(false)} onShowToast={showToast} />}
      <BottomNavBar onGoHome={handleGoHome} onGoToProfile={handleGoToMyProfile} onNewPost={() => setShowPostForm(true)} />
      <Toast message={toastMessage} />
    </div>
  );
};

export default App;