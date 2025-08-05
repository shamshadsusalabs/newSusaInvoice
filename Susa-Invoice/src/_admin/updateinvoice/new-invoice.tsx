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
  const { _id } = useParams<{ _id: string }>()
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

  // Fetch existing invoice data by ID
  const fetchInvoiceById = async () => {
    if (!_id) return

    try {
      const response = await axios.get(`https://newsusainvoice.onrender.com/api/invoice/getbyId/${_id}`)
      if (response.data) {
        const invoiceFromAPI = response.data

        // Set invoice type based on API data
        setIsProgressInvoice(invoiceFromAPI.type === "Proforma")

        // Map API response to invoice data structure
        setInvoiceData({
          invoiceNumber: invoiceFromAPI.invoiceNumber?.toString() || "001",
          Date: invoiceFromAPI.Date || new Date().toISOString().split("T")[0],
          dueDate: invoiceFromAPI.dueDate || "",
          poNumber: invoiceFromAPI.poNumber || "",
          billTo: {
            name: invoiceFromAPI.billTo?.name || "",
            address: invoiceFromAPI.billTo?.address || "",
            gstin: invoiceFromAPI.billTo?.gstin || "",
          },
          shipTo: {
            name: invoiceFromAPI.shipTo?.name || "",
            address: invoiceFromAPI.shipTo?.address || "",
          },
          items:
            invoiceFromAPI.items?.length > 0
              ? invoiceFromAPI.items.map((item: any) => ({
                  description: item.description || "",
                  specification: item.specification || "",
                  hsnCode: item.hsnCode || "",
                  quantity: item.quantity || 1,
                  rate: item.rate || 0,
                  amount: item.amount || 0,
                }))
              : [
                  {
                    description: "",
                    specification: "",
                    hsnCode: "",
                    quantity: 1,
                    rate: 0,
                    amount: 0,
                  },
                ],
          subtotal: invoiceFromAPI.subtotal || 0,
          cgstRate: invoiceFromAPI.cgstRate || 9,
          cgstAmount: invoiceFromAPI.cgstAmount || 0,
          sgstRate: invoiceFromAPI.sgstRate || 9,
          sgstAmount: invoiceFromAPI.sgstAmount || 0,
          ugstRate: invoiceFromAPI.ugstRate || 0,
          ugstAmount: invoiceFromAPI.ugstAmount || 0,
          igstRate: invoiceFromAPI.igstRate || 0,
          igstAmount: invoiceFromAPI.igstAmount || 0,
          totalTaxAmount: invoiceFromAPI.totalTaxAmount || 0,
          totalAmount: invoiceFromAPI.totalAmount || 0,
          paymentTerms:
            invoiceFromAPI.paymentTerms ||
            "Net 30 Days from invoice date\nPayment via NEFT/RTGS/Cheque\nDelayed payments subject to 1.5% monthly interest",
          termsConditions:
            invoiceFromAPI.termsConditions ||
            "Warranty provided by principal company only\nGoods once sold will not be taken back\nAll disputes subject to Delhi jurisdiction",
          bankDetails: {
            bankName: invoiceFromAPI.bankDetails?.bankName || "Yes Bank Limited",
            accountName: invoiceFromAPI.bankDetails?.accountName || "Your Business Pvt.Ltd",
            accountNumber: invoiceFromAPI.bankDetails?.accountNumber || "038263400000072",
            ifscCode: invoiceFromAPI.bankDetails?.ifscCode || "YESB0000382",
          },
        })
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error)
      alert("Error loading invoice data. Please try again.")
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await fetchInvoiceById()
      setIsLoading(false)
    }
    initializeData()
  }, [_id])

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
        invoiceId={_id || ""}
        setIsProgressInvoice={setIsProgressInvoice}
        setShowOriginalLabel={setShowOriginalLabel}
        setShowDuplicateLabel={setShowDuplicateLabel}
           isProgressInvoice={isProgressInvoice} 
      />
    </div>
  )
}
