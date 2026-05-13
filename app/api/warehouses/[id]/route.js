import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id } = await params;
    const warehouse = await Warehouse.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!warehouse) return NextResponse.json({ error: 'المخزن غير موجود' }, { status: 404 });
    return NextResponse.json(warehouse);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const warehouse = await Warehouse.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!warehouse) return NextResponse.json({ error: 'المخزن غير موجود' }, { status: 404 });
    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
