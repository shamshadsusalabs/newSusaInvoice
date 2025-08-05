"use client"

import { Edit, Eye, FileText, Save } from "lucide-react"
import jsPDF from "jspdf"
import axios from "axios"
import type { InvoiceData, CompanyDetails } from "./invoice-types"

interface InvoiceActionsProps {
  isEditingMode: boolean
  setIsEditingMode: (value: boolean) => void
  isPhysicalCopy: boolean
  setIsPhysicalCopy: (value: boolean) => void
  isGeneratingPDF: boolean
  setIsGeneratingPDF: (value: boolean) => void
  isSaving: boolean
  setIsSaving: (value: boolean) => void
  invoiceData: InvoiceData
  companyDetails: CompanyDetails
  companyId: string
  setIsProgressInvoice: (value: boolean) => void
  setShowOriginalLabel: (value: boolean) => void
  setShowDuplicateLabel: (value: boolean) => void
  isProgressInvoice: boolean // Declare the variable here
}

// Number to words conversion
const numberToWords = (num: number): string => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  if (num === 0) return "Zero"

  const convertHundreds = (n: number): string => {
    let result = ""
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred "
      n %= 100
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " "
      n %= 10
    } else if (n >= 10) {
      result += teens[n - 10] + " "
      return result
    }
    if (n > 0) {
      result += ones[n] + " "
    }
    return result
  }

  const crores = Math.floor(num / 10000000)
  const lakhs = Math.floor((num % 10000000) / 100000)
  const thousands = Math.floor((num % 100000) / 1000)
  const hundreds = num % 1000

  let result = ""
  if (crores > 0) result += convertHundreds(crores) + "Crore "
  if (lakhs > 0) result += convertHundreds(lakhs) + "Lakh "
  if (thousands > 0) result += convertHundreds(thousands) + "Thousand "
  if (hundreds > 0) result += convertHundreds(hundreds)

  return result.trim() + " Only"
}

export default function InvoiceActions({
  isEditingMode,
  setIsEditingMode,
  isPhysicalCopy,
  setIsPhysicalCopy,
  isGeneratingPDF,
  setIsGeneratingPDF,
  isSaving,
  setIsSaving,
  invoiceData,
  companyDetails,
  companyId,
  setIsProgressInvoice,
  setShowOriginalLabel,
  setShowDuplicateLabel,
  isProgressInvoice, // Use the variable here
}: InvoiceActionsProps) {
  const captureElementScreenshot = async (): Promise<string> => {
    const { default: html2canvas } = await import("html2canvas")
    const element = document.getElementById("invoice-container")
    if (!element) {
      throw new Error("Invoice container not found")
    }

    // Create a clone of the element for capture
    const clone = element.cloneNode(true) as HTMLElement
    clone.id = "invoice-clone"
    // Apply print styles to clone with standard colors
    clone.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 210mm;
      min-height: 297mm;
      background-color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #000000;
      padding: 10mm;
      box-sizing: border-box;
      transform: scale(1);
      transform-origin: top left;
    `
    // Replace all Tailwind classes with inline styles
    const allElements = clone.querySelectorAll("*")
    allElements.forEach((el) => {
      const element = el as HTMLElement
      // Handle SVG elements differently
      if (element instanceof SVGElement) {
        // For SVG elements, use setAttribute to remove class
        element.removeAttribute("class")
      } else {
        // For regular HTML elements, clear className
        element.className = ""
      }
      // Apply basic styling based on element type
      if (element.tagName === "TABLE") {
        element.style.cssText += `
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #d1d5db;
        `
      } else if (element.tagName === "TH") {
        element.style.cssText += `
          background-color: #2563eb;
          color: #ffffff;
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: left;
          font-weight: 500;
        `
      } else if (element.tagName === "TD") {
        element.style.cssText += `
          border: 1px solid #d1d5db;
          padding: 8px;
          vertical-align: middle;
        `
      } else if (element.tagName === "H1") {
        element.style.cssText += `
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
        `
      } else if (element.tagName === "H3") {
        element.style.cssText += `
          font-weight: bold;
          color: #2563eb;
          margin: 0 0 8px 0;
          font-size: 14px;
        `
      } else if (element.tagName === "SVG") {
        // Hide SVG icons during PDF generation to avoid issues
        element.style.display = "none"
      }
    })
    // Replace all textareas with divs in clone
    const textareas = clone.querySelectorAll("textarea")
    textareas.forEach((textarea) => {
      const div = document.createElement("div")
      div.innerHTML = textarea.value.replace(/\n/g, "<br>")
      div.style.cssText = `
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 4px;
        border: none;
        background: transparent;
        white-space: pre-wrap;
        word-wrap: break-word;
        min-height: ${Math.max(20, textarea.offsetHeight)}px;
        width: 100%;
        line-height: 1.4;
        color: #000000;
      `
      textarea.parentNode?.replaceChild(div, textarea)
    })
    // Replace all inputs with spans in clone
    const inputs = clone.querySelectorAll("input")
    inputs.forEach((input) => {
      const span = document.createElement("span")
      span.textContent = input.value || ""
      span.style.cssText = `
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 4px;
        border: none;
        background: transparent;
        display: inline-block;
        min-width: 20px;
        line-height: 1.4;
        color: #000000;
      `
      input.parentNode?.replaceChild(span, input)
    })
    // Remove action buttons from clone
    const actionElements = clone.querySelectorAll("button")
    actionElements.forEach((el) => el.remove())
    document.body.appendChild(clone)
    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        windowWidth: 794,
        windowHeight: 1123,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.tagName === "SCRIPT" || element.tagName === "STYLE"
        },
      })
      document.body.removeChild(clone)
      return canvas.toDataURL("image/png", 1.0)
    } catch (error) {
      document.body.removeChild(clone)
      throw error
    }
  }

  const createPDFFromImage = async (imageData: string, copyType: string, invoiceType: string) => {
    const pdf = new jsPDF("p", "mm", "a4")
    // Create image element to get dimensions
    const img = new Image()
    img.crossOrigin = "anonymous"
    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const pdfWidth = 210 // A4 width in mm
        const pdfHeight = 297 // A4 height in mm
        // Calculate dimensions to fit A4
        let imgWidth = pdfWidth
        let imgHeight = (img.height * pdfWidth) / img.width
        // If height exceeds A4, scale down
        if (imgHeight > pdfHeight) {
          imgHeight = pdfHeight
          imgWidth = (img.width * pdfHeight) / img.height
        }
        // Center the image
        const x = (pdfWidth - imgWidth) / 2
        const y = (pdfHeight - imgHeight) / 2
        pdf.addImage(imageData, "PNG", x, y, imgWidth, imgHeight)
        pdf.save(`${invoiceType}_Invoice_${copyType}.pdf`)
        resolve()
      }
      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }
      img.src = imageData
    })
  }

  const handleGenerateAndSave = async (type: "Proforma" | "Tax") => {
    setIsProgressInvoice(type === "Proforma")
    setIsGeneratingPDF(true)
    setIsSaving(true)

    try {
      // Generate Original PDF
      setIsEditingMode(false)
      setShowOriginalLabel(true)
      setShowDuplicateLabel(false)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Give a moment for state to apply
      const elementScreenshot = await captureElementScreenshot()
      await createPDFFromImage(elementScreenshot, "ORIGINAL", type)

      // Generate Duplicate PDF
      setShowOriginalLabel(false)
      setShowDuplicateLabel(true)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Give a moment for state to apply
      const elementScreenshot2 = await captureElementScreenshot()
      await createPDFFromImage(elementScreenshot2, "DUPLICATE", type)

      // Save Invoice
      const invoicePayload = {
        ...invoiceData,
        type: type,
        companyDetails: companyDetails,
        companyId: companyId,
        amountInWords: numberToWords(invoiceData.totalAmount),
        createdAt: new Date().toISOString(),
      }

      const response = await axios.post("http://localhost:5000/api/invoice/add", invoicePayload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      console.log("Invoice saved successfully:", response.data)
      alert(`${type} Invoice generated and saved successfully!`)

      if (response.data && response.data.invoiceId) {
        console.log("Invoice ID:", response.data.invoiceId)
      }
    } catch (error) {
      console.error("Error during operation:", error)
      if (axios.isAxiosError(error)) {
        if (error.response) {
          alert(`Error: ${error.response.data?.message || error.response.statusText}`)
        } else if (error.request) {
          alert("Error: Unable to connect to server. Please check if the server is running.")
        } else {
          alert(`Error: ${error.message}`)
        }
      } else {
        alert("An unexpected error occurred.")
      }
    } finally {
      setIsGeneratingPDF(false)
      setIsSaving(false)
      setShowOriginalLabel(false)
      setShowDuplicateLabel(false)
      setIsEditingMode(true) // Revert to edit mode after operation
    }
  }

  const toggleEditMode = () => {
    setIsEditingMode(!isEditingMode)
  }

  const isDisabled = isGeneratingPDF || isSaving || isEditingMode

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
      <button
        onClick={toggleEditMode}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#4b5563",
          color: "#ffffff",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
      >
        {isEditingMode ? (
          <Eye style={{ width: "16px", height: "16px" }} />
        ) : (
          <Edit style={{ width: "16px", height: "16px" }} />
        )}
        {isEditingMode ? "Preview Mode" : "Edit Mode"}
      </button>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={isPhysicalCopy}
          onChange={(e) => setIsPhysicalCopy(e.target.checked)}
          style={{ borderRadius: "4px" }}
        />
        Physical Copy
      </label>
      <button
        onClick={() => handleGenerateAndSave("Proforma")}
        disabled={isDisabled}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#dc2626",
          color: "#ffffff",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.3s",
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <FileText style={{ width: "16px", height: "16px" }} />
        {isGeneratingPDF && isProgressInvoice ? "Generating..." : "Generate Proforma PDF & Save"}
      </button>
      <button
        onClick={() => handleGenerateAndSave("Tax")}
        disabled={isDisabled}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#16a34a",
          color: "#ffffff",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.3s",
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <Save style={{ width: "16px", height: "16px" }} />
        {isGeneratingPDF && !isProgressInvoice ? "Generating..." : "Generate Tax PDF & Save"}
      </button>
    </div>
  )
}
