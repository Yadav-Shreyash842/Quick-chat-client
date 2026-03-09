const CallGrup = ({ onAccept, onReject, type, user }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full mx-4 border border-gray-700">
        {/* User Profile Image/Avatar */}
        <div className="mb-6">
          {user?.profilePic ? (
            <img 
              src={user.profilePic} 
              alt={user?.fullName || user?.name}
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white/20 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto border-4 border-white/20">
              {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        
        {/* User Name */}
        <h2 className="mb-2 text-2xl font-semibold text-white">
          {user?.fullName || user?.name || 'Unknown User'}
        </h2>
        
        {/* Call Type */}
        <p className="mb-6 text-white/70 text-lg">
          {type === 'audio' ? '📞 Incoming Audio Call' : '📹 Incoming Video Call'}
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onAccept} 
            className="bg-green-500 hover:bg-green-600 px-8 py-3 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">✓</span> Accept
          </button>
          <button 
            onClick={onReject} 
            className="bg-red-500 hover:bg-red-600 px-8 py-3 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">✕</span> Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallGrup;