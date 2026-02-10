
import React from 'react';
import { Profile } from '../types';
import { MapPin, MessageCircle } from 'lucide-react';
import { useTranslation } from '../App';

interface ProfileCardProps {
  profile: Profile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const { startConversation } = useTranslation();
  const defaultAvatar = "https://images.unsplash.com/photo-1535711761886-2522ada467ad?auto=format&fit=crop&q=80&w=400";

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    startConversation(profile);
  };

  return (
    <div className="group relative overflow-hidden rounded-[2rem] aspect-[3/4] cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <img 
        src={profile.imageUrl || defaultAvatar} 
        alt={profile.name} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        onError={(e) => {
          (e.target as HTMLImageElement).src = defaultAvatar;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-xl font-bold leading-tight">{profile.name}, {profile.age}</h3>
        <div className="flex items-center gap-1 text-xs text-white/80 mb-3 mt-1 font-medium"><MapPin className="w-3 h-3" />{profile.location}</div>
        <div className="flex items-center justify-between">
          <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">{profile.interest}</span>
          <button 
            onClick={handleMessageClick}
            className="w-10 h-10 flex items-center justify-center bg-pink-500 rounded-full hover:bg-pink-600 transition-colors shadow-lg active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
