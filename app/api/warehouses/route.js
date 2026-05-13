import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';

export async function GET() {
  try {
    await dbConnect();
    const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(warehouses);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const warehouse = new Warehouse(body);
    await warehouse.save();
    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
