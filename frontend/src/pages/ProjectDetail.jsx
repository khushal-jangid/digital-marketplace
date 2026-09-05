import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { request } from '../utils/api';
import Loader from '../components/Loader';
import {
  Star,
  Heart,
  ShoppingCart,
  Download,
  FolderArchive,
  Terminal,
  Calendar,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, toggleWishlist, isInWishlist, isPurchased } = useAuth();
  const { cartItems, addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedLicense, setSelectedLicense] = useState('personal');

  const [project, setProject] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userAlreadyReviewed, setUserAlreadyReviewed] = useState(false);

  const isOwned = hasPurchased || (isPurchased ? isPurchased(id) : false);

  // Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Feature Request States
  const [featureRequests, setFeatureRequests] = useState([]);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqBid, setReqBid] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState('');

  // Active Image Preview Index
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const fetchProjectDetails = async () => {
    try {
      // 1. Fetch project data
      const data = await request(`/projects/${id}`, 'GET');
      if (data.success) {
        setProject(data.project);
      }

      // 2. Fetch reviews data
      const reviewsData = await request(`/reviews/project/${id}`, 'GET');
      if (reviewsData.success) {
        setReviews(reviewsData.reviews);
      }

      // 3. Verify purchase if logged in
      if (user) {
        const purchaseData = await request('/orders/my-purchases', 'GET');
        if (purchaseData.success) {
          const purchased = purchaseData.purchases.some((pur) => pur.project?._id === id);
          setHasPurchased(purchased);

          // Check if user already left a review in reviews list
          if (reviewsData.success) {
            const reviewed = reviewsData.reviews.some((rev) => rev.user?._id === user._id);
            setUserAlreadyReviewed(reviewed);
          }
        }
      }

      // 4. Fetch feature requests
      const reqsData = await request(`/feature-requests/project/${id}`, 'GET');
      if (reqsData.success) {
        setFeatureRequests(reqsData.featureRequests);
      }
    } catch (error) {
      console.error('Error loading project details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id, user]);

  if (loading) {
    return <Loader fullPage />;
  }

  if (!project) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Project Not Found</h2>
        <Link to="/projects" className="btn btn-secondary" style={{ marginTop: '20px' }}>Back to Listings</Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(project._id);
  const inCart = cartItems.some((item) => item._id === project._id);

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleWishlist(project._id);
  };

  const handleAddToCart = () => {
    if (inCart) {
      navigate('/cart');
    } else {
      addToCart(project, selectedLicense);
    }
  };

  const handleDownloadFile = async (versionIndex = undefined) => {
    try {
      let endpoint = `/projects/${id}/download-link`;
      if (versionIndex !== undefined) {
        endpoint += `?versionIndex=${versionIndex}`;
      }

      const data = await request(endpoint, 'GET');
      const url = data?.downloadUrl || project?.externalDownloadUrl || project?.fileUrl;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (project?.externalDownloadUrl || project?.fileUrl) {
        window.open(project.externalDownloadUrl || project.fileUrl, '_blank');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSubmitLoading(true);

    try {
      const data = await request('/reviews', 'POST', {
        projectId: id,
        rating,
        comment,
      });

      if (data.success) {
        setComment('');
        setUserAlreadyReviewed(true);
        // Refresh details to fetch new average rating
        await fetchProjectDetails();
      }
    } catch (error) {
      setReviewError(error.message || 'Failed to submit review');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const handleFeatureRequestSubmit = async (e) => {
    e.preventDefault();
    setReqError('');
    setReqSuccess('');
    setReqLoading(true);

    try {
      const data = await request('/feature-requests', 'POST', {
        projectId: id,
        title: reqTitle,
        description: reqDesc,
        bidAmount: Number(reqBid),
      });

      if (data.success) {
        setReqTitle('');
        setReqDesc('');
        setReqBid('');
        setReqSuccess('Feature request submitted successfully! Other developers can now upvote it.');
        // Refresh feature requests
        const reqsData = await request(`/feature-requests/project/${id}`, 'GET');
        if (reqsData.success) {
          setFeatureRequests(reqsData.featureRequests);
        }
      }
    } catch (err) {
      setReqError(err.message || 'Failed to submit feature request');
    } finally {
      setReqLoading(false);
    }
  };

  const handleUpvoteFeatureRequest = async (requestId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const data = await request(`/feature-requests/${requestId}/upvote`, 'POST');
      if (data.success) {
        // Refresh list
        const reqsData = await request(`/feature-requests/project/${id}`, 'GET');
        if (reqsData.success) {
          setFeatureRequests(reqsData.featureRequests);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to upvote');
    }
  };

  const previewImage = project.previewUrls?.[activeImgIndex] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px 24px' }}>
      
      {/* Back link */}
      <Link to="/projects" style={{
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '14px',
        marginBottom: '24px',
        display: 'inline-block'
      }}>
        ← Back to Listings
      </Link>

      {/* Main Details Panel */}
      <div className="responsive-two-col" style={{
        alignItems: 'flex-start'
      }}>
        
        {/* Left Column: Visual Previews & Descriptions */}
        <div>
          {/* Gallery View */}
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
            height: 'clamp(220px, 45vw, 420px)',
            position: 'relative'
          }}>
            <img
              src={previewImage}
              alt={project.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Thumbnails row */}
          {project.previewUrls && project.previewUrls.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
              {project.previewUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImgIndex(i)}
                  style={{
                    width: '80px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: activeImgIndex === i ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}

          {/* Project Details Description */}
          <div className="glass-card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              Project Overview
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '15px', whiteSpace: 'pre-line' }}>
              {project.description}
            </p>
          </div>

          {/* Tech Stack */}
          <div className="glass-card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Terminal size={18} style={{ color: 'var(--primary)' }} /> Technology Stack Used
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {project.techStack?.map((tech, i) => (
                <span key={i} className="badge badge-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Unlocked Secure Download Block (for buyers) */}
          {hasPurchased && (
            <div className="glass-card" style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(20, 184, 166, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              marginBottom: '32px'
            }}>
              <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                <FolderArchive size={20} style={{ color: 'var(--success)' }} /> Unlocked Downloads & Updates
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                ✓ Purchase verified. Download your project files securely below. File updates (new versions) are free.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.versions?.map((ver, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <strong style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {ver.version} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({ver.createdAt ? new Date(ver.createdAt).toLocaleDateString() : 'N/A'})</span>
                      </strong>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Release Note: {ver.releaseNotes}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadFile(i)}
                      className="btn btn-accent"
                      style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={14} /> Download File
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews & Ratings Section */}
          <div className="glass-card">
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <MessageSquare size={18} style={{ color: 'var(--secondary)' }} /> Customer Reviews
            </h2>

            {/* Review Submission Form (Only for paid buyers who haven't reviewed) */}
            {hasPurchased && !userAlreadyReviewed && (
              <form onSubmit={handleReviewSubmit} style={{
                background: 'var(--bg-tertiary)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                marginBottom: '32px'
              }}>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} /> Rate this project
                </h3>

                {reviewError && (
                  <div style={{ color: 'var(--error)', fontSize: '12px', marginBottom: '12px' }}>{reviewError}</div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Rating:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: rating >= star ? '#fbbf24' : 'var(--text-muted)' }}
                      >
                        <Star size={20} fill={rating >= star ? '#fbbf24' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Your Review Comment
                  </label>
                  <textarea
                    required
                    className="form-input"
                    rows="3"
                    style={{ resize: 'vertical' }}
                    placeholder="Tell us what you liked about the template and code architecture..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <button type="submit" disabled={reviewSubmitLoading} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                  {reviewSubmitLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>No reviews yet. Purchase the project to write a review!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviews.map((rev) => (
                  <div key={rev._id} style={{
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{rev.user?.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '8px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} fill={rev.rating >= star ? '#fbbf24' : 'none'} stroke={rev.rating >= star ? '#fbbf24' : 'currentColor'} />
                      ))}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Pricing Card */}
        <div style={{
          position: 'sticky',
          top: '90px'
        }}>
          <div className="glass-card" style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="badge badge-primary">
                Personal License
              </span>
              <button
                onClick={handleWishlistToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isWishlisted ? '#f43f5e' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                title={isWishlisted ? 'Remove Wishlist' : 'Add Wishlist'}
              >
                <Heart size={20} fill={isWishlisted ? '#f43f5e' : 'none'} />
              </button>
            </div>

            {/* Dynamic Price Display */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatPrice(project.price)}
                </span>
                {(() => {
                  const baseMrp = project.originalPrice && project.originalPrice > project.price
                    ? project.originalPrice
                    : Math.round(project.price * 1.5);
                  const currentPrice = project.price;
                  const discountPercent = Math.round(((baseMrp - currentPrice) / baseMrp) * 100);
                  if (discountPercent <= 0) return null;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '17px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {formatPrice(baseMrp)}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                        {discountPercent}% OFF
                      </span>
                    </div>
                  );
                })()}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                One-time payment • Lifetime access & future updates
              </span>
            </div>

            {/* License Details */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Included License:
              </label>

              <div>
                {/* Personal License */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--primary)',
                    background: 'rgba(99, 102, 241, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                      Personal License
                    </strong>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatPrice(project.price)}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                    Single end product, student learning, personal portfolio.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} /> Published: {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderArchive size={14} /> File Size: {project.fileSize}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={14} fill="#fbbf24" stroke="none" /> Customer Rating: {project.ratings?.average || '0.0'} / 5.0
              </div>
            </div>

            {isOwned ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#22c55e',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={18} />
                  <span>You Already Own This Project</span>
                </div>

                <button
                  onClick={() => handleDownloadFile()}
                  className="btn btn-accent"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Download size={18} /> Download Source Code
                </button>

                <Link
                  to="/dashboard"
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  View in My Purchases / Dashboard
                </Link>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              >
                <ShoppingCart size={18} />
                {inCart ? 'Go to Shopping Cart' : `Buy Now (${formatPrice(project.price)})`}
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProjectDetail;
