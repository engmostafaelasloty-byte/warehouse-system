import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Incoming from '@/models/Incoming';
import Outgoing from '@/models/Outgoing';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'incoming' | 'outgoing' | null
    const productId = searchParams.get('product');
    const warehouse = searchParams.get('warehouse');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const buildQuery = () => {
      const q = {};
      if (warehouse) q.warehouse = warehouse;
      if (productId) q.product = productId;
      if (from || to) {
        q.date = {};
        if (from) q.date.$gte = new Date(from);
        if (to) {
          const d = new Date(to);
          d.setHours(23, 59, 59, 999);
          q.date.$lte = d;
        }
      }
      return q;
    };

    let allRecords = [];

    if (!type || type === 'incoming') {
      const incs = await Incoming.find(buildQuery()).sort({ date: -1 }).populate('product', 'name unit').lean();
      allRecords.push(...incs.map(r => ({ ...r, type: 'وارد' })));
    }

    if (!type || type === 'outgoing') {
      const outs = await Outgoing.find(buildQuery()).sort({ date: -1 }).populate('product', 'name unit').lean();
      allRecords.push(...outs.map(r => ({ ...r, type: 'صادر' })));
    }

    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = allRecords.length;
    const paginated = allRecords.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ records: paginated, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
