import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"

// Lazy load components
const Login = lazy(() => import("./_admin/login"))
const AdminLayout = lazy(() => import("./_admin/AdminLayout"))
const Dashboard = lazy(() => import("./_admin/Dashboard"))
const Company = lazy(() => import("./_admin/Company"))
const NewInvoice = lazy(() => import("./_admin/newInvoices/new-invoice"))
const AllInvoice = lazy(() => import("./_admin/newInvoices/allinvoice"))
const NewInvoiceUpdate = lazy(() => import("./_admin/updateinvoice/new-invoice"))
const Files = lazy(() => import("./_admin/Files"))
const ProtectedRoute = lazy(() => import("./_admin/ProtectedRoute"))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
              <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="company" element={<Company />} />
            <Route path="new-invoice/:companyId" element={<NewInvoice />} />
            <Route path="allinvoice/:companyId" element={<AllInvoice />} />
            <Route path="update/:_id" element={<NewInvoiceUpdate />} />
            <Route path="files" element={<Files />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
