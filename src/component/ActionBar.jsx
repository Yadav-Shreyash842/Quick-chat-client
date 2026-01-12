const ActionBar = ({ toggleMic, toggleCam, end }) => {
  return (
    <div className="absolute bottom-6 flex gap-6 bg-black/60 px-6 py-3 rounded-full">
      <button onClick={toggleMic}>🎤</button>
      <button onClick={toggleCam}>📷</button>
      <button onClick={end} className="text-red-500">❌</button>
    </div>
  );
};

export default ActionBar;