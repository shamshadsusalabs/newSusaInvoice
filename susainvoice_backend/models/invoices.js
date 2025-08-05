// models/Invoice.ts
import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: Number, unique: true },
  Date: { type: String, required: false },
  dueDate: { type: String, required: false },
  poNumber: { type: String, required: false },
  poDate: { type: String, required: false },
  type: { type: String, required: false },

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
      productName:   { type: String, required: false },
      duration:      { type: Number, required: false },
      durationUnit:  { type: String, enum: ['hours', 'days'], default: 'hours' },
      hsnCode:       { type: String, default: "" },
      amount:        { type: Number, required: false }
    }
  ],

  subtotal:        { type: Number, required: false },
  ugstRate:        { type: Number, required: false },
  ugstAmount:      { type: Number, required: false },
  cgstRate:        { type: Number, required: false },
  cgstAmount:      { type: Number, required: false },
  sgstRate:        { type: Number, required: false },
  sgstAmount:      { type: Number, required: false },
  igstRate:        { type: Number, required: false },
  igstAmount:      { type: Number, required: false },
  totalTaxAmount:  { type: Number, required: false },
  totalAmount:     { type: Number, required: false },

  paymentTerms:    { type: String, required: false },
  termsConditions: { type: String, required: false },

  bankDetails: {
    accountName:  { type: String, required: false },
    accountNumber: { type: String, required: false },
    bankName:     { type: String, required: false },
    ifscCode:     { type: String, required: false }
  }
});

export default mongoose.model('Invoice', InvoiceSchema);