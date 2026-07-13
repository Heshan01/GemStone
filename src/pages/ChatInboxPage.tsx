import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  limit,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChatRoom, ChatMessage, UserProfile } from '../types';
import { MessageSquare, Send, Calendar, MapPin, User, ChevronLeft, ArrowLeft, Gem, Image } from 'lucide-react';

interface ChatInboxPageProps {
  navigate: (route: string, params?: any) => void;
  initialChatId?: string;
}

export default function ChatInboxPage({ navigate, initialChatId }: ChatInboxPageProps) {
  const { user, loading: authLoading } = useAuth();
  
  // Conversations sidebar
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  
  // Active Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  // Participant profile lookup for active conversation
  const [otherParticipant, setOtherParticipant] = useState<UserProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Fetch Chat Rooms list (real-time with onSnapshot)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('login');
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rooms: ChatRoom[] = [];
        snap.forEach((doc) => rooms.push(doc.data() as ChatRoom));
        // Sort client-side by lastMessageAt desc to avoid composite index requirement
        rooms.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        setChats(rooms);
        setLoading(false);

        // If a chatId was passed initially, find it and select it
        if (selectedChatId) {
          const matched = rooms.find((r) => r.id === selectedChatId);
          if (matched) setActiveChat(matched);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chats');
      }
    );

    return unsubscribe;
  }, [user, selectedChatId, authLoading]);

  // 2. Load active messages in real-time
  useEffect(() => {
    if (!selectedChatId || !user) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
    const msgQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      msgQuery,
      (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach((doc) => msgs.push(doc.data() as ChatMessage));
        setMessages(msgs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `chats/${selectedChatId}/messages`);
      }
    );

    return unsubscribe;
  }, [selectedChatId, user]);

  // 3. Keep activeChat synced with chats collection and clear unread statuses
  useEffect(() => {
    if (!selectedChatId || !user) {
      setActiveChat(null);
      return;
    }

    const currentRoom = chats.find((r) => r.id === selectedChatId);
    if (currentRoom) {
      setActiveChat(currentRoom);

      // Mark room messages as read if the current user has unread messages
      const isBuyer = user.uid === currentRoom.buyerId;
      const needsUpdate = isBuyer ? currentRoom.unreadBuyer : currentRoom.unreadSeller;
      if (needsUpdate) {
        const roomRef = doc(db, 'chats', selectedChatId);
        updateDoc(roomRef, isBuyer ? { unreadBuyer: false } : { unreadSeller: false }).catch((err) => {
          console.warn('Error clearing unread chat state:', err);
        });
      }
    }
  }, [selectedChatId, chats, user]);

  // 4. Load chat partner profile once per active chat selection
  useEffect(() => {
    if (!activeChat || !user) {
      setOtherParticipant(null);
      return;
    }

    const isBuyer = user.uid === activeChat.buyerId;
    const partnerId = isBuyer ? activeChat.sellerId : activeChat.buyerId;

    const loadPartnerProfile = async () => {
      try {
        const partnerDoc = await getDoc(doc(db, 'users', partnerId));
        if (partnerDoc.exists()) {
          setOtherParticipant(partnerDoc.data() as UserProfile);
        }
      } catch (err) {
        console.error('Error fetching chat partner profile:', err);
      }
    };

    loadPartnerProfile();
  }, [activeChat?.id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChatId || !newMessageText.trim()) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');

    const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
    const msgId = `msg_${user.uid}_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: msgId,
      senderId: user.uid,
      text: textToSend,
      imageUrl: '',
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Write the message to the messages sub-collection
      await setDoc(doc(db, 'chats', selectedChatId, 'messages', msgId), newMsg);

      // 2. Update the parent Chat room's last message, lastMessageAt, and unread flags
      const isBuyer = user.uid === activeChat?.buyerId;
      const roomRef = doc(db, 'chats', selectedChatId);
      await updateDoc(roomRef, {
        lastMessage: textToSend,
        lastMessageAt: new Date().toISOString(),
        unreadBuyer: isBuyer ? false : true,
        unreadSeller: isBuyer ? true : false
      });

    } catch (err) {
      console.error('Error sending message:', err);
      alert('Message delivery failed.');
    }
  };

  const handleShareImage = async () => {
    // Shared image within chat fallback
    const mockImageUrls = [
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop'
    ];
    const pickedUrl = mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];

    if (!user || !selectedChatId) return;

    const messagesRef = collection(db, 'chats', selectedChatId, 'messages');
    const msgId = `msg_${user.uid}_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: msgId,
      senderId: user.uid,
      text: 'Sent a gemstone photo.',
      imageUrl: pickedUrl,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'chats', selectedChatId, 'messages', msgId), newMsg);
      const isBuyer = user.uid === activeChat?.buyerId;
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: 'Shared a gemstone photo.',
        lastMessageAt: new Date().toISOString(),
        unreadBuyer: isBuyer ? false : true,
        unreadSeller: isBuyer ? true : false
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      <div className="h-[75vh] flex rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-xl bg-white dark:bg-zinc-900">
        
        {/* Left Sidebar: Conversations list */}
        <div className={`w-full md:w-80 shrink-0 border-r border-gray-100 dark:border-zinc-800 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
            <h2 className="font-sans font-black text-lg text-zinc-950 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Direct Inbox
            </h2>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-850/30">
            {loading ? (
              <div className="p-4 space-y-4 animate-pulse">
                <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded"></div>
                <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded"></div>
                <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded"></div>
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                Your inbox is empty. Browse listings to contact a gem seller.
              </div>
            ) : (
              chats.map((room) => {
                const isBuyer = user?.uid === room.buyerId;
                const unread = isBuyer ? room.unreadBuyer : room.unreadSeller;
                
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedChatId(room.id)}
                    className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors flex gap-3 relative ${room.id === selectedChatId ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''}`}
                  >
                    {unread && (
                      <span className="absolute top-4 left-3 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-950 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800">
                      <img src={room.adImage} alt="Gem preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden space-y-0.5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {room.adTitle}
                      </p>
                      <p className="text-xs font-black text-zinc-900 dark:text-white">
                        {isBuyer ? 'Seller Connection' : 'Prospective Buyer'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-4">
                        {room.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Conversation messages */}
        <div className={`flex-grow flex flex-col bg-zinc-50/20 dark:bg-zinc-900/10 ${!selectedChatId ? 'hidden md:flex justify-center items-center p-8' : 'flex'}`}>
          {selectedChatId && activeChat ? (
            <>
              {/* Active Conversation Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedChatId(null)}
                    className="md:hidden p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black dark:hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-850">
                    <img src={activeChat.adImage} alt="Ad thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3
                      onClick={() => navigate('ad-details', { adId: activeChat.adId })}
                      className="text-xs font-bold uppercase text-blue-500 hover:underline cursor-pointer"
                    >
                      {activeChat.adTitle} · {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(activeChat.adPrice)}
                    </h3>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">
                      {otherParticipant?.name || 'Gem Merchant'}
                    </p>
                  </div>
                </div>

                {otherParticipant?.phone && (
                  <a
                    href={`tel:${otherParticipant.phone}`}
                    className="py-1.5 px-3 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-semibold rounded-xl"
                  >
                    Call Partner
                  </a>
                )}
              </div>

              {/* Chat Messages Scrolling Pane */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-gray-100 dark:border-zinc-700 rounded-tl-none'}`}>
                        {msg.imageUrl && (
                          <div className="mb-2 max-w-[240px] rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-zinc-100 dark:bg-zinc-900">
                            <img src={msg.imageUrl} alt="Shared gem" className="w-full h-auto object-cover" />
                          </div>
                        )}
                        <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                        <span className={`block text-[9px] text-right mt-1.5 font-medium ${isMine ? 'text-zinc-900/60' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareImage}
                  className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-gray-400 hover:text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none shrink-0"
                  title="Share Gemstone Photo"
                >
                  <Image className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type your negotiation message here..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-grow text-sm bg-zinc-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim()}
                  className="p-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-xl text-white focus:outline-none shrink-0 transition-colors shadow shadow-blue-500/10 disabled:opacity-50 disabled:hover:bg-blue-500"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto" />
              <h3 className="text-lg font-bold">Select a conversation</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Negotiate carat weight, certifications, or trading locations securely using direct in-app chat rooms.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
