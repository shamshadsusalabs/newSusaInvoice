"use client"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import RentalHeader from "./rental-header"
import RentalForm from "./rental-form"
import RentalActions from "./rental-actions"
import type { RentalInvoiceData, CompanyDetails } from "./rental-types"
import logo from "../../assets/logo1.jpeg"
// import stamp from "../../assets/stamp.png"

export default function PartialReturn() {
  const { invoiceId: parentInvoiceId } = useParams<{ invoiceId: string }>()
  const [isEditingMode, setIsEditingMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // const [currentPDFType, setCurrentPDFType] = useState<'TAX' | 'PROFORMA' | null>(null)

  const [companyDetails] = useState<CompanyDetails>({
    name: "MAHIPAL SINGH TIMBER",
    address: "PLOT NO-25, GALI NO-E8, NEAR JAGAR CHOWK, RAM COLONY,, Faridabad, Faridabad, Haryana, 121004",
    gstin: ": 06BROPG0987J3ZA",
    // pan: "AAYCS5019E",
    phone: "+91 87000 77386",
    email: "Garvsingh1619@gmail.com",
    logo: logo,
    // stamp: stamp,
  })

  const [invoiceData, setInvoiceData] = useState<RentalInvoiceData>({
    invoiceNumber: "001",
    Date: new Date().toISOString().split("T")[0],
    dueDate: "",
    poNumber: "",
    billTo: {
      name: "",
      address: "",
      gstin: "",
    },
    shipTo: {
      name: "",
      address: "",
    },
    items: [
      {
        productName: '',
        duration: '',
        durationUnit: 'days',
        amount: '',
        rentedQuantity: '',
        returnedQuantity: '',
        dailyRate: '',
        totalDays: '',
        rentAmount: '',
        startDate: '',
        endDate: '',
        partialReturnDate: '',
      },
    ],
    subtotal: 0,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    ugstRate: 0,
    ugstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalTaxAmount: 0,
    totalAmount: 0,
    paymentTerms:
      "Net 30 Days from invoice date\nPayment via NEFT/RTGS/Cheque\nDelayed payments subject to 1.5% monthly interest",
    termsConditions:
      "Warranty provided by principal company only\nGoods once sold will not be taken back\nAll disputes subject to Delhi jurisdiction",
    bankDetails: {
      bankName: "Yes Bank Limited",
      accountName: "Your Business Pvt.Ltd",
      accountNumber: "038263400000072",
      ifscCode: "YESB0000382",
    },
    rentalDetails: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      totalDays: '',
      status: "ACTIVE",
    },
    paymentDetails: {
      totalRentAmount: 0,
      advanceAmount: '',
      paidAmount: 0,
      outstandingAmount: 0,
      refundAmount: 0,
      finalAmount: 0,
    },
    invoiceType: 'PARTIAL',
  })

  // Fetch parent invoice data
  const fetchParentInvoice = async () => {
    if (!parentInvoiceId) return
    
    try {
      
      const response = await axios.get(
        `https://newsusainvoice.onrender.com/api/invoice/rental/details/${parentInvoiceId}`
      )
      
      if (response.data.success) {
        const parent = response.data.data
        
        // Populate all fields with parent invoice data
        setInvoiceData({
          invoiceNumber: `PARTIAL-${parent.invoiceNumber}`,
          Date: new Date().toISOString().split("T")[0],
          dueDate: parent.dueDate || "",
          poNumber: parent.poNumber || "",
          billTo: parent.billTo,
          shipTo: parent.shipTo,
          items: parent.items.map((item: any) => ({
            ...item,
            returnedQuantity: '',
            partialReturnDate: '',
          })),
          subtotal: parent.subtotal || 0,
          cgstRate: parent.cgstRate || 9,
          cgstAmount: parent.cgstAmount || 0,
          sgstRate: parent.sgstRate || 9,
          sgstAmount: parent.sgstAmount || 0,
          ugstRate: parent.ugstRate || 0,
          ugstAmount: parent.ugstAmount || 0,
          igstRate: parent.igstRate || 0,
          igstAmount: parent.igstAmount || 0,
          totalTaxAmount: parent.totalTaxAmount || 0,
          totalAmount: parent.totalAmount || 0,
          paymentTerms: parent.paymentTerms || "Net 30 Days from invoice date",
          termsConditions: parent.termsConditions || "Warranty provided by principal company only",
          bankDetails: parent.bankDetails,
          rentalDetails: {
            ...parent.rentalDetails,
            status: "PARTIAL_RETURN",
          },
          paymentDetails: parent.paymentDetails,
          invoiceType: 'PARTIAL',
        })
        
      }
    } catch (error: any) {
      alert("Error loading parent invoice details")
    }
  }



  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await fetchParentInvoice()
      setIsLoading(false)
    }

    initializeData()
  }, [parentInvoiceId])

  const updateInvoiceData = (path: string, value: any) => {
    // Debug console logs
    
    setInvoiceData(prev => {
      const keys = path.split('.')
      const newData = { ...prev }
      let current: any = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      
      // Debug: Log the updated data
      if (path.includes('endDate')) {
        // debug removed
      }
      
      return newData
    })
  }

  const calculateAmounts = () => {
    setInvoiceData(prev => {
      const subtotal = prev.items.reduce((sum, i) => {
        const amount = typeof i.amount === 'string' ? parseFloat(i.amount) || 0 : i.amount || 0
        return sum + amount
      }, 0)
      const cgst = (subtotal * prev.cgstRate) / 100
      const sgst = (subtotal * prev.sgstRate) / 100
      const ugst = (subtotal * prev.ugstRate) / 100
      const igst = (subtotal * prev.igstRate) / 100
      const totalTax = cgst + sgst + ugst + igst
      return {
        ...prev,
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        ugstAmount: ugst,
        igstAmount: igst,
        totalTaxAmount: totalTax,
        totalAmount: subtotal + totalTax,
      }
    })
  }
  
  useEffect(() => {
    calculateAmounts()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Prepare payload for PARTIAL update
      const { paymentTerms, rentalDetails, ...invoiceDataWithoutUnused } = invoiceData
      
      // Filter out empty endDate fields from items
      const today = new Date().toISOString().split('T')[0]
      const cleanedItems = invoiceDataWithoutUnused.items.map(item => {
        const cleanedItem: any = { ...item }
        // Remove endDate if it's empty
        if (!cleanedItem.endDate || cleanedItem.endDate.trim() === '') {
          delete cleanedItem.endDate
        }
        // Remove startDate if it's empty
        if (!cleanedItem.startDate || cleanedItem.startDate.trim() === '') {
          delete cleanedItem.startDate
        }
        // Ensure partialReturnDate is set for items being returned
        const retQty = typeof cleanedItem.returnedQuantity === 'string' ? parseFloat(cleanedItem.returnedQuantity) || 0 : cleanedItem.returnedQuantity || 0
        if (retQty > 0 && (!cleanedItem.partialReturnDate || cleanedItem.partialReturnDate.trim() === '')) {
          cleanedItem.partialReturnDate = today
        }
        return cleanedItem
      })
      
      const requestData = {
        ...invoiceDataWithoutUnused,
        items: cleanedItems,
        // Don't send companyId - it should remain unchanged from original invoice
        invoiceType: 'PARTIAL' // PARTIAL for partial return invoices
      }
      
      // Console log the complete payload
      
      // Update existing invoice with partial return data
      const response = await axios.put(
        `https://newsusainvoice.onrender.com/api/invoice/rental/update/${parentInvoiceId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.data.success) {
        alert(`Partial return saved successfully!`)
        setIsEditingMode(false)
      }
    } catch (error) {
      alert('Error saving invoice. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "18px", color: "#4b5563" }}>Loading invoice data...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "16px" }}>
      <div
        id="invoice-container"
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Arial', sans-serif",
          fontSize: isEditingMode ? "14px" : "12px",
          lineHeight: "1.4",
          color: "#000",
          padding: "20px",
          position: "relative",
        }}
      >


        {/* Invoice Type Header */}
        <div
          style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px", marginBottom: "16px", marginLeft: "200px" }}
        >
          PARTIAL RETURN INVOICE
        </div>

        <RentalHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          invoiceType="PARTIAL"
        />

        <RentalForm
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={false}
          invoiceType="PARTIAL"
        />
      </div>

      <RentalActions
        isEditingMode={isEditingMode}
        setIsEditingMode={setIsEditingMode}
        handleSave={handleSave}
        isSaving={isSaving}
        showPhysicalToggle={false}
      />
    </div>
  )
}

