import { useEffect, useRef } from "react";
import ActionBar from "./ActionBar";

const CallBox = ({ socket, user, offer, close, isReceiver, type }) => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const pc = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.current.ontrack = (e) => {
      remoteVideo.current.srcObject = e.streams[0];
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
      try {
        streamRef.current?.getTracks()?.forEach((t) => t.stop());
      } catch (err) {}
      try {
        pc.current?.close();
      } catch (err) {}
    };
  }, []);

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
    <div className="fixed inset-0 bg-black z-50">
      <video ref={remoteVideo} autoPlay className="w-full h-full" />
      <video
        ref={localVideo}
        autoPlay
        muted
        className="w-40 absolute top-4 right-4 rounded"
      />

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

      {!isReceiver && (
        <button
          onClick={startCall}
          className="absolute top-4 left-4 bg-green-500 px-4 py-2 rounded text-white"
        >
          📞 Start Call
        </button>
      )}
    </div>
  );
};

export default CallBox;