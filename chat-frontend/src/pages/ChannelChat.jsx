import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

// ADD THIS LINE
const API = import.meta.env.VITE_API_BASE_URL;

// Replace old socket with this
const socket = io(API, {
  transports: ["websocket"],
});

const ChannelChat = () => {
  const { id } = useParams(); // channel ID
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOld, setLoadingOld] = useState(false);

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("name");
  const userEmail = localStorage.getItem("email");

  const bottomRef = useRef(null);

  // Auto-scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages (pagination handler)
  const loadMessages = async (pageNumber) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API}/api/messages/${id}?page=${pageNumber}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (pageNumber === 1) {
        setMessages(res.data.messages); // Fresh load
      } else {
        setMessages((prev) => [...res.data.messages, ...prev]); // Older msgs prepend
      }

      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Pagination load error:", err);
    }
  };

  // Initial load on channel change
  useEffect(() => {
    loadMessages(1); // Load page 1
    setPage(1);
  }, [id]);

  // Load older messages
  const loadOlder = async () => {
    setLoadingOld(true);
    const nextPage = page + 1;

    await loadMessages(nextPage);
    setPage(nextPage);

    setLoadingOld(false);
  };

  // Load channel info
  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API}/api/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const current = res.data.find((c) => c._id === id);
        setChannel(current);
      } catch (err) {
        console.error("Channel load error:", err);
      }
    };

    fetchChannel();
  }, [id]);

  // Join channel & listen for realtime new messages
  useEffect(() => {
    socket.emit("joinChannel", id);

    socket.on("newMessage", (msg) => {
      if (msg.channelId === id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.emit("leaveChannel", id);
      socket.off("newMessage");
    };
  }, [id]);

  // Online users tracking
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      const myId = localStorage.getItem("userId");

      const filtered = Object.values(users)
        .filter((u) => u.userId !== myId)
        .map((u) => u.name);

      setOnlineUsers(filtered);
    });

    return () => {
      socket.off("onlineUsers");
    };
  }, []);

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/messages/${id}`,
        { text: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add instantly on sender UI
      setMessages((prev) => [...prev, res.data.data]);
      
      setNewMessage("");
      
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // Check if message belongs to me
  const isMyMessage = (msg) => {
    if (!msg.senderId) return false;

    if (typeof msg.senderId === "object") {
      return msg.senderId._id === userId;
    }

    return msg.senderId === userId;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Online users */}
      <div style={{ padding: "6px 12px", background: "#eef", fontSize: "14px" }}>
        Online: {onlineUsers.length ? onlineUsers.join(", ") : "No one else online"}
      </div>

      {/* Header */}
      <div className="p-4 bg-white shadow">
        <h1 className="text-xl font-semibold">#{channel?.name || "Loading..."}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {hasMore && (
          <button
            onClick={loadOlder}
            className="px-3 py-1 bg-gray-300 rounded text-sm"
            disabled={loadingOld}
          >
            {loadingOld ? "Loading..." : "Load Older Messages"}
          </button>
        )}

        {messages.map((msg) => {
          const mine = isMyMessage(msg);

          return (
            <div
              key={msg._id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs p-3 rounded-xl shadow ${
                  mine
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-900 border"
                }`}
              >
                <p
                  className={`font-semibold text-sm ${
                    mine ? "text-yellow-200" : "text-blue-600"
                  }`}
                >
                  {mine ? "You" : msg.senderId?.name}
                </p>

                <p>{msg.text}</p>

                <p
                  className={`text-xs mt-1 ${
                    mine ? "text-purple-200" : "text-gray-500"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* Input box */}
      <div className="p-4 bg-white shadow flex gap-3">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>

    </div>
  );
};

export default ChannelChat;
