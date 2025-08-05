"use client"

import { Phone, Mail } from "lucide-react"
import type { InvoiceData, InvoiceItem, CompanyDetails } from "./invoice-types"

interface InvoiceFormProps {
  invoiceData: InvoiceData
  isEditingMode: boolean
  updateInvoiceData: (path: string, value: any) => void
  calculateAmounts: () => void
  companyDetails: CompanyDetails
  isPhysicalCopy: boolean
}

// ----- Number-to-words (unchanged) -----
const numberToWords = (num: number): string => {
  const ones   = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"]
  const teens  = ["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"]
  const tens   = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"]

  if (num === 0) return "Zero"

  const convertHundreds = (n: number): string => {
    let res = ""
    if (n >= 100) { res += ones[Math.floor(n/100)] + " Hundred "; n %= 100 }
    if (n >= 20)  { res += tens[Math.floor(n/10)] + " "; n %= 10 }
    else if (n>=10){ res += teens[n-10] + " "; return res }
    if (n>0) res += ones[n] + " "
    return res
  }

  const crores = Math.floor(num / 10000000)
  const lakhs  = Math.floor((num % 10000000) / 100000)
  const thous  = Math.floor((num % 100000) / 1000)
  const hund   = num % 1000

  let result = ""
  if (crores>0) result += convertHundreds(crores) + "Crore "
  if (lakhs>0)  result += convertHundreds(lakhs) + "Lakh "
  if (thous>0)  result += convertHundreds(thous) + "Thousand "
  if (hund>0)   result += convertHundreds(hund)
  return result.trim() + " Only"
}

export default function InvoiceForm({
  invoiceData,
  isEditingMode,
  updateInvoiceData,
  calculateAmounts,
  companyDetails,
  isPhysicalCopy,
}: InvoiceFormProps) {

  const addItem = () => {
    const newItems: InvoiceItem[] = [
      ...invoiceData.items,
      {
        productName: "",
        duration: 1,
        durationUnit: "days",
        hsnCode: "",
        amount: 0,
      },
    ]
    updateInvoiceData("items", newItems)
    // GST & total will be recalculated by parent
    calculateAmounts()
  }

  const removeItem = (index: number) => {
    if (invoiceData.items.length > 1) {
      const newItems = invoiceData.items.filter((_, i) => i !== index)
      updateInvoiceData("items", newItems)
      calculateAmounts()
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoiceData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateInvoiceData("items", newItems)
    calculateAmounts()
  }

  return (
    <>
      {/* ===== Client Information ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "24px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderLeft: "4px solid #2563eb", borderRadius: "4px" }}>
          <h3 style={{ fontWeight: "bold", color: "#2563eb", marginBottom: "8px" }}>BILL TO</h3>
          {isEditingMode ? (
            <>
              <input type="text" value={invoiceData.billTo.name} onChange={e => updateInvoiceData("billTo.name", e.target.value)} placeholder="Client Name" style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px", marginBottom: "8px" }} />
              <textarea value={invoiceData.billTo.address} onChange={e => updateInvoiceData("billTo.address", e.target.value)} placeholder="Address" style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px", height: "64px", resize: "none", marginBottom: "8px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: "500" }}>GSTIN:</span>
                <input type="text" value={invoiceData.billTo.gstin} onChange={e => updateInvoiceData("billTo.gstin", e.target.value)} placeholder="GSTIN Number" style={{ flex: 1, border: "1px solid #d1d5db", padding: "8px" }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: "500" }}>{invoiceData.billTo.name}</div>
              <div style={{ fontSize: "14px", whiteSpace: "pre-line" }}>{invoiceData.billTo.address}</div>
              <div style={{ fontSize: "14px" }}><span style={{ fontWeight: "500" }}>GSTIN:</span> {invoiceData.billTo.gstin}</div>
            </>
          )}
        </div>

        <div style={{ backgroundColor: "#f9fafb", padding: "16px", borderLeft: "4px solid #2563eb", borderRadius: "4px" }}>
          <h3 style={{ fontWeight: "bold", color: "#2563eb", marginBottom: "8px" }}>SHIP TO</h3>
          {isEditingMode ? (
            <>
              <input type="text" value={invoiceData.shipTo.name} onChange={e => updateInvoiceData("shipTo.name", e.target.value)} placeholder="Recipient Name" style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px", marginBottom: "8px" }} />
              <textarea value={invoiceData.shipTo.address} onChange={e => updateInvoiceData("shipTo.address", e.target.value)} placeholder="Shipping Address" style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px", height: "64px", resize: "none" }} />
            </>
          ) : (
            <>
              <div style={{ fontWeight: "500" }}>{invoiceData.shipTo.name}</div>
              <div style={{ fontSize: "14px", whiteSpace: "pre-line" }}>{invoiceData.shipTo.address}</div>
            </>
          )}
        </div>
      </div>

      {/* ===== Items Table ===== */}
      <div style={{ marginBottom: "24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db" }}>
          <thead style={{ backgroundColor: "#2563eb", color: "#fff" }}>
            <tr>
              <th style={{ border: "1px solid #d1d5db", padding: "8px", width: 32 }}>#</th>
              <th style={{ border: "1px solid #d1d5db", padding: "8px" }}>Product Name</th>
              <th style={{ border: "1px solid #d1d5db", padding: "8px" }}>Duration</th>
              <th style={{ border: "1px solid #d1d5db", padding: "8px", width: 80 }}>HSN/SAC</th>
              <th style={{ border: "1px solid #d1d5db", padding: "8px", width: 120 }}>Amount (₹)</th>
              {isEditingMode && <th style={{ border: "1px solid #d1d5db", padding: "8px", width: 80 }}>Action</th>}
            </tr>
          </thead>

          <tbody>
            {invoiceData.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "center" }}>{idx + 1}</td>
                <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>
                  {isEditingMode ? (
                    <input type="text" value={item.productName} onChange={e => updateItem(idx, "productName", e.target.value)} placeholder="Product Name" style={{ width: "100%", border: "1px solid #d1d5db", padding: 4 }} />
                  ) : (
                    <div style={{ fontWeight: 500 }}>{item.productName}</div>
                  )}
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>
                  {isEditingMode ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input type="number" value={item.duration} onChange={e => updateItem(idx, "duration", Number(e.target.value))} style={{ width: 60, padding: 4 }} />
                      <select value={item.durationUnit} onChange={e => updateItem(idx, "durationUnit", e.target.value)} style={{ padding: 4 }}>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  ) : (
                    <span>{item.duration} {item.durationUnit}</span>
                  )}
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>
                  {isEditingMode ? (
                    <input type="text" value={item.hsnCode} onChange={e => updateItem(idx, "hsnCode", e.target.value)} placeholder="HSN/SAC" style={{ width: "100%", border: "1px solid #d1d5db", padding: 4 }} />
                  ) : (
                    <span>{item.hsnCode}</span>
                  )}
                </td>

                <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>
                  {isEditingMode ? (
                    <input type="number" value={item.amount} onChange={e => updateItem(idx, "amount", Number(e.target.value) || 0)} style={{ width: "100%", border: "1px solid #d1d5db", padding: 4 }} />
                  ) : (
                    <span>{item.amount.toFixed(2)}</span>
                  )}
                </td>

                {isEditingMode && (
                  <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => removeItem(idx)} style={{ padding: "4px 8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: 4, fontSize: 12 }}>×</button>
                      {idx === invoiceData.items.length - 1 && (
                        <button onClick={addItem} style={{ padding: "4px 8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, fontSize: 12 }}>+</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {/* Subtotal */}
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <td colSpan={4} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: 500 }}>Subtotal</td>
              <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: 500 }}>{invoiceData.subtotal.toFixed(2)}</td>
              {isEditingMode && <td></td>}
            </tr>

            {/* Tax */}
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <td colSpan={4} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: 14 }}>
                  Taxes:
                  {isEditingMode ? (
                    <>
                      <input type="number" value={invoiceData.cgstRate} onChange={e => { updateInvoiceData("cgstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% CGST +
                      <input type="number" value={invoiceData.sgstRate} onChange={e => { updateInvoiceData("sgstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% SGST +
                      <input type="number" value={invoiceData.ugstRate} onChange={e => { updateInvoiceData("ugstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% UGST +
                      <input type="number" value={invoiceData.igstRate} onChange={e => { updateInvoiceData("igstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% IGST
                    </>
                  ) : (
                    <span>{invoiceData.cgstRate}% CGST + {invoiceData.sgstRate}% SGST + {invoiceData.ugstRate}% UGST + {invoiceData.igstRate}% IGST</span>
                  )}
                </div>
              </td>
              <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: 500 }}>{invoiceData.totalTaxAmount.toFixed(2)}</td>
              {isEditingMode && <td></td>}
            </tr>

            {/* Total */}
            <tr style={{ backgroundColor: "#dbeafe", fontWeight: "bold" }}>
              <td colSpan={4} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right" }}><strong>Total Amount</strong></td>
              <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right" }}><strong>₹{invoiceData.totalAmount.toFixed(2)}</strong></td>
              {isEditingMode && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: 4, marginBottom: 24 }}>
        <p style={{ fontSize: 14, margin: 0 }}><strong>Amount in Words:</strong> {numberToWords(invoiceData.totalAmount)}</p>
      </div>

      {/* Payment Terms & Bank */}
    {/* Payment Terms and Bank Details */}
<div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24, marginBottom: 24 }}>
  {/* Payment Terms */}
  <div>
    <h3 style={{ fontWeight: "bold", color: "#2563eb", marginBottom: 8 }}>Payment Terms</h3>
    {isEditingMode ? (
      <textarea
        value={invoiceData.paymentTerms}
        onChange={(e) => updateInvoiceData("paymentTerms", e.target.value)}
        style={{ width: "100%", border: "1px solid #d1d5db", padding: 8, height: 80, resize: "none" }}
      />
    ) : (
      <div style={{ fontSize: 14, whiteSpace: "pre-line" }}>{invoiceData.paymentTerms}</div>
    )}

    <h3 style={{ fontWeight: "bold", color: "#2563eb", marginTop: 16, marginBottom: 8 }}>Terms & Conditions</h3>
    {isEditingMode ? (
      <textarea
        value={invoiceData.termsConditions}
        onChange={(e) => updateInvoiceData("termsConditions", e.target.value)}
        style={{ width: "100%", border: "1px solid #d1d5db", padding: 8, height: 80, resize: "none" }}
      />
    ) : (
      <div style={{ fontSize: 14, whiteSpace: "pre-line" }}>{invoiceData.termsConditions}</div>
    )}
  </div>

  {/* Bank Details */}
  <div>
    <h3 style={{ fontWeight: "bold", color: "#2563eb", marginBottom: 8 }}>Bank Details</h3>
    <div style={{ fontSize: 14 }}>
      {[
        { label: "Bank Name", key: "bankName" },
        { label: "Account Name", key: "accountName" },
        { label: "Account No.", key: "accountNumber" },
        { label: "IFSC Code", key: "ifscCode" },
      ].map(({ label, key }) => (
        <div key={label} style={{ display: "flex", marginBottom: 8 }}>
          <span style={{ fontWeight: 500, width: 96 }}>{label}:</span>
          {isEditingMode ? (
            <input
              type="text"
              value={invoiceData.bankDetails[key as keyof InvoiceData["bankDetails"]]}
              onChange={(e) => updateInvoiceData(`bankDetails.${key}`, e.target.value)}
              style={{ flex: 1, border: "1px solid #d1d5db", padding: 8 }}
            />
          ) : (
            <span>{invoiceData.bankDetails[key as keyof InvoiceData["bankDetails"]]}</span>
          )}
        </div>
      ))}
    </div>
  </div>
</div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 24, borderTop: "1px solid #d1d5db" }}>
        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{ borderBottom: "1px solid #6b7280", width: 192, marginBottom: 8 }}></div>
          <p style={{ fontSize: 14, margin: 0 }}>Authorized Signatory</p>
          <p style={{ fontSize: 14, margin: 0 }}>For {companyDetails.name}</p>
          {!isPhysicalCopy && (
            <img src={companyDetails.stamp || "/placeholder.svg"} alt="stamp" style={{ position: "absolute", top: -16, left: 96, width: 64, height: 64, opacity: 0.7 }} />
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderBottom: "1px solid #6b7280", width: 128, marginBottom: 8 }}></div>
          <p style={{ fontSize: 14, margin: 0 }}>Customer Signature</p>
        </div>
      </div>

      {/* Thank-you note */}
      <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb", color: "#2563eb" }}>
        <p style={{ fontSize: 14, margin: 0 }}>
          Thank you for your business! •
          <Phone style={{ width: 12, height: 12, display: "inline", margin: "0 4px" }} />
          {companyDetails.phone} •
          <Mail style={{ width: 12, height: 12, display: "inline", margin: "0 4px" }} />
          {companyDetails.email}
        </p>
      </div>
    </>
  )
}