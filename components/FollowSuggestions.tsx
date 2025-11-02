
import React from 'react';
import { Profile } from '../types';

interface FollowSuggestionsProps {
  suggestedUsers: (Profile & { id: string })[];
  following: Set<string>;
  onToggleFollow: (userId: string) => void;
  onContinue: () => void;
}

const FollowSuggestions: React.FC<FollowSuggestionsProps> = ({ suggestedUsers, following, onToggleFollow, onContinue }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            مرحباً بك في Aegypt!
          </h1>
          <p className="text-gray-600 mt-2">ابدأ بمتابعة بعض الحسابات المثيرة للاهتمام.</p>
        </div>

        <div className="space-y-4 mb-8 max-h-96 overflow-y-auto pr-2">
          {suggestedUsers.map((userProfile) => {
            const isFollowing = following.has(userProfile.id);
            return (
              <div key={userProfile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.username}
                    className="w-12 h-12 rounded-full object-cover mr-4 ml-0"
                  />
                  <div>
                    <p className="font-bold text-gray-800">{userProfile.username}</p>
                    <p className="text-sm text-gray-500">@{userProfile.id.substring(0, 10)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleFollow(userProfile.id)}
                  className={`font-semibold px-4 py-1.5 rounded-full transition-colors text-sm w-24 ${
                    isFollowing
                      ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isFollowing ? 'تتابعه' : 'متابعة'}
                </button>
              </div>
            );
          })}
        </div>

        <div>
          <button
            onClick={onContinue}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            متابعة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowSuggestions;
