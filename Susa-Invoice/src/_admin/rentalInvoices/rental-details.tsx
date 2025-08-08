"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { ArrowLeft } from "lucide-react"
import RentalHeader from "./rental-header"
import RentalForm from "./rental-form"
import RentalActions from "./rental-actions"
import type { RentalInvoiceData, CompanyDetails } from "./rental-types"
import logo from "../../assets/logo1.jpeg"
import stamp from "../../assets/stamp.png"

export default function RentalDetails() {
  const navigate = useNavigate()
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [isEditingMode, setIsEditingMode] = useState(false)
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

  const [invoiceData, setInvoiceData] = useState<RentalInvoiceData | null>(null)

  // Fetch invoice details
  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return
    
    try {
      const token = localStorage.getItem("refreshToken")
      
      const response = await axios.get(
        `https://newsusainvoice.onrender.com/api/invoice/rental/details/${invoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.data.success) {
        const invoiceDetails = response.data.data
        setInvoiceData(invoiceDetails)
      } else {
        throw new Error("Invoice not found")
      }
    } catch (error: any) {
      alert("Error loading invoice details")
      navigate("/admin/dashboard")
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await fetchInvoiceDetails()
      setIsLoading(false)
    }

    initializeData()
  }, [invoiceId])

  const updateInvoiceData = (_path: string, _value: any) => {
    // This is read-only mode, so no updates needed
  }

  const calculateAmounts = () => {
    // For viewing existing invoices, amounts are already calculated
  }

  const getInvoiceTypeFromData = (data: RentalInvoiceData): 'ADVANCE' | 'PARTIAL' | 'FULL' => {
    if (data.invoiceType) {
      return data.invoiceType as 'ADVANCE' | 'PARTIAL' | 'FULL'
    }
    
    // Fallback logic based on invoice number prefix
    if (data.invoiceNumber?.startsWith('ADV-')) return 'ADVANCE'
    if (data.invoiceNumber?.startsWith('PARTIAL-')) return 'PARTIAL'
    if (data.invoiceNumber?.startsWith('FULL-')) return 'FULL'
    
    return 'ADVANCE' // Default
  }

  const handleGeneratePDF = async (type: 'TAX' | 'PROFORMA') => {
    setIsGeneratingPDF(true)
    setCurrentPDFType(type)
    
    try {
      // Generate PDF
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
          ? `tax-invoice-${invoiceData?.invoiceNumber}`
          : `proforma-invoice-${invoiceData?.invoiceNumber}`
        
        originalPdf.save(`${baseFilename}-original.pdf`)
        
        // Small delay before saving duplicate
        setTimeout(() => {
          duplicatePdf.save(`${baseFilename}-duplicate.pdf`)
        }, 500)
        
        alert(`${type} invoice PDFs generated successfully!\n\nâœ… Original PDF: ${baseFilename}-original.pdf\nâœ… Duplicate PDF: ${baseFilename}-duplicate.pdf`)
      }
    } catch (error) {
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
      setCurrentPDFType(null)
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
        <div style={{ fontSize: "18px", color: "#4b5563" }}>Loading invoice details...</div>
      </div>
    )
  }

  if (!invoiceData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "18px", color: "#4b5563", marginBottom: "16px" }}>
          Invoice not found
        </div>
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "16px" }}>
      {/* Navigation Bar */}
      <div
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          backgroundColor: "white",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
          Back to Dashboard
        </button>
        
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937" }}>
          Invoice Details - {invoiceData.invoiceNumber}
        </div>
      </div>

      <div
        id="invoice-container"
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Arial', sans-serif",
          fontSize: "12px",
          lineHeight: "1.4",
          color: "#000",
          padding: "20px",
          position: "relative",
        }}
      >
        {/* Invoice Type Header */}
        <div
          style={{ 
            color: "#2563eb", 
            fontWeight: "bold", 
            fontSize: "18px", 
            marginBottom: "16px", 
            marginLeft: "200px" 
          }}
        >
          {currentPDFType === 'TAX' ? "TAX INVOICE" : 
           currentPDFType === 'PROFORMA' ? "PROFORMA INVOICE" : 
           `${getInvoiceTypeFromData(invoiceData).toUpperCase()} RENTAL INVOICE`}
        </div>

        <RentalHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          invoiceType={getInvoiceTypeFromData(invoiceData)}
        />

        <RentalForm
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={isPhysicalCopy}
          invoiceType={getInvoiceTypeFromData(invoiceData)}
        />

        {/* Partial Return History (Read-only) */}
        {(invoiceData.partialReturnHistory && invoiceData.partialReturnHistory.length > 0) && (
          <div style={{
            backgroundColor: '#ecfeff',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '16px',
            border: '2px solid #06b6d4'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#164e63', fontSize: '18px' }}>Partial Return History</h3>
            {invoiceData.partialReturnHistory.map((entry: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '13px' }}>
                  <div><strong>Date:</strong> {entry.returnDate || '-'}</div>
                  {typeof entry.partialPayment === 'number' && (
                    <div><strong>Partial Payment:</strong> ₹{(entry.partialPayment || 0).toLocaleString()}</div>
                  )}
                </div>
                {entry.notes && (
                  <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px' }}><strong>Notes:</strong> {entry.notes}</div>
                )}
                {(entry.returnedItems && entry.returnedItems.length > 0) ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#cffafe' }}>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #67e8f9' }}>Product</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #67e8f9' }}>Returned Qty</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #67e8f9' }}>Partial Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.returnedItems.map((ri: any, rIdx: number) => (
                          <tr key={rIdx}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #bae6fd' }}>{ri.productName || `Item ${rIdx + 1}`}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #bae6fd', textAlign: 'right' }}>{ri.returnedQuantity || 0}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #bae6fd', textAlign: 'right' }}>₹{(ri.partialAmount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No returned items recorded in this entry.</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Full Settlement Payment Summary (Read-only) */}
        {getInvoiceTypeFromData(invoiceData) === 'FULL' && (
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '20px', 
            borderRadius: '8px', 
            marginTop: '16px',
            border: '2px solid #0ea5e9'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#0c4a6e', fontSize: '18px' }}>Full Settlement Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Total Rent Amount:</span>
                  <span style={{ fontWeight: 'bold' }}>₹{(invoiceData.paymentDetails?.totalRentAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Paid Amount:</span>
                  <span style={{ fontWeight: 'bold' }}>₹{(invoiceData.paymentDetails?.paidAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Damage Charges:</span>
                  <span style={{ fontWeight: 'bold', color: '#b45309' }}>₹{(invoiceData.paymentDetails?.damageCharges || 0).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Final Amount:</span>
                  <span style={{ fontWeight: 'bold' }}>₹{(invoiceData.paymentDetails?.finalAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Outstanding:</span>
                  <span style={{ fontWeight: 'bold', color: (invoiceData.paymentDetails?.outstandingAmount || 0) === 0 ? '#059669' : '#dc2626' }}>₹{(invoiceData.paymentDetails?.outstandingAmount || 0).toLocaleString()}</span>
                </div>
                {invoiceData.rentalDetails?.status && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Status:</span>
                    <span style={{ fontWeight: 'bold' }}>{invoiceData.rentalDetails.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <RentalActions
        isEditingMode={false}
        setIsEditingMode={setIsEditingMode}
        handleTaxPDF={() => handleGeneratePDF('TAX')}
        handleProformaPDF={() => handleGeneratePDF('PROFORMA')}
        isPhysicalCopy={isPhysicalCopy}
        setIsPhysicalCopy={setIsPhysicalCopy}
        isGeneratingPDF={isGeneratingPDF}
      />
    </div>
  )
}

