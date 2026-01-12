const CallGrup = ({ onAccept, onReject, type }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg text-center">
        <h2 className="mb-4 font-semibold">{type === 'audio' ? '📞 Incoming Audio Call' : '📹 Incoming Video Call'}</h2>
        <div className="flex gap-4 justify-center">
          <button onClick={onAccept} className="bg-green-500 px-4 py-2 text-white rounded">
            Accept
          </button>
          <button onClick={onReject} className="bg-red-500 px-4 py-2 text-white rounded">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallGrup;