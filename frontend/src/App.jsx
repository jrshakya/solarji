import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/website/Home'
import QuotationGenerator from './pages/website/QuotationGenerator'
import Login from './pages/auth/Login'
import CRMDashboard from './pages/crm/CRMDashboard'
import Leads from './pages/crm/Leads'
import NewLead from './pages/crm/NewLead'
import LeadDetail from './pages/crm/LeadDetail'
import Users from './pages/crm/Users'
import StockDashboard from './pages/stock/StockDashboard'
import StockItems from './pages/stock/StockItems'
import VoucherForm from './pages/stock/VoucherForm'
import VoucherList from './pages/stock/VoucherList'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#111111',
            borderRadius: '14px',
            fontSize: '13.5px',
            fontWeight: '600',
            border: '1.5px solid #f0f0f0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: '12px 16px',
            maxWidth: '340px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#ffffff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quotation" element={<QuotationGenerator />} />
        <Route path="/login" element={<Login />} />
        <Route path="/crm" element={<ProtectedRoute><CRMDashboard /></ProtectedRoute>} />
        <Route path="/crm/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/crm/leads/new" element={<ProtectedRoute><NewLead /></ProtectedRoute>} />
        <Route path="/crm/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
        <Route path="/crm/users" element={<ProtectedRoute adminOnly={true}><Users /></ProtectedRoute>} />
        <Route path="/stock" element={<ProtectedRoute><StockDashboard /></ProtectedRoute>} />
        <Route path="/stock/items" element={<ProtectedRoute><StockItems /></ProtectedRoute>} />
        <Route path="/stock/voucher/add" element={<ProtectedRoute><VoucherForm type="ADD" /></ProtectedRoute>} />
        <Route path="/stock/voucher/sell" element={<ProtectedRoute><VoucherForm type="SELL" /></ProtectedRoute>} />
        <Route path="/stock/vouchers" element={<ProtectedRoute><VoucherList /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}