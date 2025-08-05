import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: Number, unique: true },
  Date: { type: String, required: false },
  dueDate: { type: String, required: false },
  poNumber: { type: String, required: false },
  poDate: { type: String, required: false },
  type:{ type: String, required: false },
   companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  billTo: {
    name: { type: String, required: false },
    address: { type: String, required: false },
    gstin: { type: String, required: false }
  },
  shipTo: {
    name: { type: String, required: false },
    address: { type: String, required: false }
  },
  items: [
    {
      description: { type: String, required: false },
      hsnCode: { type: String, default: "" },
      quantity: { type: Number, required: false },
      rate: { type: Number, required: false },
      amount: { type: Number, required: false },
      specification: { type: String, required: false }
    }
  ],
  subtotal: { type: Number, required: false },
  ugstRate: { type: Number, required: false }, // Add this new property
      ugstAmount: { type: Number, required: false },
  cgstRate: { type: Number, required: false },
  cgstAmount: { type: Number, required: false },
  sgstRate: { type: Number, required: false },
  sgstAmount: { type: Number, required: false },
  igstRate: { type: Number, required: false },
  igstAmount: { type: Number, required: false },
  totalTaxAmount: { type: Number, required: false },
  totalAmount: { type: Number, required: false },
  paymentTerms: { type: String, required: false },
  termsConditions: { type: String, required: false },
  bankDetails: {
    accountName: { type: String, required: false },
    accountNumber: { type: String, required: false },
    bankName: { type: String, required: false },
    ifscCode: { type: String, required: false }
  }
});



export default mongoose.model('Invoice', InvoiceSchema);
