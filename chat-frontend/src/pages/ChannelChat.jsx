import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_BASE_URL;
const socket = io(API, { transports: ["websocket"] });
const ChannelChat = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("name");
  const bottomRef = useRef(null);
  const [lastSeen, setLastSeen] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [matchIndexes, setMatchIndexes] = useState([]);
  const [activeMatch, setActiveMatch] = useState(0);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // LOAD MESSAGES
  const loadMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/messages/${id}?page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(res.data.messages);

      //  mark messages as seen when user opens this channel
      socket.emit("messagesSeen", { channelId: id, userId });
    } catch (err) {
      console.error(err);
    }
  };

  // LOAD CHANNEL INFO
  const loadChannel = async () => {
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

  useEffect(() => {
    socket.emit("joinChannel", id);
    socket.emit("userOnline", { userId, name: userName });

    loadMessages();
    loadChannel();
  }, [id]);


  // SOCKET JOIN + LISTENERS
  useEffect(() => {
    console.log(" CLIENT: Joining channel:", id);
    // socket.emit("joinChannel", id);

    console.log(" CLIENT: Sending userOnline:", userId, userName);

    socket.on("newMessage", (msg) => {
      const incomingChannel = msg.channelId?._id || msg.channelId;

      if (String(incomingChannel) !== String(id)) return;

      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          delivered: msg.delivered ?? false,
          seen: msg.seen ?? false,
        },
      ]);

      // Automatically mark seen if message is NOT mine
      if (String(msg.senderId?._id || msg.senderId) !== String(userId)) {
        socket.emit("messagesSeen", { channelId: id, userId });
      }
    });

    // Typing
    socket.on("showTyping", ({ userName: typingName }) => {
      console.log(" CLIENT RECEIVED showTyping from:", typingName);
      if (typingName !== localStorage.getItem("name")) {
        setTypingUser(typingName);
      }
    });

    socket.on("hideTyping", () => {
      console.log(" CLIENT RECEIVED hideTyping");
      setTypingUser("");
    });

    //  UPDATED MESSAGE
    socket.on("messageUpdated", (updatedMsg) => {
      console.log(" CLIENT RECEIVED messageUpdated:", updatedMsg);

      if (String(updatedMsg.channelId) !== String(id)) return;

      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
      );
    });

    //  DELETED MESSAGE
    socket.on("messageDeleted", (deletedMsg) => {
      console.log(" CLIENT RECEIVED messageDeleted:", deletedMsg);

      if (String(deletedMsg.channelId) !== String(id)) return;

      setMessages((prev) =>
        prev.map((m) => (m._id === deletedMsg._id ? deletedMsg : m))
      );
    });

    // STATUS UPDATES (DELIVERED / SEEN)
    socket.on("messagesDelivered", (updated) => {
      console.log(" CLIENT RECEIVED messagesDelivered");

      setMessages((prev) =>
        prev.map((msg) => {
          const updatedMsg = updated.find((u) => u._id === msg._id);
          return updatedMsg ? { ...msg, delivered: updatedMsg.delivered } : msg;
        })
      );
    });


    socket.on("messagesSeenUpdate", (updated) => {
      console.log(" CLIENT RECEIVED messagesSeenUpdate");

      setMessages((prev) =>
        prev.map((msg) => {
          const updatedMsg = updated.find((u) => u._id === msg._id);
          return updatedMsg ? { ...msg, seen: updatedMsg.seen } : msg;
        })
      );
    });
    socket.on("lastSeenUpdate", ({ userId, lastSeen }) => {
      setLastSeen((prev) => ({
        ...prev,
        [userId]: lastSeen,
      }));
    });

    return () => {
      console.log("🚪 CLIENT: Leaving channel:", id);
      socket.emit("leaveChannel", id);

      socket.off("newMessage");
      socket.off("showTyping");
      socket.off("hideTyping");
      socket.off("messageUpdated");
      socket.off("messageDeleted");
      socket.off("messagesDelivered");
      socket.off("messagesSeenUpdate");
    };
  }, [id, userId]);

  // ONLINE USERS
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      console.log(" CLIENT RECEIVED onlineUsers:", users);

      const myId = localStorage.getItem("userId");

      const filtered = Object.values(users)
        .filter((u) => u.userId !== myId)
        .map((u) => u.name);

      const unique = [...new Set(filtered)];

      setOnlineUsers(unique);
    });

    return () => socket.off("onlineUsers");
  }, []);


  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    socket.emit("stopTyping", { channelId: id });

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/api/messages/${id}`,
        { text: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(" CLIENT SENT MESSAGE:", res.data.data);

      setNewMessage("");
      setTypingUser("");
    } catch (err) {
      console.error(err);
    }
  };

  const isMyMessage = (msg) => {
    if (!msg.senderId) return false;
    if (typeof msg.senderId === "object") return msg.senderId._id === userId;
    return msg.senderId === userId;
  };

  //  10-MINUTE LIMIT FOR EDIT / DELETE
  const canModifyMessage = (msg) => {
    const messageTime = new Date(msg.createdAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - messageTime) / (1000 * 60);
    return diffMinutes <= 10;
  };

  //  START EDIT
  const startEdit = (msg) => {
    if (!isMyMessage(msg) || msg.isDeleted) return;
    setEditingMessageId(msg._id);
    setEditingText(msg.text);
  };

  //  SAVE EDIT
  const saveEdit = async () => {
    if (!editingText.trim()) return;
    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        `${API}/api/messages/edit/${editingMessageId}`,
        { text: editingText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data.data;
      setMessages((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m))
      );

      setEditingMessageId(null);
      setEditingText("");
    } catch (err) {
      console.error("Edit message error:", err);
    }
  };
  useEffect(() => {
    if (!searchTerm) return;

    const firstMatch = document.querySelector(".msg-match");
    firstMatch?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchTerm]);

  //  CANCEL EDIT
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  //  DELETE MESSAGE
  const handleDelete = async (msg) => {
    if (!isMyMessage(msg) || msg.isDeleted) return;

    try {
      const token = localStorage.getItem("token");

      const res = await axios.delete(
        `${API}/api/messages/delete/${msg._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const deleted = res.data.data;

      setMessages((prev) =>
        prev.map((m) => (m._id === deleted._id ? deleted : m))
      );
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };
  const highlight = (text, index) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");

    const isActive = matchIndexes[activeMatch] === index;

    return text.replace(
      regex,
      isActive
        ? `<mark style="background: orange; padding:2px;">$1</mark>`
        : `<mark style="background: yellow; padding:2px;">$1</mark>`
    );
  };

  const scrollToMatch = (index) => {
    const el = document.querySelector(`#msg-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // UI
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="px-3 py-1 bg-purple-100 text-sm">
        Online: {onlineUsers.length ? onlineUsers.join(", ") : "No one else online"}
      </div>

      <div className="p-4 bg-white shadow">
        <h1 className="text-xl font-semibold">#{channel?.name || "Loading..."}</h1>
      </div>
      <div className="p-2 bg-white shadow-sm flex items-center gap-2 border-b">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            const text = e.target.value;
            setSearchTerm(text);

            if (!text) {
              setMatchIndexes([]);
              setActiveMatch(0);
              return;
            }

            const indexes = [];

            messages.forEach((msg, i) => {
              if (msg.text?.toLowerCase().includes(text.toLowerCase())) {
                indexes.push(i);
              }
            });

            setMatchIndexes(indexes);
            const lastIndex = indexes.length - 1;
            setActiveMatch(lastIndex);

            setTimeout(() => {
              scrollToMatch(indexes[lastIndex]);
            }, 100);
          }}

          placeholder="Search messages..."
          className="w-full border px-3 py-2 rounded-md"
        />
        {searchTerm && matchIndexes.length > 0 && (
          <div className="flex gap-1">
            <button
              className="px-2 py-1 bg-gray-200 rounded"
              onClick={() => {
                const newIndex =
                  (activeMatch - 1 + matchIndexes.length) % matchIndexes.length;
                setActiveMatch(newIndex);
                scrollToMatch(matchIndexes[newIndex]);
              }}
            >
              ⬆️
            </button>

            <button
              className="px-2 py-1 bg-gray-200 rounded"
              onClick={() => {
                const newIndex = (activeMatch + 1) % matchIndexes.length;
                setActiveMatch(newIndex);
                scrollToMatch(matchIndexes[newIndex]);
              }}
            >
              ⬇️
            </button>

          </div>
        )}
      </div>

      {typingUser && (
        <div className="px-4 py-1 text-sm italic text-gray-500">
          {typingUser} is typing...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {


          const mine = isMyMessage(msg);
          const isEditing = editingMessageId === msg._id;

          return (
            <div
              key={msg._id}
              id={`msg-${i}`}
              className={`flex ${mine ? "justify-end" : "justify-start"} ${msg.text.toLowerCase().includes(searchTerm.toLowerCase())
                ? "msg-match"
                : ""
                }`}
            >

              <div
                className={`max-w-xs p-3 rounded-xl shadow ${mine ? "bg-purple-600 text-white" : "bg-white border"
                  }`}
              >
                <p
                  className={`font-semibold text-sm ${mine ? "text-yellow-200" : "text-blue-600"
                    }`}
                >
                  {mine ? "You" : msg.senderId?.name}
                </p>

                {/* MESSAGE CONTENT AREA */}
                {msg.isDeleted ? (
                  <p
                    className={`italic text-sm mt-1 ${mine ? "text-purple-200" : "text-gray-500"
                      }`}
                  >
                    This message was deleted
                  </p>
                ) : isEditing ? (
                  <div className="mt-1 space-y-2">
                    <textarea
                      className={`w-full text-sm rounded px-2 py-1 border ${mine ? "text-black" : "text-gray-900"
                        }`}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-2 py-1 text-xs rounded bg-gray-300 text-black"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded bg-green-500 text-white"
                        onClick={saveEdit}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    <p dangerouslySetInnerHTML={{ __html: highlight(msg.text, i) }} />

                  </div>
                )}

                {/* TIME + ACTIONS */}
                <div className="mt-1 flex items-center justify-between gap-2">
                  {/* TIME + TICKS + EDITED */}
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs ${mine ? "text-purple-200" : "text-gray-500"
                        }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {/* TICK ICONS (ONLY FOR MY MESSAGES) */}
                    {mine && (
                      <span className="text-xs ml-1">
                        {!msg.delivered && !msg.seen && "✓" /* sent */}
                        {msg.delivered && !msg.seen && "✓✓" /* delivered */}
                        {msg.seen && (
                          <span className="text-blue-400 font-bold">
                            ✓✓
                          </span>
                        )}
                      </span>
                    )}

                    {/* WHATSAPP-STYLE EDITED LABEL */}
                    {msg.isEdited && !msg.isDeleted && (
                      <span
                        className={`text-[10px] italic ${mine ? "text-purple-200" : "text-gray-500"
                          }`}
                      >
                        edited
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  {mine && !msg.isDeleted && !isEditing && canModifyMessage(msg) && (
                    <div className="flex gap-2">
                      <button
                        className="text-xs underline opacity-80"
                        onClick={() => startEdit(msg)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs underline opacity-80"
                        onClick={() => handleDelete(msg)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white flex gap-3 shadow">
        <input
          type="text"
          value={newMessage}
          placeholder="Type your message..."
          className="flex-1 border rounded px-3 py-2"
          onChange={(e) => {
            setNewMessage(e.target.value);

            console.log(" CLIENT: typing emitted:", userName, "channel:", id);
            socket.emit("typing", { channelId: id, userName });
            if (e.target.value.trim() === "") {
              socket.emit("stopTyping", { channelId: id });
            } else {
              socket.emit("typing", { channelId: id, userName });
            }

          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChannelChat;

