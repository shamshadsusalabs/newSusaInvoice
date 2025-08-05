// invoice-types.ts – replace entire file
export interface CompanyDetails {
  name: string
  address: string
  gstin: string
  pan: string
  phone: string
  email: string
  logo: string
  stamp: string
}

export interface InvoiceItem {
  productName: string
  duration: number
  durationUnit: 'hours' | 'days'
  hsnCode: string
  amount: number          // <-- you type this directly
}

export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  ifscCode: string
}

export interface InvoiceData {
  invoiceNumber: string
  Date: string
  dueDate: string
  poNumber: string
  billTo: { name: string; address: string; gstin: string }
  shipTo: { name: string; address: string }
  items: InvoiceItem[]
  subtotal: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  ugstRate: number
  ugstAmount: number
  igstRate: number
  igstAmount: number
  totalTaxAmount: number
  totalAmount: number
  paymentTerms: string
  termsConditions: string
  bankDetails: BankDetails
}