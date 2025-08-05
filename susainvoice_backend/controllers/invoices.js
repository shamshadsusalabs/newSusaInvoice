import Invoice from "../models/invoices.js";

// CREATE Invoice
export const createInvoice = async (req, res) => {
  try {
    const newInvoice = new Invoice(req.body);
    await newInvoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE invoice by ID
export const updateInvoiceById = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedInvoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE invoice by ID
export const deleteInvoiceById = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET next invoice number
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
    const nextInvoiceNumber = lastInvoice?.invoiceNumber ? lastInvoice.invoiceNumber + 1 : 2500;
    res.json({ nextInvoiceNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET unique billTo records by GSTIN
export const getBillToList = async (req, res) => {
  try {
    const allBillTo = await Invoice.find({}, 'billTo');
    const uniqueGstin = new Set();
    const filteredBillTo = [];

    allBillTo.forEach(doc => {
      if (!uniqueGstin.has(doc.billTo.gstin)) {
        uniqueGstin.add(doc.billTo.gstin);
        filteredBillTo.push(doc.billTo);
      }
    });

    if (filteredBillTo.length === 0) {
      return res.status(404).json({ message: 'No records found' });
    }

    res.json(filteredBillTo);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

// SEARCH invoices by GSTIN, name or address
export const searchInvoicesByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    const query = {
      $or: [
        { "billTo.gstin": identifier },
        { "billTo.name": { $regex: new RegExp(identifier, "i") } },
        { "billTo.address": { $regex: new RegExp(identifier, "i") } },
      ],
    };

    const invoices = await Invoice.find(query, { invoiceNumber: 1, date: 1, type: 1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const getInvoiceSummaryByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    const invoices = await Invoice.find({ companyId }).select('Date type invoiceNumber');

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found for this company' });
    }

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};