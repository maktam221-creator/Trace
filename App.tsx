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

const MY_USER_ID = 'new-user';
const POSTS_STORAGE_KEY = 'aegypt_posts';
const AVATAR_STORAGE_KEY = 'aegypt_avatar';
const FOLLOWING_STORAGE_KEY = 'aegypt_following';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'search'>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [myAvatarUrl, setMyAvatarUrl] = useState(`https://picsum.photos/seed/${MY_USER_ID}/48`);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);


  // Load data from localStorage on initial render, or generate if it doesn't exist
  useEffect(() => {
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

      if (storedAvatar) {
        setMyAvatarUrl(storedAvatar);
      }
      
      if (storedFollowing) {
        setFollowing(new Set(JSON.parse(storedFollowing)));
      }
    } catch (err) {
      console.error('Failed to load data from localStorage:', err);
      setError('حدث خطأ أثناء تحميل بياناتك المحفوظة. سنقوم بإعادة تعيين البيانات.');
      localStorage.removeItem(POSTS_STORAGE_KEY);
      localStorage.removeItem(AVATAR_STORAGE_KEY);
      localStorage.removeItem(FOLLOWING_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save posts to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    }
  }, [posts, isLoading]);
  
  // Save avatar to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(AVATAR_STORAGE_KEY, myAvatarUrl);
    }
  }, [myAvatarUrl, isLoading]);

  // Save following list to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(Array.from(following)));
    }
  }, [following, isLoading]);


  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };
  
  const handleUpdateAvatar = (newImageUrl: string) => {
    setMyAvatarUrl(newImageUrl);
    // Also update the avatar in all existing posts by the user
    setPosts(currentPosts => 
        currentPosts.map(post => 
            post.userId === MY_USER_ID 
            ? { ...post, avatarUrl: newImageUrl }
            : post
        )
    );
    showToast('تم تحديث صورة ملفك الشخصي بنجاح!');
  };

  const handleAddPost = (content: string, imageUrl: string | null) => {
    const newPost: Post = {
      id: Date.now().toString(),
      userId: MY_USER_ID,
      username: 'مستخدم جديد',
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
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          const newComment: Comment = {
            id: Date.now().toString(),
            userId: MY_USER_ID,
            username: 'مستخدم جديد',
            text: commentText,
            timestamp: new Date(),
          };
          return {
            ...post,
            comments: [...(post.comments || []), newComment]
          }
        }
        return post;
      })
    );
  };

  const handleLikePost = (postId: string) => {
    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: (post.likes || 0) + 1,
          };
        }
        return post;
      }),
    );
  };

  const handleSharePost = (postId: string) => {
      setPosts(currentPosts =>
          currentPosts.map(post => {
              if (post.id === postId) {
                  return {
                      ...post,
                      shares: (post.shares || 0) + 1,
                  };
              }
              return post;
          }),
      );
  };

  const handleToggleFollow = (userIdToToggle: string) => {
    setFollowing(currentFollowing => {
      const newFollowing = new Set(currentFollowing);
      const user = posts.find(p => p.userId === userIdToToggle);
      const username = user ? user.username : 'المستخدم';

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
    handleSelectUser(MY_USER_ID);
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setSelectedUserId(null);
    setSearchQuery(''); // Also reset search on go home
  };

  // New search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setCurrentView('home');
      return;
    }

    const lowercasedQuery = query.toLowerCase();
    const results = posts.filter(post => 
      post.content.toLowerCase().includes(lowercasedQuery) ||
      post.username.toLowerCase().includes(lowercasedQuery)
    );
    
    setSearchResults(results);
    setCurrentView('search');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header 
        onGoHome={handleGoHome}
        onGoToProfile={handleGoToMyProfile} 
        onSearch={handleSearch}
      />
      <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        {isLoading && <LoadingSpinner />}
        {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
        
        {!isLoading && !error && currentView === 'home' && (
          <>
            <CreatePostWidget onAddPost={handleAddPost} myAvatarUrl={myAvatarUrl} onShowToast={showToast} />
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onSelectUser={handleSelectUser}
                    onAddComment={handleAddComment}
                    onShowToast={showToast}
                    onLikePost={handleLikePost}
                    onSharePost={handleSharePost}
                    myAvatarUrl={myAvatarUrl}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-10">
                  <h2 className="text-2xl font-bold">لا توجد منشورات بعد</h2>
                  <p className="mt-2">كن أول من ينشر شيئًا!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* New Search View */}
        {!isLoading && !error && currentView === 'search' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              نتائج البحث عن: <span className="text-blue-600">"{searchQuery}"</span>
            </h2>
            <div className="space-y-6">
              {searchResults.length > 0 ? (
                searchResults.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onSelectUser={handleSelectUser}
                    onAddComment={handleAddComment}
                    onShowToast={showToast}
                    onLikePost={handleLikePost}
                    onSharePost={handleSharePost}
                    myAvatarUrl={myAvatarUrl}
                  />
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
          <ProfilePage 
            userId={selectedUserId}
            myUserId={MY_USER_ID}
            posts={posts}
            onSelectUser={handleSelectUser}
            onBack={handleGoHome}
            onAddComment={handleAddComment}
            onShowToast={showToast}
            onLikePost={handleLikePost}
            onSharePost={handleSharePost}
            following={following}
            onToggleFollow={handleToggleFollow}
            onAddPost={handleAddPost}
            myAvatarUrl={myAvatarUrl}
            onUpdateAvatar={handleUpdateAvatar}
          />
        )}
      </main>

      {showPostForm && (
        <PostForm
          onAddPost={handleAddPost}
          onClose={() => setShowPostForm(false)}
          onShowToast={showToast}
        />
      )}

      <BottomNavBar 
        onGoHome={handleGoHome}
        onGoToProfile={handleGoToMyProfile}
        onNewPost={() => setShowPostForm(true)}
      />

      <Toast message={toastMessage} />
    </div>
  );
};

export default App;
