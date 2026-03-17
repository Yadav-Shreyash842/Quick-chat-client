import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";

const formatDur = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

// One remote peer video/audio tile
const PeerTile = ({ stream, name, pic }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream; }, [stream]);
  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center aspect-video">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {pic
            ? <img src={pic} className="w-16 h-16 rounded-full object-cover border-2 border-white/20" alt="" />
            : <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold">{name?.charAt(0)?.toUpperCase()}</div>
          }
        </div>
      )}
      <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">{name}</span>
    </div>
  );
};

const GroupCallBox = ({ group, type, callId: existingCallId, isReceiver, close }) => {
  const { socket, authUser, axios } = useContext(AuthContext);
  const { addCallRecord } = useContext(ChatContext);

  const localVideoRef = useRef(null);
  const localStream = useRef(null);
  const peerConnections = useRef({});

  const [remoteStreams, setRemoteStreams] = useState({});
  const [callId, setCallId] = useState(existingCallId || null);
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const timerRef = useRef(null);
  const durationRef = useRef(0); // track duration without stale closure
  const connectedRef = useRef(false);

  // fix: proper member ID extraction
  const getId = (m) => (typeof m === 'object' ? m._id?.toString() : m?.toString());
  const memberList = group.members.filter(m => typeof m === 'object');
  const otherMembers = memberList.filter(m => getId(m) !== authUser._id?.toString());

  // ── TIMER ──
  useEffect(() => {
    if (connected) {
      connectedRef.current = true;
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [connected]);

  // ── CREATE PEER CONNECTION ──
  const createPC = (memberId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    pc.onicecandidate = (e) => {
      if (e.candidate)
        socket.emit('group-ice-candidate', { to: memberId, candidate: e.candidate, from: authUser._id });
    };

    pc.ontrack = (e) => {
      setRemoteStreams(prev => ({ ...prev, [memberId]: e.streams[0] }));
      setConnected(true);
    };

    if (localStream.current)
      localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current));

    peerConnections.current[memberId] = pc;
    return pc;
  };

  // ── END CALL (defined before socket listeners) ──
  const endCall = async (fromRemote = false) => {
    clearInterval(timerRef.current);
    const finalDuration = durationRef.current;

    if (!fromRemote)
      socket.emit('group-call-ended', { groupId: group._id, callId });

    if (callId)
      await axios.put(`/api/groups/call/end/${callId}`, { duration: finalDuration }).catch(() => {});

    addCallRecord({
      isGroup: true,
      groupId: group._id,
      groupName: group.name,
      type,
      direction: isReceiver ? 'incoming' : 'outgoing',
      duration: connectedRef.current ? finalDuration : null,
      time: new Date().toISOString(),
    });

    localStream.current?.getTracks().forEach(t => t.stop());
    Object.values(peerConnections.current).forEach(pc => { try { pc.close(); } catch {} });
    close();
  };

  // ── INIT ──
  useEffect(() => {
    const init = async () => {
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true,
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;

        if (!isReceiver) {
          const { data } = await axios.post(`/api/groups/call/start/${group._id}`, { type });
          if (data.success) setCallId(data.callId);

          for (const member of otherMembers) {
            const memberId = getId(member);
            const pc = createPC(memberId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('group-call-offer', { to: memberId, offer, type, callId: data.callId, from: authUser._id });
          }
        }
      } catch (err) {
        console.error('GroupCall init error:', err);
      }
    };
    init();

    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      Object.values(peerConnections.current).forEach(pc => { try { pc.close(); } catch {} });
    };
  }, []);

  // ── SOCKET LISTENERS ──
  useEffect(() => {
    const handleOffer = async ({ from, offer, callId: cId }) => {
      if (cId) setCallId(cId);
      const pc = createPC(from);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('group-call-answer', { to: from, answer, from: authUser._id });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(answer);
    };

    const handleIce = ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc) pc.addIceCandidate(candidate).catch(() => {});
    };

    socket.on('group-call-offer', handleOffer);
    socket.on('group-call-answer', handleAnswer);
    socket.on('group-ice-candidate', handleIce);
    socket.on('group-call-ended', () => endCall(true));

    return () => {
      socket.off('group-call-offer', handleOffer);
      socket.off('group-call-answer', handleAnswer);
      socket.off('group-ice-candidate', handleIce);
      socket.off('group-call-ended');
    };
  }, [callId]);

  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(m => !m); }
  };

  const toggleCam = () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOff(c => !c); }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-50 flex flex-col">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-lg">
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{group.name}</p>
            <p className="text-white/60 text-xs">{type === "video" ? "📹 Video Call" : "📞 Audio Call"} · {group.members.length} members</p>
          </div>
        </div>
        <div className="text-white text-xl font-mono">
          {connected ? formatDur(duration) : <span className="text-sm text-white/60 animate-pulse">Connecting...</span>}
        </div>
      </div>

      {/* ── VIDEO GRID ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {type === "video" ? (
          <div className={`grid gap-3 h-full ${
            Object.keys(remoteStreams).length === 0 ? 'grid-cols-1' :
            Object.keys(remoteStreams).length === 1 ? 'grid-cols-2' :
            Object.keys(remoteStreams).length <= 3 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {/* Local tile */}
            <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">You</span>
              {camOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  {authUser.profilePic
                    ? <img src={authUser.profilePic} className="w-16 h-16 rounded-full object-cover" alt="" />
                    : <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold">{authUser.fullName?.charAt(0)}</div>
                  }
                </div>
              )}
            </div>
            {/* Remote tiles */}
            {memberList.filter(m => getId(m) !== authUser._id?.toString()).map(member => (
              <PeerTile
                key={getId(member)}
                stream={remoteStreams[getId(member)] || null}
                name={member.fullName}
                pic={member.profilePic}
              />
            ))}
          </div>
        ) : (
          /* Audio call — avatar grid */
          <div className={`grid gap-6 place-items-center h-full ${
            memberList.length <= 2 ? 'grid-cols-2' :
            memberList.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {/* Self */}
            <div className="flex flex-col items-center gap-2">
              <div className={`relative w-24 h-24 rounded-full border-4 ${connected ? 'border-green-400' : 'border-white/20'}`}>
                {authUser.profilePic
                  ? <img src={authUser.profilePic} className="w-full h-full rounded-full object-cover" alt="" />
                  : <div className="w-full h-full rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold text-white">{authUser.fullName?.charAt(0)}</div>
                }
                {connected && <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-50" />}
              </div>
              <span className="text-white/80 text-sm">You</span>
            </div>
            {/* Others */}
            {memberList.filter(m => getId(m) !== authUser._id?.toString()).map(member => (
              <div key={getId(member)} className="flex flex-col items-center gap-2">
                <div className={`relative w-24 h-24 rounded-full border-4 ${remoteStreams[getId(member)] ? 'border-blue-400' : 'border-white/20'}`}>
                  {member.profilePic
                    ? <img src={member.profilePic} className="w-full h-full rounded-full object-cover" alt="" />
                    : <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">{member.fullName?.charAt(0)}</div>
                  }
                  {remoteStreams[getId(member)] && <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50" />}
                </div>
                <span className="text-white/80 text-sm">{member.fullName}</span>
                <audio autoPlay ref={el => { if (el && remoteStreams[getId(member)]) el.srcObject = remoteStreams[getId(member)]; }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTROLS ── */}
      <div className="flex items-center justify-center gap-5 py-6 bg-black/40">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${muted ? 'bg-red-500/80' : 'bg-white/20 hover:bg-white/30'}`}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🎤"}
        </button>

        {type === "video" && (
          <button
            onClick={toggleCam}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition ${camOff ? 'bg-red-500/80' : 'bg-white/20 hover:bg-white/30'}`}
            title={camOff ? "Turn on camera" : "Turn off camera"}
          >
            {camOff ? "📷" : "📹"}
          </button>
        )}

        <button
          onClick={() => endCall(false)}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-2xl transition shadow-lg"
          title="End Call"
        >
          📵
        </button>
      </div>
    </div>
  );
};

export default GroupCallBox;
