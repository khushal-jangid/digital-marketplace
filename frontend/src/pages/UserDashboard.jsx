import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../utils/api';
import Loader from '../components/Loader';
import InvoiceModal from '../components/InvoiceModal';
import {
  User,
  ShoppingBag,
  DownloadCloud,
  Gift,
  KeyRound,
  History,
  Copy,
  Check,
  TrendingUp,
  FileText,
  LogOut,
} from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilith',
];

const UserDashboard = () => {
  const { user, updateProfile, loadProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('purchases');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Profile Update Form
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Camera and Upload states
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const compressAndSetAvatar = (imageOrVideo, isVideo = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageOrVideo, 0, 0, 128, 128);
    const base64Url = canvas.toDataURL('image/jpeg', 0.8);
    setSelectedAvatar(base64Url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        compressAndSetAvatar(img, false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 128, height: 128 } });
      setStream(mediaStream);
      setCameraActive(true);
      setTimeout(() => {
        const video = document.getElementById('avatar-camera-feed');
        if (video) {
          video.srcObject = mediaStream;
          video.play();
        }
      }, 300);
    } catch (err) {
      alert('Camera access denied or unavailable: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('avatar-camera-feed');
    if (video) {
      compressAndSetAvatar(video, true);
      stopCamera();
    }
  };

  // Purchased items & Download history
  const [purchases, setPurchases] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  // Referral copy state
  const [copied, setCopied] = useState(false);

  const fetchDashboardData = async () => {
    setPurchasesLoading(true);
    try {
      // 1. Fetch user purchases
      const purchasesData = await request('/orders/my-purchases', 'GET');
      if (purchasesData && purchasesData.success) {
        setPurchases(Array.isArray(purchasesData.purchases) ? purchasesData.purchases : []);
      } else {
        setPurchases([]);
      }

      // 2. Fetch user download logs
      const downloadsData = await request('/orders/download-history', 'GET');
      if (downloadsData && downloadsData.success) {
        setDownloads(Array.isArray(downloadsData.history) ? downloadsData.history : []);
      } else {
        setDownloads([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error.message);
      setPurchases([]);
      setDownloads([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    setProfileLoading(true);

    try {
      const data = await updateProfile(name, password, selectedAvatar);
      if (data.success) {
        setProfileMsg('Profile updated successfully!');
        setPassword('');
        await loadProfile(); // Reload user state
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDownload = async (projectId) => {
    try {
      const data = await request(`/projects/${projectId}/download-link`, 'GET');
      if (data.success && data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert(error.message || 'Download link generation failed');
    }
  };

  const handleCopyReferral = () => {
    const code = user?.referralCode || (user?._id ? `APEX-${user._id.slice(-4).toUpperCase()}` : 'APEX-PRO');
    const referralLink = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px 24px' }}>
      
      {/* User Header Info card */}
      <div className="glass-card" style={{
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '24px',
            border: '2px solid var(--border)'
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user?.name ? user.name.charAt(0) : (user?.email ? user.email.charAt(0) : 'U')).toUpperCase()
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', margin: 0 }}>{user?.name || user?.email || 'My Account'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>{user?.email || 'Logged in'}</p>
          </div>
        </div>

        {/* Right side: referral quick view & logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '10px 18px',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Referral Earnings
            </span>
            <strong style={{ fontSize: '18px', color: 'var(--success)', display: 'block', fontFamily: 'var(--font-heading)' }}>
              INR {user?.referralEarnings || 0}
            </strong>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-danger"
            style={{
              padding: '10px 18px',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              fontWeight: 600,
            }}
            title="Sign Out of your Account"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Layout */}
      <div className="responsive-dashboard-grid" style={{
        alignItems: 'flex-start'
      }}>
        
        {/* Left Side Tab Navigation Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('purchases')}
            className="btn"
            style={{
              padding: '12px 16px',
              justifyContent: 'flex-start',
              fontSize: '14px',
              background: activeTab === 'purchases' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'purchases' ? 'var(--primary)' : 'var(--text-secondary)',
              borderLeft: activeTab === 'purchases' ? '3px solid var(--primary)' : '3px solid transparent',
              borderRadius: '0 8px 8px 0'
            }}
          >
            <ShoppingBag size={16} /> My Purchased Projects
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className="btn"
            style={{
              padding: '12px 16px',
              justifyContent: 'flex-start',
              fontSize: '14px',
              background: activeTab === 'referrals' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'referrals' ? 'var(--primary)' : 'var(--text-secondary)',
              borderLeft: activeTab === 'referrals' ? '3px solid var(--primary)' : '3px solid transparent',
              borderRadius: '0 8px 8px 0'
            }}
          >
            <Gift size={16} /> Referrals & Rewards
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="btn"
            style={{
              padding: '12px 16px',
              justifyContent: 'flex-start',
              fontSize: '14px',
              background: activeTab === 'history' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-secondary)',
              borderLeft: activeTab === 'history' ? '3px solid var(--primary)' : '3px solid transparent',
              borderRadius: '0 8px 8px 0'
            }}
          >
            <History size={16} /> Download Logs History
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className="btn"
            style={{
              padding: '12px 16px',
              justifyContent: 'flex-start',
              fontSize: '14px',
              background: activeTab === 'profile' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)',
              borderLeft: activeTab === 'profile' ? '3px solid var(--primary)' : '3px solid transparent',
              borderRadius: '0 8px 8px 0'
            }}
          >
            <User size={16} /> Edit Profile Settings
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn"
            style={{
              marginTop: '12px',
              padding: '12px 16px',
              justifyContent: 'flex-start',
              fontSize: '14px',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            <LogOut size={16} /> Sign Out Account
          </button>
        </div>

        {/* Right Side Dashboard Content Column */}
        <div className="glass" style={{ padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          {purchasesLoading ? (
            <Loader />
          ) : (
            <>
              {/* Purchases Tab */}
              {activeTab === 'purchases' && (
                <div>
                  <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                    Your Digital Purchases
                  </h3>
                  {purchases.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>You haven't purchased any projects yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {purchases.map((pur) => (
                        <div key={pur.orderId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)'
                        }}>
                          <div>
                            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{pur.project?.title || pur.titleAtPurchase}</strong>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              <span>Purchased on: {new Date(pur.purchasedAt).toLocaleDateString()}</span>
                              <span>Price Paid: INR {pur.pricePaid}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setSelectedInvoice(pur)}
                              className="btn btn-secondary"
                              style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              title="View & Download Official Tax Invoice (PDF)"
                            >
                              <FileText size={14} style={{ color: '#10b981' }} /> Invoice (PDF)
                            </button>

                            {pur.project?._id ? (
                              <>
                                <button
                                  onClick={() => handleDownload(pur.project._id)}
                                  className="btn btn-primary"
                                  style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <DownloadCloud size={14} /> Download File
                                </button>
                                <button
                                  onClick={() => navigate(`/projects/${pur.project._id}`)}
                                  className="btn btn-secondary"
                                  style={{ padding: '8px 16px', fontSize: '13px' }}
                                >
                                  Details
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Project no longer available</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Referrals Tab */}
              {activeTab === 'referrals' && (
                <div>
                  <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                    Referrals Program Dashboard
                  </h3>
                  
                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    marginBottom: '30px'
                  }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Your Referral Code</h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-primary)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      justifyContent: 'space-between',
                      maxWidth: '300px'
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '2px' }}>
                        {user?.referralCode || (user?._id ? `APEX-${user._id.slice(-4).toUpperCase()}` : 'APEX-PRO')}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>code</span>
                    </div>
                    
                    <h4 style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>Your Invite Link</h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-primary)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {window.location.origin}/?ref={user?.referralCode || (user?._id ? `APEX-${user._id.slice(-4).toUpperCase()}` : 'APEX-PRO')}
                      </span>
                      <button
                        onClick={handleCopyReferral}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
                    border: '1px solid var(--border)',
                  }}>
                    <Gift size={32} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Invite Friends & Earn Rewards!</strong> Share your unique referral link or code with fellow developers and students. Whenever friends join or purchase templates, you unlock exclusive wallet rewards and special discounts!
                    </p>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                    Download History Logs
                  </h3>
                  {downloads.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No file download history logged yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '12px 8px' }}>Project Title</th>
                            <th style={{ padding: '12px 8px' }}>Category</th>
                            <th style={{ padding: '12px 8px' }}>Download Count</th>
                            <th style={{ padding: '12px 8px' }}>Last Downloaded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {downloads.map((log) => (
                            <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>{log.project?.title || 'Unknown Title'}</td>
                              <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{log.project?.category || 'N/A'}</td>
                              <td style={{ padding: '12px 8px' }}>{log.downloadCount} / {log.maxDownloadsAllowed}</td>
                              <td style={{ padding: '12px 8px' }}>{new Date(log.lastDownloadedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Settings Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                    Update Profile Info
                  </h3>

                  {profileMsg && <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>{profileMsg}</div>}
                  {profileError && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>{profileError}</div>}

                  <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>Choose Cartoon Avatar</label>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {AVATAR_OPTIONS.map((avatarUrl, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedAvatar(avatarUrl)}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: selectedAvatar === avatarUrl ? '3px solid var(--primary)' : '2px solid transparent',
                              boxShadow: selectedAvatar === avatarUrl ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none',
                              transition: 'all 0.2s ease',
                              transform: selectedAvatar === avatarUrl ? 'scale(1.08)' : 'scale(1)',
                              background: 'var(--bg-tertiary)'
                            }}
                          >
                            <img src={avatarUrl} alt={`avatar-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <label className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                          📁 Upload Custom Image
                          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>
                        
                        {!cameraActive ? (
                          <button type="button" onClick={startCamera} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            📷 Take Live Photo
                          </button>
                        ) : (
                          <div style={{ width: '100%', marginTop: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <video id="avatar-camera-feed" style={{ width: '128px', height: '128px', borderRadius: '50%', objectFit: 'cover', transform: 'scaleX(-1)', border: '2px solid var(--primary)', marginBottom: '12px' }}></video>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button type="button" onClick={capturePhoto} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Snap Photo</button>
                              <button type="button" onClick={stopCamera} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedAvatar && selectedAvatar.startsWith('data:image/') && (
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 'bold' }}>✓ Custom Photo Loaded</span>
                          <button type="button" onClick={() => setSelectedAvatar('')} style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>Clear custom photo</button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Name</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email (Unmodifiable)</label>
                      <input
                        type="email"
                        className="form-input"
                        disabled
                        style={{ opacity: 0.6 }}
                        value={user?.email || ''}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>New Password (Leave blank to keep same)</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <button type="submit" disabled={profileLoading} className="btn btn-primary" style={{ padding: '12px', width: '100%' }}>
                      {profileLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Official Tax Invoice & Receipt Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          user={user}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
