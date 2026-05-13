import mongoose from 'mongoose';

const OutgoingSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  recipient: { type: String, default: '' },
  reference: { type: String, default: '' },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, default: '' },
  purpose: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Outgoing || mongoose.model('Outgoing', OutgoingSchema);
