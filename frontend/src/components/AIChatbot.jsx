import React, { useState, useRef, useEffect } from 'react';
import { request } from '../utils/api';
import { MessageSquare, X, Send, Bot, User, CornerDownLeft } from 'lucide-react';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! 👋 I am ApexAdvisor, your AI project assistant. Ask me anything about our project source codes, frameworks, or tech stack recommendations!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessageText = inputValue.trim();
    setInputValue('');

    const userMsg = {
      sender: 'user',
      text: userMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Format history for the backend system prompt context
      const chatHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const data = await request('/support/ai-chat', 'POST', {
        message: userMessageText,
        history: chatHistory,
      });

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error(data.message || 'Error communicating with AI assistant');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I am currently offline or experiencing heavy load. Please try again in a few moments!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, fontFamily: 'inherit' }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Ask ApexAdvisor AI"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="glass-card animate-fade-in"
          style={{
            width: '380px',
            height: '520px',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, var(--primary) 0%, rgba(99, 102, 241, 0.8) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}>
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>ApexAdvisor AI</h4>
                <span style={{ fontSize: '10px', opacity: 0.9 }}>Serverless Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div
            style={{
              flexGrow: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'var(--bg-tertiary)',
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                {msg.sender === 'ai' && (
                  <div
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      padding: '6px',
                      borderRadius: '50%',
                      marginTop: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={14} style={{ color: 'var(--primary)' }} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '14px 14px 0 14px' : '0 14px 14px 14px',
                      background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-primary)',
                      color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      border: msg.sender === 'user' ? 'none' : '1px solid var(--border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.text}
                  </div>
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--text-muted)',
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.time}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      padding: '6px',
                      borderRadius: '50%',
                      marginTop: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    padding: '6px',
                    borderRadius: '50%',
                  }}
                >
                  <Bot size={14} style={{ color: 'var(--primary)' }} />
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '0 14px 14px 14px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  Typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
            }}
          >
            <input
              type="text"
              placeholder="Ask about MERN, AWS, or discounts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              style={{
                flexGrow: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              style={{
                background: inputValue.trim() && !loading ? 'var(--primary)' : 'var(--bg-tertiary)',
                color: inputValue.trim() && !loading ? 'white' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
