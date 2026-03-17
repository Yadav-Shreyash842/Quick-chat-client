import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const RightSidebar = () => {
  const { selectedUser, messages, selectedGroup, groupMessages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);

  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    const src = selectedGroup ? groupMessages : messages;
    setMsgImages(src.filter((msg) => msg.image).map((msg) => msg.image));
  }, [messages, groupMessages, selectedGroup]);

  if (!selectedUser && !selectedGroup) return null;

  return (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll max-md:hidden`}>
      {selectedGroup ? (
        // ── GROUP INFO ──
        <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
          <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold">
            {selectedGroup.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="px-10 text-xl font-medium mx-auto">{selectedGroup.name}</h1>
          <p className="px-10 mx-auto text-gray-400">{selectedGroup.members.length} members</p>
          <hr className="border-[#ffffff50] my-4 w-full" />
          <div className="px-5 w-full">
            <p className="text-xs mb-2">Members</p>
            {selectedGroup.members.map((member) => (
              <div key={member._id} className="flex items-center gap-2 py-1">
                <img
                  src={member.profilePic || assets.avatar_icon}
                  className="w-7 h-7 rounded-full object-cover"
                  alt=""
                />
                <span className="text-xs">{member.fullName}</span>
                {onlineUsers.includes(member._id) && (
                  <span className="w-2 h-2 rounded-full bg-green-400 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ── USER INFO ──
        <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-20 aspect-[1/1] rounded-full"
          />
          <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
            {onlineUsers.includes(selectedUser._id) && (
              <p className="w-5 h-5 rounded-full bg-green-500" />
            )}
            {selectedUser.fullName}
          </h1>
          <p className="px-10 mx-auto">{selectedUser.bio}</p>
        </div>
      )}

      <hr className="border-[#ffffff50] my-4" />
      <div className="px-5 text-xs">
        <p>Media</p>
        <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
          {msgImages.map((url, index) => (
            <div key={index} onClick={() => window.open(url)} className="cursor-pointer rounded">
              <img src={url} alt="" className="h-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => logout()}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
