import React, { useState, useEffect } from 'react';
import { request } from '../utils/api';
import Loader from '../components/Loader';
import {
  LayoutDashboard,
  FolderOpen,
  Ticket,
  PlusCircle,
  Trash2,
  Edit2,
  FileCheck,
  CheckCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Layers,
  Lightbulb,
  ThumbsUp,
  Star,
  Flame,
  Clock,
  Zap,
  FileText,
  Mail,
  Send,
  Loader2,
  RefreshCw,
  Code,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  MessageCircle,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from '../components/InvoiceModal';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [couponNotification, setCouponNotification] = useState(null);

  // Custom Project Commission Inquiries & ₹50 Fee State
  const [customProjects, setCustomProjects] = useState([]);
  const [customProjectsLoading, setCustomProjectsLoading] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    isEnabled: true,
    entryFee: 50,
    upiId: '7303354598@omni',
    upiName: 'Khushal Jangid',
    notice: '',
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Analytics Stats State
  const [stats, setStats] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProjects, setTopProjects] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Products State
  const [projects, setProjects] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Add Product Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('source-code');
  const [techStack, setTechStack] = useState('');
  const [previewUrls, setPreviewUrls] = useState('');
  const [file, setFile] = useState(null);
  const [externalDownloadUrl, setExternalDownloadUrl] = useState('');
  const [upiId, setUpiId] = useState('7303354598@omni');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponLimit, setCouponLimit] = useState('');
  const [couponTargetProject, setCouponTargetProject] = useState('all');
  const [couponLoading, setCouponLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);

  // Feature Requests State
  const [featureRequests, setFeatureRequests] = useState([]);
  const [featureRequestsLoading, setFeatureRequestsLoading] = useState(false);

  // Edit Project State
  const [editingProject, setEditingProject] = useState(null);

  // Subscribers State
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  // Reviews State
  const [allReviews, setAllReviews] = useState([]);
  const [allReviewsLoading, setAllReviewsLoading] = useState(false);
  // Flash Sale State
  const [flashSaleConfig, setFlashSaleConfig] = useState({
    isActive: false,
    title: '',
    subtitle: '',
    promoCode: 'FLASH35',
    discountPercentage: 35,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    targetProject: null,
    targetProjectTitle: 'All Projects',
  });
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [flashSaleMsg, setFlashSaleMsg] = useState('');
  const [flashSaleError, setFlashSaleError] = useState('');

  const getRemainingTime = (expiryDate) => {
    if (!expiryDate) return { text: 'No expiry', isExpired: false };
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    if (diff <= 0) return { text: 'Expired', isExpired: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60)) / (1000 * 60));
    if (days > 0) return { text: `${days}d ${hours}h left`, isExpired: false };
    if (hours > 0) return { text: `${hours}h ${mins}m left`, isExpired: false };
    return { text: `${mins}m left`, isExpired: false };
  };

  const fetchFlashSaleConfig = async () => {
    try {
      const data = await request('/flash-sale', 'GET');
      if (data.success && data.flashSale) {
        const fs = data.flashSale;
        setFlashSaleConfig({
          isActive: Boolean(fs.isActive),
          title: fs.title || '',
          subtitle: fs.subtitle || '',
          promoCode: fs.promoCode || 'FLASH35',
          discountPercentage: fs.discountPercentage || 35,
          endTime: fs.endTime
            ? new Date(fs.endTime).toISOString().slice(0, 16)
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          targetProject: fs.targetProject || null,
          targetProjectTitle: fs.targetProjectTitle || 'All Projects',
        });
      }
    } catch (err) {
      console.warn('Failed to load flash sale:', err.message);
    }
  };

  const handleToggleFlashSale = async (nextState) => {
    const updated = { ...flashSaleConfig, isActive: nextState };
    setFlashSaleConfig(updated);
    try {
      const data = await request('/flash-sale', 'PUT', updated);
      if (data.success) {
        await fetchCoupons();
        setCouponNotification({
          type: 'flashSale',
          code: updated.promoCode,
          title: nextState ? '⚡ Flash Sale is Now LIVE & Activated!' : '🛑 Flash Sale Deactivated (Hidden from Store)',
          details: nextState
            ? `Flash Sale banner is now visible with promo code ${updated.promoCode} (${updated.discountPercentage}% OFF).`
            : 'Flash Sale banner has been hidden from the store and checkout coupon deactivated.',
        });
        setTimeout(() => setCouponNotification(null), 6000);
      }
    } catch (err) {
      console.error('Failed to toggle flash sale:', err.message);
    }
  };

  const handleFlashSaleSubmit = async (e) => {
    e.preventDefault();
    setFlashSaleLoading(true);
    setFlashSaleMsg('');
    setFlashSaleError('');
    try {
      const data = await request('/flash-sale', 'PUT', flashSaleConfig);
      if (data.success) {
        setFlashSaleMsg(data.message || 'Flash Sale settings updated and synced with promo coupons!');
        await fetchCoupons();

        setCouponNotification({
          type: 'flashSale',
          code: flashSaleConfig.promoCode,
          title: `⚡ Flash Sale ${flashSaleConfig.isActive ? 'is LIVE & Activated!' : 'Settings Saved (Paused)'}`,
          details: `${flashSaleConfig.title || 'Catalog Flash Deal'} • Coupon: ${flashSaleConfig.promoCode} (${flashSaleConfig.discountPercentage}% OFF) • Target: ${flashSaleConfig.targetProjectTitle || 'All Projects'} • Ends: ${new Date(flashSaleConfig.endTime).toLocaleString()}`,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
          setFlashSaleMsg('');
          setCouponNotification(null);
        }, 8000);
      }
    } catch (err) {
      setFlashSaleError(err.message || 'Failed to update flash sale');
      setCouponNotification({
        type: 'error',
        title: '❌ Flash Sale Update Failed',
        details: err.message || 'Could not save flash sale configuration.',
      });
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const handleDeleteFlashSale = async () => {
    if (!window.confirm('Are you sure you want to permanently delete and remove this Flash Sale from the store?')) return;
    setFlashSaleLoading(true);
    try {
      const data = await request('/flash-sale', 'DELETE');
      if (data.success) {
        setFlashSaleConfig({
          isActive: false,
          title: '',
          subtitle: '',
          promoCode: '',
          discountPercentage: 0,
          endTime: '',
          targetProject: null,
          targetProjectTitle: 'All Projects',
        });
        await fetchCoupons();
        setCouponNotification({
          type: 'flashSale',
          title: '🗑️ Flash Sale Deleted Permanently',
          details: 'Flash Sale and its promotional banner have been completely removed from the store.',
        });
        setTimeout(() => setCouponNotification(null), 6000);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete flash sale');
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const setFlashSaleDurationHours = (hours) => {
    const end = new Date(Date.now() + hours * 60 * 60 * 1000);
    setFlashSaleConfig((prev) => ({
      ...prev,
      endTime: end.toISOString().slice(0, 16),
    }));
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await request('/analytics/dashboard', 'GET');
      if (data && data.success) {
        setStats(data.stats || { totalRevenue: 24950, totalOrders: 68, totalUsers: 142, totalProjects: 8 });
        setMonthlySales(Array.isArray(data.monthlySales) ? data.monthlySales : [
          { month: 'Jan', revenue: 3200 },
          { month: 'Feb', revenue: 5400 },
          { month: 'Mar', revenue: 7800 },
          { month: 'Apr', revenue: 8550 },
        ]);
        setTopProjects(Array.isArray(data.topProjects) ? data.topProjects : []);
        setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
      }
    } catch (error) {
      console.error('Error fetching analytics stats:', error.message);
    }
  };

  const fetchProjects = async () => {
    setProductsLoading(true);
    try {
      const data = await request('/projects', 'GET');
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects list:', error.message);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await request('/coupons', 'GET');
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await request('/orders', 'GET');
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error.message);
    }
  };

  const fetchAllFeatureRequests = async () => {
    setFeatureRequestsLoading(true);
    try {
      const data = await request('/feature-requests', 'GET');
      if (data.success) {
        setFeatureRequests(data.featureRequests);
      }
    } catch (error) {
      console.error('Error fetching feature requests:', error.message);
    } finally {
      setFeatureRequestsLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    setSubscribersLoading(true);
    try {
      const data = await request('/support/subscribers', 'GET');
      if (data.success) {
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error.message);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const fetchAllReviews = async () => {
    setAllReviewsLoading(true);
    try {
      const data = await request('/reviews', 'GET');
      if (data.success) {
        setAllReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching all reviews:', error.message);
    } finally {
      setAllReviewsLoading(false);
    }
  };

  const handleDeleteSubscriber = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) return;
    try {
      const data = await request(`/support/subscribers/${subId}`, 'DELETE');
      if (data.success) {
        alert('Subscriber deleted successfully!');
        setSubscribers(subscribers.filter(s => s._id !== subId));
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const data = await request(`/reviews/${reviewId}`, 'DELETE');
      if (data.success) {
        alert('Review deleted successfully!');
        setAllReviews(allReviews.filter(r => r._id !== reviewId));
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleDeleteFeatureRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this feature bid?')) return;
    try {
      const data = await request(`/feature-requests/${requestId}`, 'DELETE');
      if (data.success) {
        alert('Feature bid deleted successfully!');
        setFeatureRequests(featureRequests.filter(r => r._id !== requestId));
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleUpdateFeatureStatus = async (requestId, status) => {
    if (!window.confirm(`Mark this feature request as ${status.toUpperCase()}?`)) return;
    try {
      const data = await request(`/feature-requests/${requestId}`, 'PATCH', { status });
      if (data.success) {
        alert('Feature request status updated successfully!');
        fetchAllFeatureRequests();
      }
    } catch (error) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleSendRecoveryEmails = async () => {
    if (!window.confirm('Trigger recovery campaign? This will email a 10% coupon to all customers who abandoned checkout.')) return;
    try {
      const data = await request('/orders/send-recovery-emails', 'POST');
      if (data.success) {
        alert(data.message);
      }
    } catch (err) {
      alert(err.message || 'Failed to send recovery campaign');
    }
  };

  const handleApproveUtr = async (orderId) => {
    if (!window.confirm('Approve this UTR payment and unlock downloads?')) return;
    try {
      const data = await request(`/orders/verify-utr/${orderId}`, 'POST');
      if (data.success) {
        alert('Order approved successfully! Download access has been unlocked.');
        
        // Optimistically update local state to reflect 'paid' status immediately
        setOrders(prevOrders => prevOrders.map(o => 
          o._id === orderId ? { ...o, paymentStatus: 'paid' } : o
        ));
        
        fetchDashboardStats();
      }
    } catch (error) {
      alert(error.message || 'Verification failed');
    }
  };

  const handleRejectUtr = async (orderId) => {
    if (!window.confirm('Reject this UTR payment?')) return;
    try {
      const data = await request(`/orders/reject-utr/${orderId}`, 'POST');
      if (data.success) {
        alert('Order rejected successfully.');
        
        // Optimistically update local state to reflect 'failed' status immediately
        setOrders(prevOrders => prevOrders.map(o => 
          o._id === orderId ? { ...o, paymentStatus: 'failed' } : o
        ));
      }
    } catch (error) {
      alert(error.message || 'Rejection failed');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to permanently delete this transaction record?')) return;
    try {
      const data = await request(`/orders/${orderId}`, 'DELETE');
      if (data.success) {
        alert('Transaction record deleted successfully.');
        setOrders(orders.filter((o) => o._id !== orderId));
        await fetchDashboardStats();
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleStartEdit = (proj) => {
    setEditingProject(proj);
    setTitle(proj.title || '');
    setDescription(proj.description || '');
    setPrice(proj.price || '');
    setOriginalPrice(proj.originalPrice || '');
    setCategory(proj.category || 'source-code');
    setTechStack(proj.techStack ? proj.techStack.join(', ') : '');
    setPreviewUrls(proj.previewUrls ? proj.previewUrls.join('\n') : '');
    setExternalDownloadUrl(proj.externalDownloadUrl || '');
    setUpiId(proj.upiId || '');
    setFile(null);
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setCategory('source-code');
    setTechStack('');
    setPreviewUrls('');
    setExternalDownloadUrl('');
    setUpiId('7303354598@omni');
    setFile(null);
  };

  const fetchCustomProjects = async () => {
    setCustomProjectsLoading(true);
    try {
      const data = await request('/custom-projects', 'GET');
      if (data.success) {
        setCustomProjects(data.customProjects || data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching custom projects:', err.message);
    } finally {
      setCustomProjectsLoading(false);
    }
  };

  const fetchCustomSettings = async () => {
    try {
      const data = await request('/custom-projects/settings', 'GET');
      if (data.success && data.settings) {
        setCustomSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching custom settings:', err.message);
    }
  };

  const handleSaveCustomSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setUpdatingSettings(true);
    try {
      const data = await request('/custom-projects/settings', 'PUT', customSettings);
      if (data.success) {
        alert(data.message || 'Custom Project settings saved successfully!');
        setCustomSettings(data.settings);
      }
    } catch (err) {
      alert(err.message || 'Failed to update custom project settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleToggleCustomProjects = async (nextState) => {
    const updated = { ...customSettings, isEnabled: nextState };
    setCustomSettings(updated);
    try {
      await request('/custom-projects/settings', 'PUT', updated);
    } catch (err) {
      console.error('Toggle failed:', err.message);
    }
  };

  const handleUpdateCustomProjectStatus = async (id, status, paymentStatus) => {
    try {
      const body = {};
      if (status) body.status = status;
      if (paymentStatus) body.paymentStatus = paymentStatus;
      const data = await request(`/custom-projects/${id}/status`, 'PATCH', body);
      if (data.success) {
        setCustomProjects(customProjects.map((p) => (p._id === id ? data.project : p)));
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteCustomProject = async (id) => {
    if (!window.confirm('Delete this custom project request?')) return;
    try {
      const data = await request(`/custom-projects/${id}`, 'DELETE');
      if (data.success) {
        setCustomProjects(customProjects.filter((p) => p._id !== id));
      }
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  useEffect(() => {
    // Check URL parameters for direct tab navigation & Telegram 1-click approvals
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        if (tabParam === 'orders' || tabParam === 'transactions') setActiveTab('orders');
        else if (tabParam === 'coupons') setActiveTab('coupons');
        else if (tabParam === 'flashSale' || tabParam === 'flash-sale') setActiveTab('flashSale');
        else if (tabParam === 'custom' || tabParam === 'customProjects') setActiveTab('customProjects');
        else if (tabParam === 'products') setActiveTab('products');
        else if (tabParam === 'reviews') setActiveTab('reviews');
        else if (tabParam === 'requests') setActiveTab('featureRequests');
      }

      // Handle direct orderData payload from Telegram alert buttons
      const orderDataRaw = params.get('orderData');
      if (orderDataRaw) {
        try {
          const parsedOrder = JSON.parse(decodeURIComponent(orderDataRaw));
          if (parsedOrder && parsedOrder._id) {
            setOrders((prev) => {
              const exists = prev.some((o) => o._id === parsedOrder._id);
              const updatedList = exists
                ? prev.map((o) => (o._id === parsedOrder._id ? { ...o, ...parsedOrder } : o))
                : [parsedOrder, ...prev];
              try {
                localStorage.setItem('apex_orders', JSON.stringify(updatedList));
              } catch (_) {}
              return updatedList;
            });
            setActiveTab('orders');

            // If autoApprove flag is set from Telegram 1-click button
            if (params.get('autoApprove') === 'true') {
              setTimeout(() => {
                handleApproveUtr(parsedOrder._id);
              }, 700);
            }
          }
        } catch (_) {}
      }
    } catch (_) {}

    fetchDashboardStats();
    fetchProjects();
    fetchCoupons();
    fetchFlashSaleConfig();
    fetchOrders();
    fetchCustomProjects();
    fetchCustomSettings();
    fetchAllFeatureRequests();
    fetchSubscribers();
    fetchAllReviews();
  }, []);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!title.trim() || !description.trim() || !price) {
      setFormError('Please fill in title, description, and price.');
      return;
    }

    const fileUrlToSave = (externalDownloadUrl || '').trim();
    if (!editingProject && !fileUrlToSave) {
      setFormError('Please enter a valid Google Drive / Download link.');
      return;
    }

    setFormLoading(true);
    try {
      const previewUrlsArray = previewUrls
        ? previewUrls.split('\n').map((u) => u.trim()).filter(Boolean)
        : [];

      const techStackArray = typeof techStack === 'string'
        ? techStack.split(',').map((s) => s.trim()).filter(Boolean)
        : (Array.isArray(techStack) ? techStack : []);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        originalPrice: Number(originalPrice) || 0,
        category: category || 'source-code',
        techStack: techStackArray,
        previewUrls: previewUrlsArray,
        externalDownloadUrl: fileUrlToSave || (editingProject?.externalDownloadUrl || ''),
        fileUrl: fileUrlToSave || (editingProject?.fileUrl || ''),
        upiId: upiId || '7303354598@omni',
        isFeatured: true,
      };

      let data;
      if (editingProject) {
        data = await request(`/projects/${editingProject._id}`, 'PUT', payload);
      } else {
        data = await request('/projects', 'POST', payload);
      }

      if (data.success) {
        setFormSuccess(editingProject ? 'Project updated successfully in database!' : 'Project uploaded and published to catalog successfully!');
        handleCancelEdit();
        // Refresh products list & stats
        await fetchProjects();
        await fetchDashboardStats();
      } else {
        setFormError(data.message || 'Failed to save project.');
      }
    } catch (error) {
      setFormError(error.message || 'Error saving project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (projId) => {
    if (!window.confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      const data = await request(`/projects/${projId}`, 'DELETE');
      if (data.success) {
        setProjects(projects.filter((p) => p._id !== projId));
        await fetchDashboardStats();
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponLoading(true);
    try {
      const selectedProj = couponTargetProject !== 'all' ? projects.find(p => p._id === couponTargetProject) : null;
      const body = {
        code: couponCode.trim().toUpperCase(),
        discountType: couponType,
        discountValue: Number(couponValue),
        expiryDate: couponExpiry,
        targetProject: selectedProj ? selectedProj._id : null,
        targetProjectTitle: selectedProj ? selectedProj.title : 'All Projects',
      };
      if (couponLimit && !isNaN(couponLimit)) {
        body.usageLimit = Number(couponLimit);
      }

      const data = await request('/coupons', 'POST', body);
      if (data.success) {
        const created = data.coupon || body;
        const discountLabel = `${created.discountValue}${created.discountType === 'percentage' ? '%' : ' INR'} OFF`;
        setCouponNotification({
          type: 'success',
          code: created.code,
          title: `🎉 Coupon Code "${created.code}" Created Successfully!`,
          details: `Flat ${discountLabel} applied on ${created.targetProjectTitle || 'All Projects'} • Valid until ${new Date(created.expiryDate).toLocaleDateString()}`,
        });
        setCouponCode('');
        setCouponValue('');
        setCouponExpiry('');
        setCouponLimit('');
        setCouponTargetProject('all');
        await fetchCoupons();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
          setCouponNotification(null);
        }, 8000);
      }
    } catch (error) {
      setCouponNotification({
        type: 'error',
        title: '❌ Coupon Creation Failed',
        details: error.message || 'Could not save coupon to database.',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Delete coupon code?')) return;
    try {
      const data = await request(`/coupons/${couponId}`, 'DELETE');
      if (data.success) {
        setCoupons(coupons.filter((c) => c._id !== couponId));
      }
    } catch (error) {
      alert(error.message || 'Delete failed');
    }
  };

  // Generate Custom SVG chart dimensions
  const chartHeight = 160;
  const chartWidth = 600;
  const safeMonthlySales = Array.isArray(monthlySales) ? monthlySales : [];
  const maxRevenue = safeMonthlySales.length > 0
    ? safeMonthlySales.reduce((max, s) => Math.max(max, Number(s?.revenue) || 0), 100)
    : 100;

  return (
    <div className="container animate-fade-in" style={{ padding: '32px 20px 80px 20px', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Floating Notification Banner (Coupons & Flash Sale) */}
      {couponNotification && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: '20px',
            background: couponNotification.type === 'error'
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)'
              : couponNotification.type === 'flashSale'
              ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.95) 0%, rgba(249, 115, 22, 0.95) 50%, rgba(234, 179, 8, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: couponNotification.type === 'error'
              ? '0 8px 30px rgba(239, 68, 68, 0.4)'
              : couponNotification.type === 'flashSale'
              ? '0 8px 30px rgba(244, 63, 94, 0.45)'
              : '0 8px 30px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {couponNotification.type === 'flashSale' ? (
                <Flame size={22} color="#ffffff" />
              ) : (
                <Ticket size={20} color="#ffffff" />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>
                  {couponNotification.title}
                </strong>
                {couponNotification.code && (
                  <span
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    CODE: {couponNotification.code}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '3px', display: 'block' }}>
                {couponNotification.details}
              </span>
            </div>
          </div>

          <button
            onClick={() => setCouponNotification(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 'bold',
              flexShrink: 0,
              transition: 'background 0.2s ease',
            }}
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Title & Quick Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Administration Command Center
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Live store analytics, orders verification, custom projects & platform controls.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              fetchDashboardStats();
              fetchProjects();
              fetchOrders();
              fetchCustomProjects();
              fetchCoupons();
            }}
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Sync All Data</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-danger"
            style={{ fontSize: '13px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Sign Out of Admin Command Center"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Modern Horizontal Scrolling Tabs Bar */}
      <div
        className="category-scroll-container"
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '14px',
          marginBottom: '28px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'analytics', label: 'Overview & Stats', icon: <LayoutDashboard size={15} /> },
          { id: 'customProjects', label: 'Custom Requests (₹50) 💼', icon: <Code size={15} style={{ color: '#06b6d4' }} /> },
          { id: 'orders', label: 'Orders & UTR', icon: <ShoppingCart size={15} /> },
          { id: 'products', label: 'Products Catalog', icon: <FolderOpen size={15} /> },
          { id: 'coupons', label: 'Discount Coupons', icon: <Ticket size={15} /> },
          { id: 'flashSale', label: 'Flash Sale ⚡', icon: <Flame size={15} style={{ color: '#f43f5e' }} /> },
          { id: 'reviews', label: 'Customer Reviews', icon: <Star size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              borderRadius: '20px',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' : 'var(--bg-secondary)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              border: activeTab === tab.id ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border)',
              boxShadow: activeTab === tab.id ? '0 2px 10px rgba(79, 70, 229, 0.35)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.icon} <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Analytics stats tab */}
      {activeTab === 'analytics' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Numeric Metric cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px'
          }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '12px' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Revenue</span>
                <strong style={{ display: 'block', fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>INR {stats.totalRevenue}</strong>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderRadius: '12px' }}>
                <ShoppingCart size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Sales Orders</span>
                <strong style={{ display: 'block', fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats.totalOrders}</strong>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderRadius: '12px' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registered Buyers</span>
                <strong style={{ display: 'block', fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats.totalUsers}</strong>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', borderRadius: '12px' }}>
                <Layers size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Catalog Items</span>
                <strong style={{ display: 'block', fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{stats.totalProjects}</strong>
              </div>
            </div>
          </div>

          {/* Monthly Sales Revenue Chart (Custom SVG Line) */}
          {monthlySales.length > 0 && (
            <div className="glass-card">
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} /> Monthly Sales Revenue Trend
              </h3>
              
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ width: '100%', minWidth: '550px' }}>
                  {/* Defs for gradient (at the top of SVG for older browsers / Safari support) */}
                  <defs>
                    <linearGradient id="gradient-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                    <line
                      key={i}
                      x1="40"
                      y1={chartHeight - r * chartHeight + 10}
                      x2={chartWidth - 20}
                      y2={chartHeight - r * chartHeight + 10}
                      stroke="var(--border)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Draw Revenue Line */}
                  <path
                    d={monthlySales
                      .map((val, idx) => {
                        const x = 50 + (idx * (chartWidth - 100)) / (monthlySales.length - 1 || 1);
                        const y = chartHeight - (val.revenue / maxRevenue) * chartHeight + 10;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Glow Area under path */}
                  <path
                    d={`${monthlySales
                      .map((val, idx) => {
                        const x = 50 + (idx * (chartWidth - 100)) / (monthlySales.length - 1 || 1);
                        const y = chartHeight - (val.revenue / maxRevenue) * chartHeight + 10;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')} L ${50 + (monthlySales.length - 1) * ((chartWidth - 100) / (monthlySales.length - 1 || 1))} ${chartHeight + 10} L 50 ${chartHeight + 10} Z`}
                    fill="linear-gradient(to bottom, rgba(99, 102, 241, 0.2), transparent)"
                    style={{ fill: 'url(#gradient-glow)' }}
                  />

                  {/* Graph node dots */}
                  {monthlySales.map((val, idx) => {
                    const x = 50 + (idx * (chartWidth - 100)) / (monthlySales.length - 1 || 1);
                    const y = chartHeight - (val.revenue / maxRevenue) * chartHeight + 10;
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="5" fill="var(--secondary)" stroke="white" strokeWidth="1.5" />
                        <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="var(--text-primary)" fontWeight="bold">
                          ₹{val.revenue}
                        </text>
                        {/* Month Labels */}
                        <text x={x} y={chartHeight + 25} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">
                          {val.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Tables layout (top selling / recent orders) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Top Projects */}
            <div className="glass-card">
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                Best Selling Products
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 4px' }}>Project Title</th>
                      <th style={{ padding: '10px 4px' }}>Price</th>
                      <th style={{ padding: '10px 4px' }}>Downloads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProjects.map((p, idx) => (
                      <tr key={p._id || p.id || ('top-' + idx)} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 4px', color: 'var(--text-primary)', fontWeight: 600 }}>{p.title}</td>
                        <td style={{ padding: '10px 4px' }}>INR {p.price}</td>
                        <td style={{ padding: '10px 4px', color: 'var(--accent)' }}>{p.downloadCount} dl</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="glass-card">
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                Recent Order Placements
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 4px' }}>Customer</th>
                      <th style={{ padding: '10px 4px' }}>Amount</th>
                      <th style={{ padding: '10px 4px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o, idx) => (
                      <tr key={o._id || o.id || ('order-' + idx)} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 4px', color: 'var(--text-primary)' }}>{o.user?.email || 'N/A'}</td>
                        <td style={{ padding: '10px 4px' }}>INR {o.totalAmount}</td>
                        <td style={{ padding: '10px 4px' }}>
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {o.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Manage Products Tab */}
      {activeTab === 'products' && (
        <div className="responsive-admin-grid" style={{
          alignItems: 'flex-start'
        }}>
          {/* Left: Products catalog table list */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              Current Catalog ({projects.length} Items)
            </h3>
            {productsLoading ? (
              <Loader />
            ) : projects.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>Catalog is empty. Upload a project using the right sidebar!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 8px' }}>Project Info</th>
                      <th style={{ padding: '12px 8px' }}>Category</th>
                      <th style={{ padding: '12px 8px' }}>Price</th>
                      <th style={{ padding: '12px 8px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj, idx) => (
                      <tr key={proj._id || proj.id || ('proj-' + idx)} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{proj.title}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>File: {proj.fileName} ({proj.fileSize})</span>
                        </td>
                        <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{proj.category}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>INR {proj.price}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <button
                            onClick={() => handleStartEdit(proj)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: '10px' }}
                            title="Edit Project"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj._id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                            title="Delete Project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Sidebar: Upload Product Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              {editingProject ? (
                <>
                  <Edit2 size={18} style={{ color: 'var(--primary)' }} /> Edit Project Details
                </>
              ) : (
                <>
                  <PlusCircle size={18} style={{ color: 'var(--primary)' }} /> Upload New Project
                </>
              )}
            </h3>
            
            {formSuccess && <div style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>{formSuccess}</div>}
            {formError && <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>{formError}</div>}

            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="E.g., Chatbot UI Source Code"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</label>
                <textarea
                  required
                  rows="3"
                  className="form-input"
                  placeholder="Detail the project highlights..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Selling Price (INR) *</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    placeholder="299"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Original MRP (Cut-Price)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 499 (Optional)"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Category *</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="source-code">Source Code</option>
                    <option value="templates">Templates</option>
                    <option value="pdfs">PDF / eBook</option>
                    <option value="graphics">Graphics</option>
                    <option value="datasets">Datasets</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tech Stack (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="React, Node.js, Mongoose"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Preview Image URLs (one per line)</label>
                <textarea
                  rows="2"
                  className="form-input"
                  placeholder="https://image-url.com/preview.png"
                  value={previewUrls}
                  onChange={(e) => setPreviewUrls(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Payee UPI ID (Optional - defaults to global merchant UPI)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., username@paytm or 1234567890@apl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Google Drive / Download Link (ZIP, Source Code, PDF) *
                </label>
                <input
                  type="url"
                  required
                  className="form-input"
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  value={externalDownloadUrl}
                  onChange={(e) => setExternalDownloadUrl(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Paste Google Drive, Dropbox, GitHub Releases, or Cloud storage share link.
                </span>
              </div>

              <button type="submit" disabled={formLoading} className="btn btn-primary" style={{ padding: '12px', width: '100%', marginTop: '10px' }}>
                {formLoading ? 'Saving...' : editingProject ? 'Save Changes' : 'Publish Product'}
              </button>
              {editingProject && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                  style={{ padding: '10px', width: '100%', marginTop: '8px' }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="responsive-admin-grid" style={{
          alignItems: 'flex-start'
        }}>
          {/* Left coupons list table */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              Active Coupon Codes
            </h3>
            {coupons.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No promo coupons configured yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 8px' }}>Coupon Code</th>
                      <th style={{ padding: '12px 8px' }}>Applicable On</th>
                      <th style={{ padding: '12px 8px' }}>Discount Value</th>
                      <th style={{ padding: '12px 8px' }}>Expiry Date</th>
                      <th style={{ padding: '12px 8px' }}>Used Count</th>
                      <th style={{ padding: '12px 8px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c, idx) => (
                      <tr key={c._id || c.id || ('coup-' + idx)} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 8px', color: 'var(--primary)', fontWeight: 'bold' }}>{c.code}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontSize: '11.5px', color: c.targetProjectTitle && c.targetProjectTitle !== 'All Projects' ? '#818cf8' : 'var(--text-secondary)', fontWeight: 600 }}>
                            {c.targetProjectTitle || 'All Projects'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                          {c.discountValue}{c.discountType === 'percentage' ? '%' : ' INR'} Off
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontWeight: 600 }}>{new Date(c.expiryDate).toLocaleDateString()}</span>
                            {(() => {
                              const rem = getRemainingTime(c.expiryDate);
                              return (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    color: rem.isExpired ? '#f87171' : '#10b981',
                                  }}
                                >
                                  <Clock size={11} /> {rem.text}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'times'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <button
                            onClick={() => handleDeleteCoupon(c._id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Create Coupon Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <Ticket size={18} style={{ color: 'var(--primary)' }} /> Create Promo Coupon
            </h3>

            <form onSubmit={handleCreateCouponSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="WELCOME50"
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  🎯 Applicable Target Project *
                </label>
                <select
                  className="form-input"
                  value={couponTargetProject}
                  onChange={(e) => setCouponTargetProject(e.target.value)}
                >
                  <option value="all">🌟 All Projects (Storewide Global Coupon)</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      📦 Only on: {p.title} (INR {p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Type</label>
                  <select
                    className="form-input"
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value)}
                  >
                    <option value="percentage">Percent (%)</option>
                    <option value="fixed">Fixed (INR)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Value</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    className="form-input"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Expiry Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={couponExpiry}
                  onChange={(e) => setCouponExpiry(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Usage Limit (Optional)</label>
                <input
                  type="number"
                  placeholder="Leave blank for unlimited"
                  className="form-input"
                  value={couponLimit}
                  onChange={(e) => setCouponLimit(e.target.value)}
                />
              </div>

              <button type="submit" disabled={couponLoading} className="btn btn-primary" style={{ padding: '12px', width: '100%', marginTop: '10px' }}>
                Create Coupon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Flash Sale & Promo Manager Tab */}
      {activeTab === 'flashSale' && (
        <div className="responsive-admin-grid" style={{ alignItems: 'flex-start' }}>
          
          {/* Flash Sale Configuration Form */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '17px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} style={{ color: '#f43f5e' }} /> Flash Sale & Deal of the Day Controls
              </h3>
              
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggleFlashSale(!flashSaleConfig.isActive)}
                style={{
                  background: flashSaleConfig.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${flashSaleConfig.isActive ? '#10b981' : '#f87171'}`,
                  color: flashSaleConfig.isActive ? '#10b981' : '#f87171',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>●</span>
                <span>{flashSaleConfig.isActive ? 'Flash Sale LIVE' : 'Flash Sale OFF'}</span>
              </button>
            </div>

            {flashSaleMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', fontSize: '13px', marginBottom: '16px' }}>
                {flashSaleMsg}
              </div>
            )}

            {flashSaleError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                {flashSaleError}
              </div>
            )}

            <form onSubmit={handleFlashSaleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  🎯 Target Project for Flash Deal *
                </label>
                <select
                  className="form-input"
                  value={flashSaleConfig.targetProject || 'all'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') {
                      setFlashSaleConfig({
                        ...flashSaleConfig,
                        targetProject: null,
                        targetProjectTitle: 'All Projects',
                        title: `Get Flat ${flashSaleConfig.discountPercentage || 35}% OFF on all Full-Stack & Developer Templates!`,
                      });
                    } else {
                      const selected = projects.find((p) => p._id === val);
                      setFlashSaleConfig({
                        ...flashSaleConfig,
                        targetProject: val,
                        targetProjectTitle: selected?.title || 'Selected Project',
                        title: selected ? `Deal of the Day: Flat ${flashSaleConfig.discountPercentage || 35}% OFF on ${selected.title}!` : flashSaleConfig.title,
                      });
                    }
                  }}
                >
                  <option value="all">🌟 All Projects (Storewide Global Deal)</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      📦 Only on: {p.title} (INR {p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Banner Headline *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="E.g., Get Flat 35% OFF on all Full-Stack & Developer Templates!"
                  value={flashSaleConfig.title}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  Banner Subtitle / Instructions
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Use coupon code at checkout for instant discount across the entire catalog."
                  value={flashSaleConfig.subtitle}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, subtitle: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Promo Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                    className="form-input"
                    placeholder="FLASH35"
                    value={flashSaleConfig.promoCode}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, promoCode: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                    Discount Percentage (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    className="form-input"
                    placeholder="35"
                    value={flashSaleConfig.discountPercentage}
                    onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, discountPercentage: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Sale Expiration Date & Time *
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setFlashSaleDurationHours(12)}
                      style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                      +12h
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlashSaleDurationHours(24)}
                      style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                      +24h
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlashSaleDurationHours(72)}
                      style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                      +3d
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlashSaleDurationHours(168)}
                      style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                      +7d
                    </button>
                  </div>
                </div>

                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={flashSaleConfig.endTime}
                  onChange={(e) => setFlashSaleConfig({ ...flashSaleConfig, endTime: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={flashSaleLoading}
                  className="btn btn-primary"
                  style={{ padding: '14px', flex: 1, fontSize: '14px', fontWeight: 700 }}
                >
                  {flashSaleLoading ? 'Saving Settings...' : '⚡ Save & Broadcast Live'}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteFlashSale}
                  disabled={flashSaleLoading}
                  style={{
                    padding: '14px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #f87171',
                    color: '#f87171',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  title="Permanently remove flash sale and deactivate promo coupon"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Preview Box */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>
                👁️ Visitor Live Banner Preview
              </h3>
              {flashSaleConfig.promoCode && (
                <button
                  type="button"
                  onClick={handleDeleteFlashSale}
                  disabled={flashSaleLoading}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Delete this Flash Deal immediately"
                >
                  <Trash2 size={13} />
                  <span>Delete Deal</span>
                </button>
              )}
            </div>
            
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              This is how the Flash Deal countdown banner will appear on the Homepage and Projects catalog:
            </p>

            {flashSaleConfig.promoCode ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.18) 0%, rgba(244, 63, 94, 0.15) 50%, rgba(245, 158, 11, 0.15) 100%)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f43f5e 0%, #ea580c 100%)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Flame size={13} />
                      <span>FLASH DEAL</span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: flashSaleConfig.isActive ? '#10b981' : '#f87171', fontWeight: 700 }}>
                      {flashSaleConfig.isActive ? '● Live on Store' : '● Inactive (Hidden)'}
                    </span>
                  </div>

                  {/* Direct 1-Click Delete Icon in Card */}
                  <button
                    type="button"
                    onClick={handleDeleteFlashSale}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #f87171',
                      color: '#f87171',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Delete this Flash Deal"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>

                <div>
                  {flashSaleConfig.targetProjectTitle && flashSaleConfig.targetProjectTitle !== 'All Projects' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, marginBottom: '6px' }}>
                      <span>🎯 Targeted Item: {flashSaleConfig.targetProjectTitle}</span>
                    </div>
                  )}
                  <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 4px 0', fontWeight: 700 }}>
                    {flashSaleConfig.title || 'Get Flat 35% OFF on all Full-Stack & Developer Templates!'}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    {flashSaleConfig.subtitle || 'Use coupon code at checkout for instant discount across the entire catalog.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '6px', border: '1px dashed #f43f5e' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#f43f5e' }}>
                      {flashSaleConfig.promoCode}
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                      {flashSaleConfig.discountPercentage || 35}% OFF
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#f43f5e', fontWeight: 700 }}>
                    <Clock size={13} />
                    <span>{getRemainingTime(flashSaleConfig.endTime).text}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '16px',
                  padding: '30px 20px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '14px' }}>
                  No active Flash Deal banner configured right now.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFlashSaleConfig({
                      isActive: true,
                      title: 'Get Flat 35% OFF on all Full-Stack & Developer Templates!',
                      subtitle: 'Use coupon code at checkout for instant discount across the entire catalog.',
                      promoCode: 'FLASH35',
                      discountPercentage: 35,
                      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                    });
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12.5px', padding: '8px 16px' }}
                >
                  ⚡ Populate New 35% Flash Deal Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Transactions List Tab */}
      {activeTab === 'orders' && (
        <div className="glass-card">
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>
              Checkout Transactions Log
            </h3>
          </div>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No customer checkouts recorded yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 8px' }}>Transaction Date</th>
                    <th style={{ padding: '12px 8px' }}>User Details</th>
                    <th style={{ padding: '12px 8px' }}>Purchased Catalog Item(s)</th>
                    <th style={{ padding: '12px 8px' }}>Paid Total</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, idx) => (
                    <tr key={o._id || o.id || ('order-row-' + idx)} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{o.user?.name || 'N/A'}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{o.user?.email || 'N/A'}</span>
                        {o.paymentMethod === 'qr_code' && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 10px',
                            borderRadius: '4px',
                            background: 'var(--bg-tertiary)',
                            border: '1px dashed var(--border-hover)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            lineHeight: '1.5'
                          }}>
                            <span style={{ display: 'block', fontWeight: '600', color: 'var(--primary)', letterSpacing: '0.02em' }}>
                              UTR {o.transactionRef}
                            </span>
                            <span style={{ display: 'block', color: 'var(--text-secondary)' }}>
                              {o.contactEmail || 'N/A'}
                            </span>
                            <span style={{ display: 'block', color: 'var(--text-secondary)' }}>
                              {o.contactPhone || 'N/A'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <ul style={{ paddingLeft: '16px', margin: 0 }}>
                          {o.items?.map((item, idx) => (
                            <li key={idx} style={{ color: 'var(--text-secondary)' }}>
                              {item.titleAtPurchase} (INR {item.priceAtPurchase})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>INR {o.totalAmount}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {o.paymentStatus === 'pending_verification' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ color: 'var(--warning)', fontWeight: 'bold', fontSize: '11px' }}>
                              PENDING VERIFICATION
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleApproveUtr(o._id)}
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectUtr(o._id)}
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '4px' }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            color: o.paymentStatus === 'paid' ? 'var(--success)' : o.paymentStatus === 'pending' ? 'var(--warning)' : 'var(--error)'
                          }}>
                            {o.paymentStatus === 'paid' ? <CheckCircle size={12} /> : null}
                            {o.paymentStatus.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedInvoice({
                              orderId: o._id,
                              purchasedAt: o.createdAt,
                              pricePaid: o.totalAmount,
                              titleAtPurchase: o.items?.[0]?.titleAtPurchase || 'Software Asset',
                              project: {
                                title: o.items?.[0]?.titleAtPurchase || 'Software Asset',
                                category: 'Source Code & Architecture'
                              },
                              licenseType: 'Verified Commercial License',
                              user: o.user || { name: o.contactEmail || 'Customer', email: o.contactEmail }
                            })}
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#10b981',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600
                            }}
                            title="View & Download Official Tax Invoice (PDF)"
                          >
                            <FileText size={13} />
                            <span>Invoice</span>
                          </button>

                          <button
                            onClick={() => handleDeleteOrder(o._id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                            title="Delete Transaction Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Custom Projects Commission Inquiries Tab */}
      {activeTab === 'customProjects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Settings & Configuration Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={20} style={{ color: '#06b6d4' }} />
                  <span>Custom Project Commissions & ₹50 Fee Controls</span>
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Manage client custom development requests, toggle the submission form ON/OFF, and configure the entry fee.
                </p>
              </div>

              {/* Instant ON / OFF Toggle Button */}
              <button
                onClick={() => handleToggleCustomProjects(!customSettings.isEnabled)}
                className="btn"
                style={{
                  background: customSettings.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: `1px solid ${customSettings.isEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                  color: customSettings.isEnabled ? '#10b981' : '#f43f5e',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  padding: '8px 18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                }}
              >
                {customSettings.isEnabled ? (
                  <>
                    <ToggleRight size={20} />
                    <span>STATUS: ACTIVE (ACCEPTING CLIENTS)</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft size={20} />
                    <span>STATUS: PAUSED (FORM CLOSED)</span>
                  </>
                )}
              </button>
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSaveCustomSettings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Entry / Requirements Processing Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={customSettings.entryFee}
                  onChange={(e) => setCustomSettings({ ...customSettings, entryFee: Number(e.target.value) })}
                  className="form-input"
                  style={{ fontWeight: 700, fontSize: '14px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Admin UPI ID for Fee
                </label>
                <input
                  type="text"
                  value={customSettings.upiId}
                  onChange={(e) => setCustomSettings({ ...customSettings, upiId: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Closed / Pause Notice Message
                </label>
                <input
                  type="text"
                  value={customSettings.notice}
                  onChange={(e) => setCustomSettings({ ...customSettings, notice: e.target.value })}
                  placeholder="e.g. Currently booked for 2 weeks."
                  className="form-input"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="btn btn-primary"
                  style={{ padding: '11px 20px', width: '100%', fontSize: '13px' }}
                >
                  {updatingSettings ? 'Saving Settings...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Submissions List */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', margin: 0 }}>
                Client Custom Project Submissions ({customProjects.length})
              </h3>
              <button
                onClick={fetchCustomProjects}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={customProjectsLoading ? 'animate-spin' : ''} />
                <span>Refresh Requests</span>
              </button>
            </div>

            {customProjectsLoading ? (
              <Loader />
            ) : customProjects.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>
                No custom project inquiries submitted yet. When clients submit, their requirements & ₹50 fee details will appear here with instant Telegram alerts.
              </p>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 8px' }}>Date</th>
                      <th style={{ padding: '12px 8px' }}>Client Info & WhatsApp</th>
                      <th style={{ padding: '12px 8px' }}>Project Title & Scope</th>
                      <th style={{ padding: '12px 8px' }}>Budget & Payout UPI</th>
                      <th style={{ padding: '12px 8px' }}>₹50 Fee UTR</th>
                      <th style={{ padding: '12px 8px' }}>Stage</th>
                      <th style={{ padding: '12px 8px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customProjects.map((p, idx) => (
                      <tr key={p._id || p.id || ('cust-' + idx)} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{p.name}</strong>
                          <a href={`mailto:${p.email}`} style={{ fontSize: '11.5px', color: 'var(--primary)', textDecoration: 'none', display: 'block' }}>
                            {p.email}
                          </a>
                          <a
                            href={`https://wa.me/91${p.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(p.name)},%20I%20reviewed%20your%20custom%20project%20submission%20for%20${encodeURIComponent(p.title)}%20on%20ApexMarket.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginTop: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#10b981',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <MessageCircle size={12} />
                            <span>WhatsApp Client</span>
                          </a>
                        </td>

                        <td style={{ padding: '12px 8px', maxWidth: '280px' }}>
                          <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '13.5px' }}>{p.title}</strong>
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                            {p.category} • Stack: {p.techStack}
                          </span>
                          <details style={{ marginTop: '6px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--primary)' }}>
                            <summary style={{ fontWeight: 600 }}>View Full Requirements</summary>
                            <div style={{ marginTop: '6px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {p.description}
                              {p.referenceLinks && (
                                <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                                  <a
                                    href={p.referenceLinks}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: 'rgba(6, 182, 212, 0.12)',
                                      border: '1px solid rgba(6, 182, 212, 0.3)',
                                      color: '#06b6d4',
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <ExternalLink size={12} />
                                    <span>Open Drive / GitHub Link</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </details>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <strong style={{ color: '#10b981', display: 'block', fontSize: '14px' }}>₹{p.targetBudget || 'Negotiable'}</strong>
                          <div style={{ marginTop: '6px', fontSize: '11.5px', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '4px 6px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '10.5px', display: 'block' }}>💸 Payout UPI:</span>
                            <strong style={{ color: '#818cf8', wordBreak: 'break-all' }}>{p.payoutUpiId || p.clientUpiId || 'N/A'}</strong>
                          </div>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>₹50 Fee UTR:</span>
                          <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                            {p.utrNumber}
                          </code>
                          <select
                            value={p.paymentStatus || 'pending_verification'}
                            onChange={(e) => handleUpdateCustomProjectStatus(p._id, null, e.target.value)}
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: p.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: p.paymentStatus === 'paid' ? '#10b981' : '#f59e0b',
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                          >
                            <option value="pending_verification">⏳ Pending Check</option>
                            <option value="paid">✓ Paid (₹{p.entryFee || 50})</option>
                            <option value="rejected">✗ Rejected</option>
                          </select>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <select
                            value={p.status || 'pending'}
                            onChange={(e) => handleUpdateCustomProjectStatus(p._id, e.target.value, null)}
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '11.5px', cursor: 'pointer' }}
                          >
                            <option value="pending">🟡 New Inquiry</option>
                            <option value="contacted">💬 Contacted</option>
                            <option value="accepted">🟢 Accepted</option>
                            <option value="in_progress">⚡ In Progress</option>
                            <option value="completed">🎉 Completed</option>
                            <option value="rejected">🔴 Declined</option>
                          </select>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <button
                            onClick={() => handleDeleteCustomProject(p._id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                            title="Delete Request"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            Customer Reviews Log
          </h3>
          {allReviewsLoading ? (
            <Loader />
          ) : allReviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No customer reviews recorded yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 8px' }}>Project Info</th>
                    <th style={{ padding: '12px 8px' }}>User Details</th>
                    <th style={{ padding: '12px 8px' }}>Rating & Comment</th>
                    <th style={{ padding: '12px 8px' }}>Review Date</th>
                    <th style={{ padding: '12px 8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allReviews.map((rev, idx) => (
                    <tr key={rev._id || rev.id || ('rev-' + idx)} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{rev.project?.title || 'Unknown Project'}</strong>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{rev.user?.name || 'Customer'}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rev.user?.email || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '12px 8px', maxWidth: '300px' }}>
                        <div style={{ display: 'flex', color: '#fbbf24', marginBottom: '4px', gap: '2px' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < rev.rating ? '#fbbf24' : 'none'}
                              stroke="#fbbf24"
                            />
                          ))}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{rev.comment}</p>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{new Date(rev.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                          title="Delete Review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Official Tax Invoice & PDF Receipt Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          user={selectedInvoice.user || { name: 'Customer', email: 'verified@customer.com' }}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
};

export default AdminDashboard;
