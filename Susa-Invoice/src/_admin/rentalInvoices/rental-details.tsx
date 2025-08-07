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
      console.log('🔄 Fetching invoice details:', invoiceId)
      const token = localStorage.getItem("token")
      
      const response = await axios.get(
        `http://localhost:5000/api/invoice/rental/details/${invoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.data.success) {
        const invoiceDetails = response.data.data
        console.log('✅ Invoice details loaded:', invoiceDetails)
        setInvoiceData(invoiceDetails)
      } else {
        throw new Error("Invoice not found")
      }
    } catch (error: any) {
      console.error("❌ Error fetching invoice details:", error)
      alert("Error loading invoice details")
      navigate("/dashboard")
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

  const updateInvoiceData = (path: string, value: any) => {
    // This is read-only mode, so no updates needed
    console.log('Read-only mode - no updates allowed')
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
        
        alert(`${type} invoice PDFs generated successfully!\n\n✅ Original PDF: ${baseFilename}-original.pdf\n✅ Duplicate PDF: ${baseFilename}-duplicate.pdf`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
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
          onClick={() => navigate("/dashboard")}
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
          onClick={() => navigate("/dashboard")}
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
          isEditingMode={false}
          updateInvoiceData={updateInvoiceData}
          invoiceType={getInvoiceTypeFromData(invoiceData)}
        />

        <RentalForm
          invoiceData={invoiceData}
          isEditingMode={false}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={isPhysicalCopy}
          invoiceType={getInvoiceTypeFromData(invoiceData)}
        />
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
