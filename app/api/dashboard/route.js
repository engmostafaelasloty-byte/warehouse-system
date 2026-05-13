import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Product from '@/models/Product';
import Incoming from '@/models/Incoming';
import Outgoing from '@/models/Outgoing';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse');
    if (!warehouse) return NextResponse.json({ totalProducts: 0, lowStockProducts: [], todayIncoming: {total:0,count:0}, todayOutgoing: {total:0,count:0}, recentTransactions: [], monthlyData: [] });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProducts,
      lowStockProducts,
      todayIncoming,
      todayOutgoing,
      recentTransactions,
      monthlyData
    ] = await Promise.all([
      Product.countDocuments({ isActive: true, warehouse }),
      Product.find({ isActive: true, warehouse, $expr: { $lte: ['$currentStock', '$minStock'] } }).select('name currentStock minStock unit').limit(10),
      Incoming.aggregate([{ $match: { warehouse: new mongoose.Types.ObjectId(warehouse), date: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: '$quantity' }, count: { $sum: 1 } } }]),
      Outgoing.aggregate([{ $match: { warehouse: new mongoose.Types.ObjectId(warehouse), date: { $gte: today, $lt: tomorrow } } }, { $group: { _id: null, total: { $sum: '$quantity' }, count: { $sum: 1 } } }]),
      // Last 10 transactions combined
      Promise.all([
        Incoming.find({ warehouse }).sort({ date: -1 }).limit(5).lean(),
        Outgoing.find({ warehouse }).sort({ date: -1 }).limit(5).lean()
      ]),
      // Last 7 days chart data
      (async () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - i);
          const next = new Date(d);
          next.setDate(next.getDate() + 1);
          const [inc, out] = await Promise.all([
            Incoming.aggregate([{ $match: { warehouse: new mongoose.Types.ObjectId(warehouse), date: { $gte: d, $lt: next } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
            Outgoing.aggregate([{ $match: { warehouse: new mongoose.Types.ObjectId(warehouse), date: { $gte: d, $lt: next } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }])
          ]);
          days.push({ date: d.toISOString().split('T')[0], incoming: inc[0]?.total || 0, outgoing: out[0]?.total || 0 });
        }
        return days;
      })()
    ]);

    const allRecent = [
      ...recentTransactions[0].map(t => ({ ...t, type: 'وارد' })),
      ...recentTransactions[1].map(t => ({ ...t, type: 'صادر' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    return NextResponse.json({
      totalProducts,
      lowStockProducts,
      todayIncoming: todayIncoming[0] || { total: 0, count: 0 },
      todayOutgoing: todayOutgoing[0] || { total: 0, count: 0 },
      recentTransactions: allRecent,
      monthlyData
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
