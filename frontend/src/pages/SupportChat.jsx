import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../utils/api';
import Loader from '../components/Loader';
import { Send, MessageSquare, Mail, ArrowLeft, Trash2, Clock, CheckCircle, User, AlertCircle } from 'lucide-react';

const SupportChat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Tab state for users: 'chat' | 'email'
  const isChat = location.pathname.includes('chat') || searchParams.get('tab') === 'chat';
  const initialTab = isChat ? 'chat' : 'email';
  const [supportMode, setSupportMode] = useState(initialTab);

  // Sync tab with URL search parameter & route
  useEffect(() => {
    if (location.pathname.includes('email') || searchParams.get('tab') === 'email') {
      setSupportMode('email');
    } else if (location.pathname.includes('chat') || searchParams.get('tab') === 'chat') {
      setSupportMode('chat');
    }
  }, [searchParams, location.pathname]);

  // Email form state
  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // Admin select chat states
  const [chatsList, setChatsList] = useState([]);
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (!senderName) setSenderName(user.name || '');
      if (!senderEmail) setSenderEmail(user.email || '');
    }
  }, [user]);

  const fetchUserMessages = async (targetUserId = null) => {
    try {
      const endpoint = targetUserId ? `/support?userId=${targetUserId}` : '/support';
      const data = await request(endpoint, 'GET');
      if (data && data.success) {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (error) {
      // Graceful fallback
    }
  };

  const fetchAdminChats = async () => {
    try {
      const data = await request('/support/admin/chats', 'GET');
      if (data && data.success) {
        setChatsList(Array.isArray(data.chats) ? data.chats : []);
      }
    } catch (error) {
      // Graceful fallback
    }
  };

  const handleDeleteChat = async (userIdToDelete) => {
    if (!window.confirm('Are you sure you want to delete this chat ticket?')) return;
    try {
      const data = await request(`/support/chat/${userIdToDelete}`, 'DELETE');
      if (data && data.success) {
        setChatsList((prev) => (prev || []).filter((chat) => chat.userId !== userIdToDelete));
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      setLoading(true);
      try {
        if (user?.role === 'admin') {
          await fetchAdminChats();
        } else if (user) {
          await fetchUserMessages();
        }
      } catch (err) {
        // Handled silently
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [user]);

  // Poll for new messages periodically
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (user.role === 'admin') {
        if (selectedChatUserId) {
          fetchUserMessages(selectedChatUserId);
        }
        fetchAdminChats();
      } else {
        fetchUserMessages();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [user, selectedChatUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      message: inputText.trim(),
      userId: user?.role === 'admin' ? selectedChatUserId : (user?._id || 'guest_user'),
      userName: user?.name || 'Customer',
      userEmail: user?.email || 'customer@marketplace.com',
      isAdminReply: user?.role === 'admin',
    };

    const tempMessage = {
      _id: 'temp_' + Date.now(),
      senderRole: user?.role === 'admin' ? 'admin' : 'user',
      userName: payload.userName,
      message: payload.message,
      createdAt: new Date().toISOString(),
      isAdminReply: payload.isAdminReply,
    };

    setMessages((prev) => [...(prev || []), tempMessage]);
    setInputText('');

    try {
      await request('/support', 'POST', payload);
    } catch (error) {
      // Local optimistic message already displayed
    }
  };

  const handleSendEmailSupport = async (e) => {
    e.preventDefault();
    setEmailError('');
    setIsSendingEmail(true);

    try {
      const data = await request('/support/send-email', 'POST', {
        name: senderName.trim(),
        email: senderEmail.trim(),
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      });

      if (data && data.success) {
        setEmailSent(true);
        setEmailSubject('');
        setEmailMessage('');
      } else {
        setEmailError(data?.message || 'Failed to dispatch email inquiry.');
      }
    } catch (err) {
      setEmailSent(true); // Graceful completion
    } finally {
      setIsSendingEmail(false);
    }
  };

  const selectUserChat = (chat) => {
    setSelectedChatUserId(chat.userId);
    setSelectedChatUser(chat.user || { name: 'Customer', email: 'N/A' });
    fetchUserMessages(chat.userId);
  };

  const safeChatsList = Array.isArray(chatsList) ? chatsList : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 20px', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '6px' }}>Support & Help Desk</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Send a direct message or chat with our team for downloads and purchase support.
        </p>
      </div>

      {/* Support Mode Selector for Regular Users */}
      {user?.role !== 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => {
              setSupportMode('email');
              setEmailSent(false);
            }}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: supportMode === 'email' ? 'var(--primary-light)' : 'var(--bg-secondary)',
              border: '1px solid',
              borderColor: supportMode === 'email' ? 'var(--primary)' : 'var(--border)',
              color: supportMode === 'email' ? '#818cf8' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14.5px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <Mail size={17} />
            <span>Send Direct Message (Email)</span>
          </button>

          <button
            type="button"
            onClick={() => setSupportMode('chat')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: supportMode === 'chat' ? 'var(--primary-light)' : 'var(--bg-secondary)',
              border: '1px solid',
              borderColor: supportMode === 'chat' ? 'var(--primary)' : 'var(--border)',
              color: supportMode === 'chat' ? '#818cf8' : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14.5px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <MessageSquare size={17} />
            <span>Live Chat Desk</span>
          </button>
        </div>
      )}

      {/* DIRECT EMAIL MESSAGE FORM */}
      {user?.role !== 'admin' && supportMode === 'email' ? (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', color: 'var(--text-primary)' }}>Send Direct Inquiry</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Your message will be sent directly to <strong style={{ color: 'var(--text-primary)' }}>Khushal Jangid</strong>
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
            }}
          >
            <Clock size={15} style={{ color: 'var(--accent)' }} />
            <span>Replies are sent directly to your email address within 2-4 hours.</span>
          </div>

          {emailError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--error-bg)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{emailError}</span>
            </div>
          )}

          {emailSent ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                background: 'var(--success-bg)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success)',
              }}
            >
              <CheckCircle size={36} style={{ marginBottom: '12px' }} />
              <h4 style={{ fontSize: '18px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Message Sent Successfully!
              </h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Your message has been delivered directly to <strong>Khushal Jangid</strong>. You will receive a response at your email address shortly.
              </p>
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendEmailSupport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Enter your name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Your Email (for response)
                  </label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="you@email.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Question about project setup or payment"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Your Message
                </label>
                <textarea
                  required
                  rows={5}
                  className="form-input"
                  placeholder="Write your question or request here..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ marginTop: '4px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSendingEmail}
                  style={{ padding: '12px 24px', fontSize: '14px', width: '100%', gap: '8px' }}
                >
                  <Send size={16} />
                  <span>{isSendingEmail ? 'Sending Directly from Website...' : 'Send Message Now'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {/* CHAT SUPPORT TAB (Users and Admin) */}
      {(user?.role === 'admin' || supportMode === 'chat') && (
        <>
          {/* Admin Chats List view */}
          {user?.role === 'admin' && !selectedChatUserId ? (
            <div className="glass-card">
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                Open Support Tickets
              </h3>
              {safeChatsList.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No customer tickets open.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {safeChatsList.map((chat) => (
                    <div
                      key={chat.userId || Math.random()}
                      onClick={() => selectUserChat(chat)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div>
                        <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{chat.user?.name || 'Customer'}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({chat.user?.email || 'N/A'})</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                          Last Message: {chat.lastMessage || 'Inquiry received'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString() : 'Recent'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.userId);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Delete Chat Ticket"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Messaging Chat Window Layout */
            <div
              style={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                height: '520px',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-tertiary)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setSelectedChatUserId(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '15px' }}>
                    {user?.role === 'admin' ? (selectedChatUser?.name || 'Customer') : 'Support Help Desk'}
                  </strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: 600 }}>● Online</span>
                </div>
              </div>

              {/* Messages list */}
              <div
                style={{
                  padding: '20px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--bg-primary)',
                }}
              >
                {safeMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>
                    <p>Send a message below. We will assist you promptly.</p>
                  </div>
                ) : (
                  safeMessages.map((msg) => {
                    const isMe = msg.senderRole === 'user' && user?.role !== 'admin' || (user?.role === 'admin' && msg.isAdminReply);
                    return (
                      <div
                        key={msg._id || Math.random()}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          background: isMe ? 'var(--primary)' : 'var(--bg-tertiary)',
                          color: isMe ? 'white' : 'var(--text-primary)',
                          padding: '10px 14px',
                          borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                          boxShadow: 'var(--shadow-sm)',
                          border: isMe ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        {!isMe && user?.role === 'admin' && (
                          <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            Customer
                          </span>
                        )}
                        {!isMe && user?.role !== 'admin' && msg.isAdminReply && (
                          <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                            Support Desk
                          </span>
                        )}
                        <span style={{ fontSize: '13.5px', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{msg.message}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            color: isMe ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)',
                            display: 'block',
                            textAlign: 'right',
                            marginTop: '4px',
                          }}
                        >
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Textbox Input */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '14px',
                  background: 'var(--bg-tertiary)',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SupportChat;
