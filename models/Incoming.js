import mongoose from 'mongoose';

const IncomingSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  supplier: { type: String, default: '' },
  invoiceRef: { type: String, default: '' },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, default: '' },
  unitPrice: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Incoming || mongoose.model('Incoming', IncomingSchema);
