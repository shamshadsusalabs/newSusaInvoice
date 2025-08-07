import Invoice from "../models/invoices.js";

// ============= NEW RENTAL INVOICE SYSTEM =============

// Helper function to generate next invoice number in format INV-2500, INV-2501
const generateNextInvoiceNumber = async () => {
  try {
    // Find the last invoice with INV- prefix
    const lastInvoice = await Invoice.findOne({
      invoiceNumber: { $regex: /^INV-\d+$/ }
    }).sort({ invoiceNumber: -1 });
    
    if (!lastInvoice) {
      return 'INV-2500'; // Start from INV-2500
    }
    
    // Extract number from INV-2500 format
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
    const nextNumber = lastNumber + 1;
    
    return `INV-${nextNumber}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return 'INV-2500'; // Fallback
  }
};

// CREATE New Invoice (Main function for all invoice types)
export const createInvoice = async (req, res) => {
  try {
    console.log('📦 Received payload:', JSON.stringify(req.body, null, 2));
    
    // Generate next invoice number
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    
    // Calculate payment details properly
    const totalAmount = req.body.totalAmount || 0;
    const advanceAmount = parseFloat(req.body.paymentDetails?.advanceAmount || 0);
    const paidAmount = parseFloat(req.body.paymentDetails?.paidAmount || 0);
    
    // Calculate outstanding amount
    const outstandingAmount = totalAmount - advanceAmount - paidAmount;
    
    // Create invoice with generated number and calculated payment details
    const invoiceData = {
      ...req.body,
      invoiceNumber: nextInvoiceNumber,
      paymentDetails: {
        ...req.body.paymentDetails,
        totalRentAmount: totalAmount,
        advanceAmount: advanceAmount,
        paidAmount: paidAmount,
        outstandingAmount: outstandingAmount,
        refundAmount: req.body.paymentDetails?.refundAmount || 0,
        finalAmount: totalAmount
      }
    };
    
    console.log('🚀 Creating invoice with number:', nextInvoiceNumber);
    
    const newInvoice = new Invoice(invoiceData);
    const savedInvoice = await newInvoice.save();
    
    console.log('✅ Invoice created successfully:', savedInvoice._id);
    
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: savedInvoice,
      invoiceNumber: nextInvoiceNumber
    });
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.errors || 'Unknown error'
    });
  }
};

// GET all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE invoice by ID
export const updateInvoiceById = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE Rental Invoice with Partial Return Data
export const updateRentalInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Updating rental invoice:', id);
    console.log('📦 Update payload:', JSON.stringify(req.body, null, 2));
    
    // Find the existing invoice
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    // Calculate updated payment details
    const totalAmount = req.body.totalAmount || existingInvoice.totalAmount || 0;
    const originalAdvance = existingInvoice.paymentDetails?.advanceAmount || 0;
    const newPaidAmount = parseFloat(req.body.paymentDetails?.paidAmount || 0);
    
    // Calculate new outstanding amount
    const newOutstandingAmount = Math.max(0, totalAmount - originalAdvance - newPaidAmount);
    
    // Prepare update data with proper payment calculations
    const updateData = {
      ...req.body,
      paymentDetails: {
        ...existingInvoice.paymentDetails,
        ...req.body.paymentDetails,
        totalRentAmount: totalAmount,
        advanceAmount: originalAdvance, // Keep original advance
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount,
        finalAmount: totalAmount
      },
      // Update rental status based on invoice type
      rentalDetails: {
        ...existingInvoice.rentalDetails,
        ...req.body.rentalDetails,
        status: req.body.invoiceType === 'FULL' ? 'COMPLETED' : 'PARTIAL_RETURN'
      },
      // Add update timestamp
      lastUpdated: new Date()
    };
    
    console.log('💰 Payment calculation:', {
      totalAmount,
      originalAdvance,
      newPaidAmount,
      newOutstandingAmount
    });
    
    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log('✅ Rental invoice updated successfully:', updatedInvoice._id);
    
    res.json({
      success: true,
      message: 'Rental invoice updated successfully with partial return data',
      data: updatedInvoice
    });
    
  } catch (error) {
    console.error('❌ Error updating rental invoice:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.errors || 'Unknown error'
    });
  }
};

// DELETE invoice by ID
export const deleteInvoiceById = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    res.json({
      success: true,
      message: "Invoice deleted successfully",
      data: deletedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET next invoice number (for frontend preview)
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    res.json({
      success: true,
      nextInvoiceNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET unique billTo records by GSTIN
export const getBillToList = async (req, res) => {
  try {
    const allBillTo = await Invoice.find({}, 'billTo');
    const uniqueGstin = new Set();
    const filteredBillTo = [];

    allBillTo.forEach(doc => {
      if (doc.billTo?.gstin && !uniqueGstin.has(doc.billTo.gstin)) {
        uniqueGstin.add(doc.billTo.gstin);
        filteredBillTo.push(doc.billTo);
      }
    });

    if (filteredBillTo.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No records found' 
      });
    }

    res.json({
      success: true,
      count: filteredBillTo.length,
      data: filteredBillTo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
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

    const invoices = await Invoice.find(query, { 
      invoiceNumber: 1, 
      Date: 1, 
      type: 1, 
      invoiceType: 1,
      totalAmount: 1,
      billTo: 1
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// GET Invoice Summary by Company ID
export const getInvoiceSummaryByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    const invoices = await Invoice.find({ companyId }).sort({ createdAt: -1 });

    if (invoices.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No invoices found for this company' 
      });
    }

    // Calculate summary statistics
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
      advanceInvoices: invoices.filter(inv => inv.invoiceType === 'ADVANCE').length,
      partialInvoices: invoices.filter(inv => inv.invoiceType === 'PARTIAL').length,
      fullInvoices: invoices.filter(inv => inv.invoiceType === 'FULL').length
    };

    res.json({
      success: true,
      summary,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};