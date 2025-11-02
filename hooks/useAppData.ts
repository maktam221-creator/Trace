import { useState, useEffect, useCallback } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { Post, Comment, Profile, EditableProfileData, Notification } from '../types';
import { useTranslations } from './useTranslations';

const POSTS_STORAGE_KEY = 'aegypt_posts';
const PROFILES_STORAGE_KEY = 'aegypt_profiles';
const NOTIFICATIONS_STORAGE_KEY = 'aegypt_notifications';
const AVATAR_STORAGE_KEY_PREFIX = 'aegypt_avatar_';

export const useAppData = (user: User | null) => {
  const { t } = useTranslations();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myAvatarUrl, setMyAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setProfiles({});
      setNotifications([]);
      setMyAvatarUrl('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const firebaseUidRegex = /^[a-zA-Z0-9]+$/;
    const AVATAR_STORAGE_KEY = `${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`;
    const NOTIFICATIONS_KEY = `${NOTIFICATIONS_STORAGE_KEY}_${user.uid}`;

    let loadedPosts: Post[] = [];
    const storedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts);
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
      }
    }

    let loadedProfiles: Record<string, Profile> = {};
    const storedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (storedProfiles) {
      try {
        const parsedProfiles = JSON.parse(storedProfiles);
        Object.keys(parsedProfiles).forEach(userId => {
          if (firebaseUidRegex.test(userId)) {
            loadedProfiles[userId] = parsedProfiles[userId];
          }
        });
      } catch (e) {
        console.error("Failed to parse profiles from localStorage", e);
      }
    }
    
    let loadedNotifications: Notification[] = [];
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (storedNotifications) {
      try {
        loadedNotifications = JSON.parse(storedNotifications).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
      } catch(e) {
        console.error("Failed to parse notifications from localStorage", e);
      }
    }

    if (!loadedProfiles[user.uid]) {
      loadedProfiles[user.uid] = {
        username: user.displayName || user.email?.split('@')[0] || t('user'),
        avatarUrl: `https://picsum.photos/seed/${user.uid}/48`,
        followers: [],
        following: [],
      };
    }

    loadedPosts.forEach(post => {
      if (!loadedProfiles[post.userId]) {
        loadedProfiles[post.userId] = {
          username: post.username,
          avatarUrl: post.avatarUrl || `https://picsum.photos/seed/${post.userId}/48`,
          followers: [],
          following: [],
        };
      }
      (post.comments || []).forEach((comment: Comment) => {
          if (!loadedProfiles[comment.userId]) {
              loadedProfiles[comment.userId] = {
                  username: comment.username,
                  avatarUrl: `https://picsum.photos/seed/${comment.userId}/48`,
                  followers: [],
                  following: [],
              }
          }
      });
    });

    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    setMyAvatarUrl(storedAvatar || loadedProfiles[user.uid]?.avatarUrl || `https://picsum.photos/seed/${user.uid}/48`);
    setPosts(loadedPosts);
    setProfiles(loadedProfiles);
    setNotifications(loadedNotifications);
    setIsLoading(false);
  }, [user, t]);

  useEffect(() => {
    if (!isLoading && user && posts.length > 0) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    }
  }, [posts, isLoading, user]);

  useEffect(() => {
    if (!isLoading && user && Object.keys(profiles).length > 0) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles, isLoading, user]);

  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(`${AVATAR_STORAGE_KEY_PREFIX}${user.uid}`, myAvatarUrl);
    }
  }, [myAvatarUrl, isLoading, user]);

  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(`${NOTIFICATIONS_STORAGE_KEY}_${user.uid}`, JSON.stringify(notifications));
    }
  }, [notifications, isLoading, user]);

  const createNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(current => [newNotification, ...current]);
  }, []);

  const handleUpdateAvatar = useCallback((newImageUrl: string) => {
    if (!user) return;
    setMyAvatarUrl(newImageUrl);
    setProfiles(current => ({
      ...current,
      [user.uid]: {
        ...(current[user.uid] || { username: user.displayName || '' }),
        avatarUrl: newImageUrl,
      }
    }));
    setPosts(current => current.map(post => post.userId === user.uid ? { ...post, avatarUrl: newImageUrl } : post));
  }, [user]);

  const handleUpdateProfile = useCallback(async (profileData: EditableProfileData) => {
    if (!user) throw new Error("No user");
    const { username } = profileData;

    if (username !== user.displayName) {
      await updateProfile(user, { displayName: username });
    }
    
    setProfiles(current => ({
      ...current,
      [user.uid]: {
        ...(current[user.uid] || { avatarUrl: myAvatarUrl }),
        username,
      }
    }));
    
    setPosts(current => current.map(post => {
      const updatedPost = post.userId === user.uid ? { ...post, username } : post;
      const updatedComments = (updatedPost.comments || []).map(comment =>
        comment.userId === user.uid ? { ...comment, username: username } : comment
      );
      return { ...updatedPost, comments: updatedComments };
    }));
  }, [user, myAvatarUrl]);

  const handleAddPost = useCallback((content: string, imageUrl: string | null) => {
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
    setPosts(current => [newPost, ...current]);
  }, [user, myAvatarUrl, t]);

  const handleAddComment = useCallback((postId: string, commentText: string) => {
    if (!user) return;
    setPosts(currentPosts => {
      const post = currentPosts.find(p => p.id === postId);
      if (post && post.userId !== user.uid) {
        createNotification({
          type: 'comment',
          actorId: user.uid,
          actorUsername: user.displayName || t('user'),
          actorAvatarUrl: myAvatarUrl,
          postId: post.id,
          postContentSample: post.content.substring(0, 50),
        });
      }
      return currentPosts.map(p => {
        if (p.id === postId) {
          const newComment: Comment = {
            id: Date.now().toString(),
            userId: user.uid,
            username: user.displayName || user.email?.split('@')[0] || t('user'),
            text: commentText,
            timestamp: new Date(),
          };
          return { ...p, comments: [...(p.comments || []), newComment] };
        }
        return p;
      });
    });
  }, [user, myAvatarUrl, t, createNotification]);

  const handleLikePost = useCallback((postId: string) => {
    if (!user) return;
    setPosts(currentPosts => {
      const post = currentPosts.find(p => p.id === postId);
      if (post && post.userId !== user.uid) {
        createNotification({
          type: 'like',
          actorId: user.uid,
          actorUsername: user.displayName || t('user'),
          actorAvatarUrl: myAvatarUrl,
          postId: post.id,
          postContentSample: post.content.substring(0, 50),
        });
      }
      return currentPosts.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p);
    });
  }, [user, myAvatarUrl, t, createNotification]);

  const handleSharePost = useCallback((postId: string) => {
    setPosts(current => current.map(p => p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p));
  }, []);

  const handleToggleFollow = useCallback((userIdToToggle: string) => {
    if (!user) return;
    const myId = user.uid;
    setProfiles(currentProfiles => {
      const newProfiles = { ...currentProfiles };
      const myProfile = { ...(newProfiles[myId] || { username: user.displayName || '', avatarUrl: myAvatarUrl }), followers: newProfiles[myId]?.followers || [], following: newProfiles[myId]?.following || [], };
      const targetUserPost = posts.find(p => p.userId === userIdToToggle);
      const otherProfile = { ...(newProfiles[userIdToToggle] || { username: targetUserPost?.username || t('user'), avatarUrl: targetUserPost?.avatarUrl || `https://picsum.photos/seed/${userIdToToggle}/48` }), followers: newProfiles[userIdToToggle]?.followers || [], following: newProfiles[userIdToToggle]?.following || [] };
      const isFollowing = myProfile.following.includes(userIdToToggle);
      if (isFollowing) {
        myProfile.following = myProfile.following.filter(id => id !== userIdToToggle);
        otherProfile.followers = otherProfile.followers.filter(id => id !== myId);
      } else {
        myProfile.following.push(userIdToToggle);
        otherProfile.followers.push(myId);
        createNotification({ type: 'follow', actorId: myId, actorUsername: myProfile.username, actorAvatarUrl: myProfile.avatarUrl });
      }
      newProfiles[myId] = myProfile;
      newProfiles[userIdToToggle] = otherProfile;
      return newProfiles;
    });
  }, [user, myAvatarUrl, posts, t, createNotification]);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(current => current.map(n => ({ ...n, read: true })));
  }, []);

  const handleNotificationClickLogic = useCallback((notification: Notification) => {
    setNotifications(current => current.map(n => n.id === notification.id ? { ...n, read: true } : n));
    if (notification.type === 'follow') {
      return { type: 'profile', userId: notification.actorId };
    }
    return { type: 'home' };
  }, []);

  const myCurrentProfile = profiles[user?.uid || ''];
  const followingSet = new Set(myCurrentProfile?.following || []);

  const suggestedUsers = user ? Object.entries(profiles)
      .filter(([id]) => id !== user.uid && !followingSet.has(id))
      .map(([id, profile]) => ({ ...profile, id }))
      .slice(0, 5)
  : [];

  return {
    posts,
    profiles,
    notifications,
    myAvatarUrl,
    isLoading,
    suggestedUsers,
    handleAddPost,
    handleAddComment,
    handleLikePost,
    handleSharePost,
    handleToggleFollow,
    handleUpdateAvatar,
    handleUpdateProfile,
    handleMarkAllAsRead,
    handleNotificationClickLogic,
  };
};