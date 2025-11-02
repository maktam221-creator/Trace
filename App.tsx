
import React, { useState, useEffect } from 'react';
import { Post, Comment } from './types';
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
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

const POSTS_STORAGE_KEY = 'aegypt_posts';
const AVATAR_STORAGE_KEY_PREFIX = 'aegypt_avatar_';
const FOLLOWING_STORAGE_KEY_PREFIX = 'aegypt_following_';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'search'>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [myAvatarUrl, setMyAvatarUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const AVATAR_STORAGE_KEY = `${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`;
    const FOLLOWING_STORAGE_KEY = `${FOLLOWING_STORAGE_KEY_PREFIX}${user.uid}`;

    try {
      const storedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
      const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
      const storedFollowing = localStorage.getItem(FOLLOWING_STORAGE_KEY);

      const loadGeneratedPosts = async () => {
        try {
          const samplePosts = await generateSamplePosts();
          const postsWithTimestamps = samplePosts.map((post, index) => ({
            ...post,
            id: `${Date.now()}-${index}`,
            timestamp: new Date(Date.now() - index * 60000 * 5),
          }));
          setPosts(postsWithTimestamps);
        } catch (err) {
          console.error('Failed to generate sample posts:', err);
          setError('حدث خطأ أثناء تحميل المنشورات. الرجاء المحاولة مرة أخرى.');
        }
      };
      
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts).map((post: any) => ({
          ...post,
          timestamp: new Date(post.timestamp),
          comments: (post.comments || []).map((comment: any) => ({
            ...comment,
            timestamp: new Date(comment.timestamp),
          })),
        }));
        setPosts(parsedPosts);
      } else {
        loadGeneratedPosts();
      }

      setMyAvatarUrl(storedAvatar || `https://picsum.photos/seed/${user.uid}/48`);
      
      if (storedFollowing) {
        setFollowing(new Set(JSON.parse(storedFollowing)));
      }
    } catch (err) {
      console.error('Failed to load data from localStorage:', err);
      setError('حدث خطأ أثناء تحميل بياناتك المحفوظة.');
      localStorage.removeItem(POSTS_STORAGE_KEY);
      if(user) {
        localStorage.removeItem(`${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`);
        localStorage.removeItem(`${FOLLOWING_STORAGE_KEY_PREFIX}${user.uid}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    }
  }, [posts, isLoading]);
  
  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(`${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`, myAvatarUrl);
    }
  }, [myAvatarUrl, isLoading, user]);

  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(`${FOLLOWING_STORAGE_KEY_PREFIX}${user.uid}`, JSON.stringify(Array.from(following)));
    }
  }, [following, isLoading, user]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const handleUpdateAvatar = (newImageUrl: string) => {
    if (!user) return;
    setMyAvatarUrl(newImageUrl);
    setPosts(currentPosts => 
        currentPosts.map(post => 
            post.userId === user.uid 
            ? { ...post, avatarUrl: newImageUrl }
            : post
        )
    );
    showToast('تم تحديث صورة ملفك الشخصي بنجاح!');
  };

  const handleAddPost = (content: string, imageUrl: string | null) => {
    if (!user) return;
    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'مستخدم',
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
    setFollowing(currentFollowing => {
      const newFollowing = new Set(currentFollowing);
      const userToFollow = posts.find(p => p.userId === userIdToToggle);
      const username = userToFollow ? userToFollow.username : 'المستخدم';

      if (newFollowing.has(userIdToToggle)) {
        newFollowing.delete(userIdToToggle);
        showToast(`تم إلغاء متابعة ${username}`);
      } else {
        newFollowing.add(userIdToToggle);
        showToast(`تمت متابعة ${username}`);
      }
      return newFollowing;
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setCurrentView('home');
      return;
    }
    const lowercasedQuery = query.toLowerCase();
    const results = posts.filter(p => p.content.toLowerCase().includes(lowercasedQuery) || p.username.toLowerCase().includes(lowercasedQuery));
    setSearchResults(results);
    setCurrentView('search');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setPosts([]);
      setFollowing(new Set());
      setMyAvatarUrl('');
      setCurrentView('home');
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header 
        onGoHome={handleGoHome}
        onGoToProfile={handleGoToMyProfile} 
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onLogout={handleLogout}
      />
      <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        {isLoading && <LoadingSpinner />}
        {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
        
        {!isLoading && !error && currentView === 'home' && (
          <>
            <CreatePostWidget onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onShowToast={showToast} />
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} myUserId={user.uid} onSelectUser={handleSelectUser} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} myAvatarUrl={myAvatarUrl} />
              ))}
            </div>
          </>
        )}

        {!isLoading && !error && currentView === 'search' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">نتائج البحث عن: <span className="text-blue-600">"{searchQuery}"</span></h2>
            <div className="space-y-6">
              {searchResults.length > 0 ? (
                searchResults.map((post) => (
                  <PostCard key={post.id} post={post} myUserId={user.uid} onSelectUser={handleSelectUser} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} myAvatarUrl={myAvatarUrl} />
                ))
              ) : (
                <div className="text-center text-gray-500 py-10 bg-gray-100 rounded-lg">
                  <SearchIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold">لم يتم العثور على نتائج</h3>
                  <p className="mt-2">جرّب البحث عن كلمة أخرى.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && !error && currentView === 'profile' && selectedUserId && (
          <ProfilePage userId={selectedUserId} myUserId={user.uid} posts={posts} onSelectUser={handleSelectUser} onBack={handleGoHome} onAddComment={handleAddComment} onShowToast={showToast} onLikePost={handleLikePost} onSharePost={handleSharePost} following={following} onToggleFollow={handleToggleFollow} onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onUpdateAvatar={handleUpdateAvatar} />
        )}
      </main>

      {showPostForm && <PostForm onAddPost={handleAddPost} onClose={() => setShowPostForm(false)} onShowToast={showToast} />}
      <BottomNavBar onGoHome={handleGoHome} onGoToProfile={handleGoToMyProfile} onNewPost={() => setShowPostForm(true)} />
      <Toast message={toastMessage} />
    </div>
  );
};

export default App;