import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema);
