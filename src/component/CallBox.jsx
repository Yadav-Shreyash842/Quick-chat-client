import { useEffect, useRef, useState } from "react";
import ActionBar from "./ActionBar";

const CallBox = ({ socket, user, offer, close, isReceiver, type, currentUser }) => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pc = useRef(null);
  const streamRef = useRef(null);
  
  // Call timer state
  const [callDuration, setCallDuration] = useState(0);
  const [callConnected, setCallConnected] = useState(false);
  const timerRef = useRef(null);
  
  // Format call duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.current.ontrack = (e) => {
      remoteVideo.current.srcObject = e.streams[0];
      // Start timer when remote track is received (call connected)
      if (!callConnected) {
        setCallConnected(true);
      }
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: user._id,
          candidate: e.candidate,
        });
      }
    };

    socket.on("call-answered", async ({ answer }) => {
      await pc.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      pc.current.addIceCandidate(candidate);
    });

    // remote ended the call
    socket.on("call-ended", () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        streamRef.current?.getTracks()?.forEach((t) => t.stop());
      } catch (err) {}
      try {
        pc.current?.close();
      } catch (err) {}
      close();
    });

    return () => {
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        streamRef.current?.getTracks()?.forEach((t) => t.stop());
      } catch (err) {}
      try {
        pc.current?.close();
      } catch (err) {}
    };
  }, []);
  
  // Timer effect - starts when call is connected
  useEffect(() => {
    if (callConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callConnected]);

  // 🔥 START CALL (Caller)
  const startCall = async () => {
    const useVideo = type === "video";
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      video: useVideo,
      audio: true,
    });

    localVideo.current.srcObject = streamRef.current;
    streamRef.current.getTracks().forEach((t) =>
      pc.current.addTrack(t, streamRef.current)
    );

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.emit("call-user", { to: user._id, offer, type });
  };

  // 🔥 ACCEPT CALL (Receiver)
  const acceptCall = async () => {
    const useVideo = type === "video";
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      video: useVideo,
      audio: true,
    });

    localVideo.current.srcObject = streamRef.current;
    streamRef.current.getTracks().forEach((t) =>
      pc.current.addTrack(t, streamRef.current)
    );

    await pc.current.setRemoteDescription(offer);

    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);

    socket.emit("answer-call", { to: user._id, answer });
  };

  useEffect(() => {
    if (isReceiver && offer) {
      acceptCall(); // 🔥 THIS WAS MISSING
    }
  }, [isReceiver, offer]);

  // auto-start outgoing call when CallBox is mounted for caller
  useEffect(() => {
    if (!isReceiver && type) {
      startCall();
    }
  }, [isReceiver, type]);

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    socket.emit("end-call", { to: user._id });
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch (err) {}
    try {
      pc.current?.close();
    } catch (err) {}
    close();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-50 flex flex-col">
      {/* Header with user info and timer */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-6">
        <div className="flex flex-col items-center">
          <h2 className="text-white text-2xl font-semibold">{user?.fullName || user?.name || 'User'}</h2>
          <p className="text-white/80 text-lg mt-1">
            {callConnected ? formatDuration(callDuration) : 'Connecting...'}
          </p>
        </div>
      </div>

      {/* Video Call Layout */}
      {type === "video" ? (
        <>
          {/* Remote video (full screen) */}
          <video 
            ref={remoteVideo} 
            autoPlay 
            className="w-full h-full object-cover" 
          />
          
          {/* Local video (picture-in-picture) */}
          <video
            ref={localVideo}
            autoPlay
            muted
            className="w-32 h-44 absolute top-24 right-6 rounded-lg border-2 border-white/30 shadow-2xl object-cover"
          />
          
          {/* Profile images placeholder for when video not connected */}
          {!callConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-8 mb-4">
                  {/* Current User */}
                  {currentUser?.profilePic ? (
                    <img 
                      src={currentUser.profilePic} 
                      alt={currentUser?.fullName}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white/20">
                      {currentUser?.fullName?.charAt(0)?.toUpperCase() || 'Y'}
                    </div>
                  )}
                  
                  {/* Connecting Icon */}
                  <div className="text-white text-3xl animate-pulse">↔</div>
                  
                  {/* Remote User */}
                  {user?.profilePic ? (
                    <img 
                      src={user.profilePic} 
                      alt={user?.fullName || user?.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white/20">
                      {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <p className="text-white text-xl mt-4">Connecting video...</p>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Audio Call Layout - Show both profile images */
        <>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {/* Both Users Profile Images Side by Side */}
              <div className="flex items-center justify-center gap-12 mb-8">
                {/* Current User Profile */}
                <div className="text-center">
                  <div className="relative mb-3">
                    {currentUser?.profilePic ? (
                      <img 
                        src={currentUser.profilePic} 
                        alt={currentUser?.fullName}
                        className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white/20"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl border-4 border-white/20">
                        {currentUser?.fullName?.charAt(0)?.toUpperCase() || 'Y'}
                      </div>
                    )}
                    {callConnected && (
                      <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <p className="text-white/80 text-sm font-medium">You</p>
                </div>
                
                {/* Audio Wave Animation */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-1 h-12">
                    <div className={`w-1 bg-green-400 rounded-full ${callConnected ? 'animate-pulse' : ''}`} style={{height: '20px'}}></div>
                    <div className={`w-1 bg-green-400 rounded-full ${callConnected ? 'animate-pulse' : ''}`} style={{height: '35px', animationDelay: '0.1s'}}></div>
                    <div className={`w-1 bg-green-400 rounded-full ${callConnected ? 'animate-pulse' : ''}`} style={{height: '25px', animationDelay: '0.2s'}}></div>
                    <div className={`w-1 bg-green-400 rounded-full ${callConnected ? 'animate-pulse' : ''}`} style={{height: '40px', animationDelay: '0.3s'}}></div>
                    <div className={`w-1 bg-green-400 rounded-full ${callConnected ? 'animate-pulse' : ''}`} style={{height: '30px', animationDelay: '0.4s'}}></div>
                  </div>
                  <p className="text-green-400 text-xs">{callConnected ? 'Connected' : 'Calling...'}</p>
                </div>
                
                {/* Remote User Profile */}
                <div className="text-center">
                  <div className="relative mb-3">
                    {user?.profilePic ? (
                      <img 
                        src={user.profilePic} 
                        alt={user?.fullName || user?.name}
                        className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-white/20"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl border-4 border-white/20">
                        {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    {callConnected && (
                      <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <p className="text-white/80 text-sm font-medium">{user?.fullName || user?.name || 'User'}</p>
                </div>
              </div>
              
              {/* Call Duration */}
              <p className="text-white/90 text-2xl font-semibold">
                {callConnected ? formatDuration(callDuration) : 'Connecting...'}
              </p>
            </div>
          </div>
          
          {/* Hidden video elements for audio call */}
          <video ref={remoteVideo} autoPlay className="hidden" />
          <video ref={localVideo} autoPlay muted className="hidden" />
        </>
      )}

      {/* Action Bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <ActionBar
          toggleMic={() => {
            const t = streamRef.current?.getAudioTracks?.()[0];
            if (t) t.enabled = !t.enabled;
          }}
          toggleCam={() => {
            const t = streamRef.current?.getVideoTracks?.()[0];
            if (t) t.enabled = !t.enabled;
          }}
          end={endCall}
        />
      </div>
    </div>
  );
};

export default CallBox;