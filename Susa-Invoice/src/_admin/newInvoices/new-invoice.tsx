"use client"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import InvoiceHeader from "./invoice-header"
import InvoiceForm from "./invoice-form"
import InvoiceActions from "./invoice-actions"
import type { InvoiceData, CompanyDetails } from "./invoice-types"
import logo from "../../assets/logo1.jpeg"
import stamp from "../../assets/stamp.png"

export default function NewInvoice() {
  const { companyId } = useParams<{ companyId: string }>()
  const [isEditingMode, setIsEditingMode] = useState(true)
  const [isProgressInvoice, setIsProgressInvoice] = useState(false)
  const [isPhysicalCopy, setIsPhysicalCopy] = useState(false)
  const [showOriginalLabel, setShowOriginalLabel] = useState(false)
  const [showDuplicateLabel, setShowDuplicateLabel] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
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
   // inside NewInvoice.tsx – replace items default
items: [
  {
    productName: '',
    duration: 1,
    durationUnit: 'hours',
    hsnCode: '',
    amount: 0,
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
  })

  // Fetch next invoice number
  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/invoice/nextInvoiceNumber")
      if (response.data && response.data.nextInvoiceNumber) {
        setInvoiceData((prev) => ({
          ...prev,
          invoiceNumber: response.data.nextInvoiceNumber.toString(),
        }))
      }
    } catch (error) {
      console.error("Error fetching next invoice number:", error)
    }
  }

  // Fetch company details by ID
  const fetchCompanyDetails = async () => {
    if (!companyId) return

    try {
      const response = await axios.get(`http://localhost:5000/api/companies/getById/${companyId}`)
      if (response.data) {
        const company = response.data
        setInvoiceData((prev) => ({
          ...prev,
          billTo: {
            name: company.name || "",
            address: company.address || "",
            gstin: company.gstNumber || "",
          },
        }))
      }
    } catch (error) {
      console.error("Error fetching company details:", error)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await Promise.all([fetchNextInvoiceNumber(), fetchCompanyDetails()])
      setIsLoading(false)
    }

    initializeData()
  }, [companyId])

  const updateInvoiceData = (path: string, value: any) => {
    setInvoiceData((prev) => {
      const keys = path.split(".")
      const newData = { ...prev }
      let current: any = newData
      for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

const calculateAmounts = () => {
  setInvoiceData(prev => {
    const subtotal = prev.items.reduce((sum, i) => sum + (i.amount || 0), 0)
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
        {/* Copy Labels */}
        {showOriginalLabel && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              backgroundColor: "#f3f4f6",
              border: "2px solid #1f2937",
              padding: "6px 12px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            ORIGINAL
          </div>
        )}
        {showDuplicateLabel && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              backgroundColor: "#f3f4f6",
              border: "2px solid #1f2937",
              padding: "6px 12px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            DUPLICATE
          </div>
        )}

        {/* Invoice Type Header */}
        <div
          style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px", marginBottom: "16px", marginLeft: "200px" }}
        >
          {isProgressInvoice ? "Proforma Invoice" : "Tax Invoice"}
        </div>

        <InvoiceHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
        />

        <InvoiceForm
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={isPhysicalCopy}
        />
      </div>

      <InvoiceActions
        isEditingMode={isEditingMode}
        setIsEditingMode={setIsEditingMode}
        isPhysicalCopy={isPhysicalCopy}
        setIsPhysicalCopy={setIsPhysicalCopy}
        isGeneratingPDF={isGeneratingPDF}
        setIsGeneratingPDF={setIsGeneratingPDF}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        invoiceData={invoiceData}
        companyDetails={companyDetails}
        companyId={companyId || ""}
        setIsProgressInvoice={setIsProgressInvoice}
        setShowOriginalLabel={setShowOriginalLabel}
        setShowDuplicateLabel={setShowDuplicateLabel}
        isProgressInvoice={isProgressInvoice} 
      />
    </div>
  )
}