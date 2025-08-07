"use client"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import RentalHeader from "./rental-header"
import RentalForm from "./rental-form"
import RentalActions from "./rental-actions"
import type { RentalInvoiceData, CompanyDetails } from "./rental-types"
import logo from "../../assets/logo1.jpeg"
import stamp from "../../assets/stamp.png"

export default function FullSettlement() {
  const { invoiceId: parentInvoiceId } = useParams<{ invoiceId: string }>()
  const [isEditingMode, setIsEditingMode] = useState(true)
   const [isProgressInvoice, setIsProgressInvoice] = useState(false)
  const [isPhysicalCopy, setIsPhysicalCopy] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPDFType, setCurrentPDFType] = useState<'TAX' | 'PROFORMA' | null>(null)

  const [companyDetails] = useState<CompanyDetails>({
    name: "SUSAKGJYO BUSINESS PVT. LTD",
    address: "1404, DLF CORPORATE GREEN, SECTOR 74 - A, GURGAON, HARYANA -122004 (INDIA)",
    gstin: "06AAYCS5019E1Z3",
    pan: "AAYCS5019E",
    phone: "+91-8595591496, 0124-4147286 ",
    email: "Contact@susalabs.com",
    logo: logo,
    stamp: stamp,
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
    invoiceType: 'FULL',
  })

  // Final payment state for full settlement
  const [finalPayment, setFinalPayment] = useState(0)

  // Fetch parent invoice data
  const fetchParentInvoice = async () => {
    if (!parentInvoiceId) return
    
    try {
      console.log('🔄 Fetching parent invoice:', parentInvoiceId)
      const token = localStorage.getItem("token")
      
      const response = await axios.get(
        `http://localhost:5000/api/invoice/rental/details/${parentInvoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.data.success) {
        const parent = response.data.data
        console.log('✅ Parent invoice loaded:', parent)
        
        // Populate all fields with parent invoice data
        setInvoiceData({
          invoiceNumber: `FULL-${parent.invoiceNumber}`,
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
            status: "COMPLETED",
          },
          paymentDetails: parent.paymentDetails,
          invoiceType: 'FULL',
        })
        
        console.log('✅ All fields populated with parent invoice data')
      }
    } catch (error: any) {
      console.error("❌ Error fetching parent invoice:", error)
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
    console.log('🔧 updateInvoiceData called:', { path, value })
    
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
        console.log('📅 End date updated:', {
          path,
          value,
          updatedItems: newData.items
        })
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

  const handleSaveAndGeneratePDF = async (type: 'TAX' | 'PROFORMA') => {
    setIsGeneratingPDF(true)
    setCurrentPDFType(type) // Set type for header display
    try {
      const token = localStorage.getItem('token')
      
      // Add companyId and type to the request payload
      const { paymentTerms, rentalDetails, ...invoiceDataWithoutUnused } = invoiceData
      
      // Filter out empty endDate fields from items
      const cleanedItems = invoiceDataWithoutUnused.items.map(item => {
        const cleanedItem = { ...item }
        // Remove endDate if it's empty
        if (!cleanedItem.endDate || cleanedItem.endDate.trim() === '') {
          delete cleanedItem.endDate
        }
        // Remove startDate if it's empty
        if (!cleanedItem.startDate || cleanedItem.startDate.trim() === '') {
          delete cleanedItem.startDate
        }
        return cleanedItem
      })
      
      // Calculate final settlement data
      const currentOutstanding = invoiceData.paymentDetails?.outstandingAmount || 0
      const finalOutstanding = Math.max(0, currentOutstanding - finalPayment)
      
      const requestData = {
        ...invoiceDataWithoutUnused,
        items: cleanedItems.map(item => ({
          ...item,
          returnedQuantity: item.rentedQuantity, // All items returned in full settlement
          partialReturnDate: new Date().toISOString().split('T')[0]
        })),
        // Don't send companyId - it should remain unchanged from original invoice
        invoiceType: 'FULL', // FULL for final settlement
        type: type, // TAX or PROFORMA goes in separate type field
        paymentDetails: {
          ...invoiceDataWithoutUnused.paymentDetails,
          paidAmount: (invoiceData.paymentDetails?.paidAmount || 0) + finalPayment,
          outstandingAmount: finalOutstanding,
          finalPayment: finalPayment,
          settlementDate: new Date().toISOString().split('T')[0]
        },
        rentalDetails: {
          ...invoiceData.rentalDetails,
          status: "COMPLETED",
          settlementDate: new Date().toISOString().split('T')[0]
        }
      }
      
      // Console log the complete payload
      console.log('🚀 PAYLOAD BEING SENT TO BACKEND:')
      console.log('📦 Request Data:', JSON.stringify(requestData, null, 2))
      console.log('🏢 Parent Invoice ID:', parentInvoiceId)
      console.log('📄 Invoice Type:', type)
      console.log('💰 Total Amount:', requestData.totalAmount)
      console.log('🧾 Items Count:', requestData.items?.length)
      
      // Update existing invoice with partial return data
      const response = await axios.put(
        `http://localhost:5000/api/invoice/rental/update/${parentInvoiceId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      if (response.data.success) {
        // Generate PDF after successful save
        const { jsPDF } = await import('jspdf')
        const html2canvas = await import('html2canvas')
        
        const element = document.getElementById('invoice-container')
        if (element) {
          // Wait a bit for all content to render
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const canvas = await html2canvas.default(element, {
            scale: 2, // Higher resolution
            useCORS: true, // Handle cross-origin images
            allowTaint: true, // Allow tainted canvas
            backgroundColor: '#ffffff', // White background
            width: element.scrollWidth,
            height: element.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
          })
          const imgData = canvas.toDataURL('image/png', 1.0) // Full quality
          
          // Create Original PDF
          const originalPdf = new jsPDF()
          const imgWidth = 210
          const pageHeight = 295
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight
          
          let position = 0
          
          // Add "ORIGINAL" watermark
          originalPdf.setFontSize(20)
          originalPdf.setTextColor(200, 200, 200)
          originalPdf.text('ORIGINAL', 150, 20)
          
          originalPdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            originalPdf.addPage()
            // Add watermark to each page
            originalPdf.setFontSize(20)
            originalPdf.setTextColor(200, 200, 200)
            originalPdf.text('ORIGINAL', 150, 20)
            originalPdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }
          
          // Create Duplicate PDF
          const duplicatePdf = new jsPDF()
          heightLeft = imgHeight
          position = 0
          
          // Add "DUPLICATE" watermark
          duplicatePdf.setFontSize(20)
          duplicatePdf.setTextColor(200, 200, 200)
          duplicatePdf.text('DUPLICATE', 145, 20)
          
          duplicatePdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            duplicatePdf.addPage()
            // Add watermark to each page
            duplicatePdf.setFontSize(20)
            duplicatePdf.setTextColor(200, 200, 200)
            duplicatePdf.text('DUPLICATE', 145, 20)
            duplicatePdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }
          
          // Save both PDFs
          const baseFilename = type === 'TAX' 
            ? `tax-invoice-${invoiceData.invoiceNumber}`
            : `proforma-invoice-${invoiceData.invoiceNumber}`
          
          originalPdf.save(`${baseFilename}-original.pdf`)
          
          // Small delay before saving duplicate
          setTimeout(() => {
            duplicatePdf.save(`${baseFilename}-duplicate.pdf`)
          }, 500)
          
          alert(`${type} invoice saved successfully!\n\n✅ Original PDF: ${baseFilename}-original.pdf\n✅ Duplicate PDF: ${baseFilename}-duplicate.pdf`)
          setIsEditingMode(false)
        }
      }
    } catch (error) {
      console.error('Error saving invoice or generating PDF:', error)
      alert('Error saving invoice or generating PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
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
          {currentPDFType === 'TAX' ? "TAX INVOICE" : 
           currentPDFType === 'PROFORMA' ? "PROFORMA INVOICE" : 
           "ADVANCE RENTAL INVOICE"}
        </div>

        <RentalHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          invoiceType="FULL"
        />

        <RentalForm
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={isPhysicalCopy}
          invoiceType="FULL"
        />

        {/* Final Payment Section for Full Settlement */}
        {isEditingMode && (
          <div style={{ 
            backgroundColor: "#f0f9ff", 
            padding: "20px", 
            borderRadius: "8px", 
            marginTop: "20px",
            border: "2px solid #0ea5e9"
          }}>
            <h3 style={{ fontWeight: "bold", marginBottom: "16px", color: "#0c4a6e", fontSize: "18px" }}>🏁 Final Settlement Payment</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", fontSize: "14px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontWeight: "600" }}>Current Outstanding:</span>
                  <span style={{ fontWeight: "bold", fontSize: "18px", color: "#dc2626" }}>₹{(invoiceData.paymentDetails?.outstandingAmount || 0).toLocaleString()}</span>
                </div>
                
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#0c4a6e" }}>Final Payment Amount:</label>
                  <input
                    type="number"
                    min="0"
                    value={finalPayment || ''}
                    onChange={(e) => setFinalPayment(parseFloat(e.target.value) || 0)}
                    style={{
                      border: "2px solid #0ea5e9",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "16px",
                      width: "100%",
                      backgroundColor: "#f8fafc"
                    }}
                    placeholder="Enter final settlement amount (₹)"
                  />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontWeight: "bold", fontSize: "16px" }}>
                  <span>After Payment Outstanding:</span>
                  <span style={{ color: finalPayment >= (invoiceData.paymentDetails?.outstandingAmount || 0) ? "#059669" : "#dc2626" }}>
                    ₹{Math.max(0, (invoiceData.paymentDetails?.outstandingAmount || 0) - finalPayment).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", backgroundColor: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                  💡 Final settlement will mark all items as returned and rental as completed
                </div>
                {finalPayment >= (invoiceData.paymentDetails?.outstandingAmount || 0) && (
                  <div style={{ fontSize: "12px", color: "#059669", fontWeight: "bold", marginTop: "8px", backgroundColor: "#f0fdf4", padding: "8px", borderRadius: "4px", border: "1px solid #22c55e" }}>
                    ✅ Outstanding will be fully settled!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <RentalActions
        isEditingMode={isEditingMode}
        setIsEditingMode={setIsEditingMode}
        handleTaxPDF={() => handleSaveAndGeneratePDF('TAX')}
        handleProformaPDF={() => handleSaveAndGeneratePDF('PROFORMA')}
        isPhysicalCopy={isPhysicalCopy}
        setIsPhysicalCopy={setIsPhysicalCopy}
        isGeneratingPDF={isGeneratingPDF}
      />
    </div>
  )
}
