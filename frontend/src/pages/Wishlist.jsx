import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import Loader from '../components/Loader';
import { Heart } from 'lucide-react';

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await request('/auth/wishlist', 'GET');
      if (data.success) {
        setWishlistItems(data.wishlist);
      }
    } catch (error) {
      console.error('Error fetching user wishlist:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  if (loading) {
    return <Loader fullPage />;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px 80px 24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <Heart size={28} fill="var(--primary)" stroke="none" />
        <h2 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>Your Wishlist</h2>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            No projects in your wishlist. Heart some projects on the marketplace to add them here!
          </p>
        </div>
      ) : (
        <div className="grid-cols-4">
          {wishlistItems.map((item) => (
            <ProjectCard key={item._id} project={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
