import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id } = await params;
    const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!product) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
