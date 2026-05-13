import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse');
    if (!warehouse) return NextResponse.json([], { status: 200 });

    const products = await Product.find({ isActive: true, warehouse }).sort({ name: 1 });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    if (!body.name || !body.category || !body.warehouse) {
      return NextResponse.json({ error: 'الاسم والفئة والمخزن حقول مطلوبة' }, { status: 400 });
    }
    
    if (body.currentStock < 0 || body.minStock < 0) {
      return NextResponse.json({ error: 'الكميات لا يمكن أن تكون سالبة' }, { status: 400 });
    }

    const product = new Product(body);
    await product.save();
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
