import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Outgoing from '@/models/Outgoing';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const productId = searchParams.get('product');
    const warehouse = searchParams.get('warehouse');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const query = {};
    if (warehouse) query.warehouse = warehouse;
    if (productId) query.product = productId;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    const total = await Outgoing.countDocuments(query);
    const records = await Outgoing.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('product', 'name unit');

    return NextResponse.json({ records, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = await request.json();

    // Basic validation
    if (!body.product || !body.quantity || body.quantity <= 0) {
      throw new Error('بيانات غير صالحة: تأكد من اختيار المنتج والكمية (> 0)');
    }

    const product = await Product.findById(body.product).session(session);
    if (!product) throw new Error('المنتج غير موجود');
    if (!body.warehouse) throw new Error('يجب تحديد المخزن');
    
    if (product.currentStock < body.quantity) {
      throw new Error(`الكمية المطلوبة تتجاوز المتوفر (${product.currentStock} ${product.unit})`);
    }

    const outgoing = new Outgoing({ ...body, productName: product.name });
    await outgoing.save({ session });

    // Update stock
    product.currentStock -= Number(body.quantity);
    await product.save({ session });

    await session.commitTransaction();
    return NextResponse.json(outgoing, { status: 201 });
  } catch (error) {
    await session.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
