import Order from '../models/Order.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

/**
 * @desc    Get system-wide sales and product analytics (Admin only)
 * @route   GET /api/analytics/dashboard
 * @access  Private/Admin
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    if (!isDbConnected()) {
      // Calculate mock stats
      const paidOrders = mockDb.orders.filter(o => o.paymentStatus === 'paid');
      const totalRevenue = paidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const totalOrders = paidOrders.length;
      const totalUsers = mockDb.users.filter(u => u.role === 'user').length;
      const totalProjects = mockDb.projects.length;

      // Mock Monthly Sales (Last 6 Months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlySales = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        // Find sales for this month in mock orders
        const monthOrders = paidOrders.filter(o => {
          const od = new Date(o.createdAt);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        const revenue = monthOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
        
        monthlySales.push({
          month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
          revenue: revenue || (i === 1 ? 598 : i === 0 ? totalRevenue || 299 : 0), // supply some dummy trend data so chart isn't empty
          orders: monthOrders.length || (i === 1 ? 2 : i === 0 ? 1 : 0)
        });
      }

      // Mock Category Distribution
      const catCount = {};
      paidOrders.forEach(o => {
        o.items.forEach(i => {
          const p = mockDb.projects.find(proj => proj._id === i.project);
          if (p) {
            catCount[p.category] = (catCount[p.category] || 0) + i.priceAtPurchase;
          }
        });
      });
      const categorySales = Object.keys(catCount).map(cat => ({
        _id: cat,
        revenue: catCount[cat],
        salesCount: 1
      }));

      // Top projects
      const topProjects = [...mockDb.projects]
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5)
        .map(p => ({
          _id: p._id,
          title: p.title,
          category: p.category,
          price: p.price,
          downloadCount: p.downloadCount,
          ratings: p.ratings
        }));

      // Recent orders populated with user names
      const recentOrders = paidOrders
        .slice(-5)
        .reverse()
        .map(o => {
          const u = mockDb.users.find(usr => usr._id === o.user);
          return {
            _id: o._id,
            user: u ? { name: u.name, email: u.email } : null,
            totalAmount: o.totalAmount,
            paymentStatus: o.paymentStatus,
            items: o.items,
            createdAt: o.createdAt
          };
        });

      return res.json({
        success: true,
        stats: {
          totalRevenue: totalRevenue || 897, // default sandbox presentation values if 0
          totalOrders: totalOrders || 3,
          totalUsers: totalUsers || 1,
          totalProjects: totalProjects || 10,
        },
        monthlySales,
        categorySales: categorySales.length ? categorySales : [{ _id: 'source-code', revenue: 598, salesCount: 2 }, { _id: 'templates', revenue: 299, salesCount: 1 }],
        topProjects,
        recentOrders: recentOrders.length ? recentOrders : [
          {
            _id: 'ord_mock_seed',
            user: { name: 'John Doe', email: 'user@marketplace.com' },
            totalAmount: 299,
            paymentStatus: 'paid',
            items: [{ titleAtPurchase: 'AWS Serverless Image Processor', priceAtPurchase: 299 }],
            createdAt: new Date()
          }
        ]
      });
    }

    // 1. Total Revenue
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // 2. Counts
    const totalOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProjects = await Project.countDocuments();

    // 3. Monthly Sales Analytics (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlySales = monthlySales.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue,
      orders: item.orders,
    }));

    // 4. Category-wise Sales Distribution
    const categorySales = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'projects',
          localField: 'items.project',
          foreignField: '_id',
          as: 'projectDetails',
        },
      },
      { $unwind: '$projectDetails' },
      {
        $group: {
          _id: '$projectDetails.category',
          salesCount: { $sum: 1 },
          revenue: { $sum: '$items.priceAtPurchase' },
        },
      },
    ]);

    // 5. Top 5 Best Selling Projects
    const topProjects = await Project.find()
      .sort({ downloadCount: -1 })
      .limit(5)
      .select('title category price downloadCount ratings');

    // 6. Recent Orders
    const recentOrders = await Order.find({ paymentStatus: 'paid' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProjects,
      },
      monthlySales: formattedMonthlySales,
      categorySales,
      topProjects,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
