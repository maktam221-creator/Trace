import React, { useState, useEffect, useCallback } from 'react';
import { Post, Comment } from './types';
import { generateSamplePosts } from './services/geminiService';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostForm from './components/PostForm';
import LoadingSpinner from './components/LoadingSpinner';
import BottomNavBar from './components/BottomNavBar';
import ProfilePage from './components/ProfilePage';
import Toast from './components/Toast';

const MY_USER_ID = 'new-user';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'profile'>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadInitialPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const samplePosts = await generateSamplePosts();
      const postsWithTimestamps = samplePosts.map((post, index) => ({
        ...post,
        id: `${Date.now()}-${index}`,
        timestamp: new Date(Date.now() - index * 60000 * 5), // Stagger timestamps
      }));
      setPosts(postsWithTimestamps);
    } catch (err) {
      console.error('Failed to generate sample posts:', err);
      setError('حدث خطأ أثناء تحميل المنشورات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleAddPost = (content: string, imageUrl: string | null) => {
    const newPost: Post = {
      id: Date.now().toString(),
      userId: MY_USER_ID,
      username: 'مستخدم جديد',
      avatarUrl: `https://picsum.photos/seed/${Date.now()}/48`,
      content,
      timestamp: new Date(),
      comments: [],
      likes: 0,
      shares: 0,
      ...(imageUrl && { imageUrl }),
    };
    setPosts([newPost, ...posts]);
    setShowPostForm(false);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header onNewPost={() => setShowPostForm(true)} onGoHome={handleGoHome} />
      <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
        {isLoading && <LoadingSpinner />}
        {error && <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
        
        {!isLoading && !error && currentView === 'home' && (
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
                />
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">
                <h2 className="text-2xl font-bold">لا توجد منشورات بعد</h2>
                <p className="mt-2">كن أول من ينشر شيئًا!</p>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && currentView === 'profile' && selectedUserId && (
          <ProfilePage 
            userId={selectedUserId}
            posts={posts}
            onSelectUser={handleSelectUser}
            onBack={handleGoHome}
            onAddComment={handleAddComment}
            onShowToast={showToast}
            onLikePost={handleLikePost}
            onSharePost={handleSharePost}
          />
        )}
      </main>

      {showPostForm && (
        <PostForm
          onAddPost={handleAddPost}
          onClose={() => setShowPostForm(false)}
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