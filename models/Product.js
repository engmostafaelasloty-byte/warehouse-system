import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  category: { type: String, required: true, trim: true },
  unit: { type: String, required: true, default: 'قطعة' },
  currentStock: { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 0 },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
