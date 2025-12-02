
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_BASE_URL;
const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setChannels(res.data);
    } catch (err) {
      setError("Failed to fetch channels");
    }
  };

  const joinChannel = async (channelId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/api/channels/${channelId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChannels((prev) =>
        prev.map((ch) =>
          ch._id === channelId
            ? { ...ch, members: [...ch.members, { _id: userId }] }
            : ch
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join");
    }
  };

  const leaveChannel = async (channelId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API}/api/channels/${channelId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfirmLeave(null);

      setChannels((prev) =>
        prev.map((ch) =>
          ch._id === channelId
            ? { ...ch, members: ch.members.filter((m) => m._id !== userId) }
            : ch
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave");
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) {
      alert("Channel name cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
       `${API}/api/channels`,
        { name: newChannelName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChannels((prev) => [...prev, res.data.channel]);
      setNewChannelName("");
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create channel");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 py-10 px-5 flex justify-center">
      <div className="max-w-3xl w-full">
        {/* Title + Create Button */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-semibold text-gray-800">
            Available Channels
          </h2>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            + Create Channel
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Channel List */}
        <div className="space-y-4">
          {channels.map((channel) => {
            const isMember = channel.members.some((m) => m._id === userId);

            return (
              <div
                key={channel._id}
                onClick={() => navigate(`/channels/${channel._id}`)}
                className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-medium text-gray-900">
                      #{channel.name}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {channel.members.length} members
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isMember ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinChannel(channel._id);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Join
                      </button>
                    ) : (
                      <>
                        <button
                          disabled
                          className="px-4 py-2 bg-green-500 text-white rounded-lg opacity-80 cursor-not-allowed"
                        >
                          Joined
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmLeave(channel._id);
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Leave
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave Confirmation Modal */}
        {confirmLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Are you sure you want to leave this channel?
              </h3>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => leaveChannel(confirmLeave)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Leave
                </button>

                <button
                  onClick={() => setConfirmLeave(null)}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Channel Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white w-96 p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4">
                Create New Channel
              </h3>

              <input
                type="text"
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={createChannel}
                  className="px-4 py-2 bg-purple-600 text-white rounded"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channels;
