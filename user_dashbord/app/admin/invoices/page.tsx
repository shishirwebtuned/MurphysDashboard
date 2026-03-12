'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/app/page/common/header'
import axiosInstance from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import InvoiceView from '@/app/page/InvoiceView'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import SpinnerComponent from '@/app/page/common/Spinner'
import Link from 'next/link'

const InvoicesPage = () => {
  const [loading, setLoading] = useState(false)
  const [assigned, setAssigned] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all'|'unpaid'|'overdue'|'paid'>('all')
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [viewInvoiceData, setViewInvoiceData] = useState<any | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const assignRes = await axiosInstance.get('/billing/info')
        setAssigned(assignRes.data?.data || [])
      } catch (err) {
        console.error('Error fetching billing data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Flatten renewals: one row per renewal
  const rows = useMemo(() => {
    const r: any[] = []
    const today = new Date()

    assigned.forEach((svc: any) => {
      const renewals = Array.isArray(svc.renewal_dates) ? svc.renewal_dates : []
      
      if (renewals.length === 0) {
        // No renewals yet - show "No payment required" status
        r.push({
          source: 'service',
          serviceId: svc._id,
          invoiceId: svc.invoice_id,
          serviceName: svc.service_name,
          issueDate: svc.createdAt || svc.start_date,
          dueDate: null,
          amount: 0,
          paid: false,
          isOverdue: false,
          noPaymentRequired: true,
          raw: svc,
        })
      } else {
        renewals.forEach((ren: any) => {
          const hasPaid = ren.haspaid
          const dueDate = ren.date ? new Date(ren.date) : null
          const isOverdue = !!(dueDate && !hasPaid && dueDate < today)

          r.push({
            source: 'renewal',
            serviceId: svc._id,
            invoiceId: svc.invoice_id,
            renewalId: ren._id,
            serviceName: svc.service_name,
            issueDate: svc.createdAt || svc.start_date,
            dueDate: ren.date || null,
            amount: Number(ren.price || svc.price || 0),
            paid: hasPaid,
            isOverdue,
            noPaymentRequired: false,
            raw: svc
          })
        })
      }
    })

    return r
  }, [assigned])

  // Filtering & search
  const filtered = useMemo(() => {
    const filteredRows = rows.filter((row) => {
      const q = search.trim().toLowerCase()
      if (q) {
        const match = String(row.invoiceId || row.serviceId || row.serviceName || '').toLowerCase()
        if (!match.includes(q)) return false
      }

      if (status === 'paid') return !!row.paid
      if (status === 'unpaid') return !row.paid && !row.isOverdue
      if (status === 'overdue') return !!row.isOverdue
      return true
    })

    // Sort to show unpaid at the top
    return filteredRows.sort((a, b) => {
      // Priority: overdue > unpaid > paid
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      if (!a.paid && b.paid) return -1
      if (a.paid && !b.paid) return 1
      return 0
    })
  }, [rows, search, status])

  const openInvoice = (row: any) => {
    setViewInvoiceData(row.raw)
    setInvoiceOpen(true)
  }

  return (
    <div className="space-y-6">
      {loading && <SpinnerComponent />}
      <Header title="Invoices" description="View and pay your invoice" 
      extra={
          <div className="flex items-center justify-between gap-4">
     
        <div className="flex items-center gap-2">
          <Button 
            variant={status === 'all' ? 'default' : 'outline'}
            className={status === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            onClick={() => setStatus('all')}
          >
            All
          </Button>
          <Button 
            variant={status === 'unpaid' ? 'default' : 'outline'}
            className={status === 'unpaid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            onClick={() => setStatus('unpaid')}
          >
            Unpaid
          </Button>
          <Button 
            variant={status === 'overdue' ? 'default' : 'outline'}
            className={status === 'overdue' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            onClick={() => setStatus('overdue')}
          >
            Overdue
          </Button>
          <Button 
            variant={status === 'paid' ? 'default' : 'outline'}
            className={status === 'paid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            onClick={() => setStatus('paid')}
          >
            Paid
          </Button>
        </div>
      </div>

      }
      />

    

      <div className="bg-white dark:bg-zinc-900 rounded-lg border overflow-hidden">
        <div className="w-full overflow-x-auto">
        <table className="w-full text-left min-w-[720px] sm:min-w-full">
          <thead className="border-b">
            <tr className="text-sm text-gray-500 dark:text-gray-400">
              <th className="p-4 font-medium">Invoice</th>
              <th className="p-4 font-medium hidden sm:table-cell">Service Name</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium hidden sm:table-cell">Issue Date</th>
              <th className="p-4 font-medium hidden sm:table-cell">Due Date</th>
              <th className="p-4 font-medium text-right">Amount</th>
              <th className="p-4 font-medium text-right hidden md:table-cell">Amount</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr 
                key={idx} 
                className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="p-4">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {row.invoiceId || `INV-${String(row.serviceId).slice(-6)}`}
                  </div>
                  {/* show service name on small screens inside the first cell */}
                  <div className="sm:hidden text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {row.serviceName || '-'}
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {row.serviceName || '-'}
                  </div>
                </td>

                <td className="p-4">
                  {row.noPaymentRequired ? (
                    <Badge 
                      variant="secondary"
                      className="bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                    >
                      Pending
                    </Badge>
                  ) : (
                    <Badge 
                      variant={row.paid ? 'default' : row.isOverdue ? 'destructive' : 'secondary'}
                      className={
                        row.paid 
                          ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300' 
                          : row.isOverdue 
                            ? 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300' 
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300'
                      }
                    >
                      {row.paid ? 'Paid' : row.isOverdue ? 'Overdue' : 'Sent'}
                    </Badge>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {row.issueDate ? new Date(row.issueDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '-'}
                </td>
                <td className="p-4 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {row.noPaymentRequired 
                    ? <span className="text-gray-500 italic">Available soon</span>
                    : row.dueDate 
                      ? new Date(row.dueDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) 
                      : '-'
                  }
                </td>
                <td className="p-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                  {row.noPaymentRequired ? '-' : row.amount > 0 ? `$${row.amount.toLocaleString()}` : '-'}
                </td>
                <td className="p-4 text-right font-semibold text-gray-900 dark:text-gray-100 hidden md:table-cell">
                  {row.noPaymentRequired ? '-' : row.amount > 0 ? `$${row.amount.toLocaleString()}` : '-'}
                </td>
                <td className="p-4 text-right">
                  {row.noPaymentRequired ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No payment required
                    </span>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                 
                    <button 
                      title="View" 
                      onClick={() => openInvoice(row)} 
                      className="inline-flex cursor-pointer items-center justify-center p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Eye className="h-4 w-4"/>
                    </button>
                    {!row.paid && (
                        <Link href='/admin/billing'>
                      <Button 

                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Pay Now
                      </Button>
                      </Link>
                    )}
                  </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-gray-500 dark:text-gray-400">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

    
     

      {/* Invoice Modal */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[900px] max-h-[95vh] p-0 gap-0 overflow-hidden">
          {viewInvoiceData && (
            <InvoiceView assignmentData={viewInvoiceData} onClose={() => setInvoiceOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvoicesPage