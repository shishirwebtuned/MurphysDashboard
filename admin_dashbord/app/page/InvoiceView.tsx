"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format, addMonths, addYears } from 'date-fns'
import { useAppSelector } from '@/lib/redux/hooks'

interface InvoiceViewProps {
  assignmentData: any
  onClose: () => void
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ assignmentData, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement | null>(null)
  const { settings } = useAppSelector((state) => state.siteSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setIsDarkMode(m.matches)
    update()
    if (m.addEventListener) m.addEventListener('change', update)
    else m.addListener(update)
    return () => {
      if (m.removeEventListener) m.removeEventListener('change', update)
      else m.removeListener(update)
    }
  }, [])

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      alert('Invoice content not found')
      return
    }

    setIsGenerating(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-invoice-content]') as HTMLElement
          if (!clonedElement) return

          // Remove all existing stylesheets
          const allStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
          allStyles.forEach(style => style.remove())

          // Create a comprehensive inline style sheet
          const safeStylesheet = clonedDoc.createElement('style')
          safeStylesheet.textContent = `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body, html {
              background-color: #ffffff !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            [data-invoice-content] {
              background-color: #ffffff !important;
              padding: 60px !important;
              width: 100% !important;
              max-width: 800px !important;
              margin: 0 auto !important;
              border: 1px solid #e5e7eb !important;
              color: #111827 !important;
              font-family: Arial, sans-serif !important;
              box-sizing: border-box !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            img {
              max-width: 100% !important;
              height: auto !important;
            }
          `
          clonedDoc.head.appendChild(safeStylesheet)

          // Force inline styles on all elements
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(el)

              // Preserve critical layout styles
              const criticalStyles = [
                'display', 'width', 'height', 'padding', 'margin',
                'text-align', 'font-size', 'font-weight', 'color',
                'background-color', 'border', 'border-radius',
                'flex-direction', 'justify-content', 'align-items',
                'grid-template-columns', 'gap', 'line-height'
              ]

              let inlineStyle = ''
              criticalStyles.forEach(prop => {
                const value = computedStyle.getPropertyValue(prop)
                if (value && value !== 'none' && value !== 'normal') {
                  // Replace CSS variables with actual colors
                  let cleanValue = value
                  if (value.includes('var(')) {
                    cleanValue = value.replace(/var\([^)]+\)/g, (match) => {
                      if (prop.includes('background')) return '#ffffff'
                      if (prop.includes('color')) return '#111827'
                      if (prop.includes('border')) return '#e5e7eb'
                      return value
                    })
                  }
                  inlineStyle += `${prop}: ${cleanValue}; `
                }
              })

              if (inlineStyle) {
                el.setAttribute('style', inlineStyle)
              }
            }
          })
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'px', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const ratio = pdfWidth / canvas.width
      const imgHeight = canvas.height * ratio

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`Invoice_${assignmentData.client_name || 'Client'}.pdf`)
    } catch (error: any) {
      console.error('PDF Error:', error)
      alert('PDF generation failed: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const calculateTotal = () => {
    const basePrice = parseFloat(assignmentData.price || 0)
    const renewalTotal = (assignmentData.renewal_dates || [])
      .filter((r: any) => r.haspaid)
      .reduce((sum: number, r: any) => sum + parseFloat(r.price || 0), 0)
    return basePrice + renewalTotal
  }

  const getNextRenewalDate = () => {
    if (!assignmentData.end_date || assignmentData.cycle === 'none') return null
    const endDate = new Date(assignmentData.end_date)
    if (isNaN(endDate.getTime())) return null

    const now = new Date()
    let nextDate = new Date(endDate)

    if (assignmentData.cycle === 'monthly') nextDate = addMonths(endDate, 1)
    else if (assignmentData.cycle === 'annual') nextDate = addYears(endDate, 1)

    return nextDate > now ? nextDate : null
  }

  const nextRenewalDate = getNextRenewalDate()
  const allRenewals = [...(assignmentData.renewal_dates || [])].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div style={{
      position: 'fixed',
      inset: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 99,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>

        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0', color: '#111827' }}>Invoice</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              style={{
                backgroundColor: isGenerating ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: isDarkMode ? '#ffffff' : '#111827'
              }}
            >
              <X size={16} color={isDarkMode ? '#ffffff' : '#111827'} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div style={{ padding: '40px', backgroundColor: '#f9fafb' }}>
          <div ref={invoiceRef} data-invoice-content style={{
            backgroundColor: '#ffffff',
            padding: '60px',
            maxWidth: '800px',
            margin: '0 auto',
            border: '1px solid #e5e7eb',
            color: '#111827',
            fontFamily: 'Arial, sans-serif',
            boxSizing: 'border-box'
          }}>

            {/* Logo & Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '40px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '20px',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div style={{ flex: '1', minWidth: '250px' }}>
                {settings?.logo && (
                  <img
                    src={settings.logo}
                    alt="Logo"
                    style={{ height: '60px', marginBottom: '20px', display: 'block' }}
                    crossOrigin="anonymous"
                  />
                )}
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#111827' }}>
                  {settings?.appName || "Murphy's Admin"}
                </h1>
                <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                  <p style={{ margin: '4px 0' }}>{settings?.address || '123 Business Street'}</p>
                  <p style={{ margin: '4px 0' }}>{settings?.contactEmail || 'invoice@company.com'}</p>
                  <p style={{ margin: '4px 0' }}>{settings?.contactPhone || '+1 (555) 000-0000'}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '200px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '300', color: '#d1d5db', margin: '0 0 20px 0', letterSpacing: '2px' }}>INVOICE</h2>
                <div style={{ fontSize: '14px' }}>
                  <p style={{ color: '#6b7280', margin: '4px 0' }}>Invoice #</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '4px 0' }}>
                    INV-{assignmentData._id?.slice(-6).toUpperCase()}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'capitalize',
                    letterSpacing: '0.5px'
                  }}>
                    {assignmentData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              marginBottom: '40px',
              width: '100%'
            }}>
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Billed To
                </h3>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '4px 0' }}>{assignmentData.client_name}</p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>{assignmentData.email}</p>
              </div>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Issue Date
                  </h3>
                  <p style={{ fontSize: '14px', color: '#111827', fontWeight: '500', margin: '0' }}>{format(new Date(), 'MMM dd, yyyy')}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    Billing Cycle
                  </h3>
                  <p style={{ fontSize: '14px', color: '#111827', fontWeight: '500', margin: '0', textTransform: 'capitalize' }}>{assignmentData.cycle}</p>
                </div>
                {assignmentData.start_date && (
                  <div>
                    <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      Service Period
                    </h3>
                    <p style={{ fontSize: '14px', color: '#111827', fontWeight: '500', margin: '0' }}>
                      {format(new Date(assignmentData.start_date), 'MMM dd, yyyy')} - {assignmentData.end_date ? format(new Date(assignmentData.end_date), 'MMM dd, yyyy') : 'Ongoing'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '40px',
              tableLayout: 'fixed'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '14px 12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#111827',
                    borderBottom: '2px solid #e5e7eb',
                    width: '50%',
                    verticalAlign: 'middle'
                  }}>
                    Description
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '14px 12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#111827',
                    borderBottom: '2px solid #e5e7eb',
                    width: '25%',
                    verticalAlign: 'middle'
                  }}>
                    Date
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: '14px 12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#111827',
                    borderBottom: '2px solid #e5e7eb',
                    width: '25%',
                    verticalAlign: 'middle'
                  }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>{assignmentData.service_name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Main Subscription</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '16px 12px', color: '#6b7280', fontSize: '14px', verticalAlign: 'middle' }}>
                    {assignmentData.start_date ? format(new Date(assignmentData.start_date), 'MMM dd, yyyy') : '-'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '16px 12px', fontWeight: '600', color: '#111827', fontSize: '14px', verticalAlign: 'middle' }}>
                    ${parseFloat(assignmentData.price || '0').toFixed(2)}
                  </td>
                </tr>

                {allRenewals.filter((r: any) => r.haspaid).map((renewal: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f0fdf4' }}>
                    <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          border: '1px solid #6ee7b7',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.3px'
                        }}>
                          PAID
                        </span>
                        <span style={{ color: '#374151', fontWeight: '500' }}>{renewal.label || `Renewal #${i + 1}`}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px 12px', color: '#6b7280', fontSize: '14px', verticalAlign: 'middle' }}>
                      {renewal.date ? format(new Date(renewal.date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px 12px', fontWeight: '600', color: '#111827', fontSize: '14px', verticalAlign: 'middle' }}>
                      ${parseFloat(renewal.price || '0').toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', width: '100%' }}>
              <div style={{ width: '300px', maxWidth: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '14px' }}>
                  <span>Subtotal</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '14px' }}>
                  <span>Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Next Renewal */}
            {nextRenewalDate && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <h4 style={{ fontWeight: '600', color: '#1e3a8a', margin: '0 0 4px 0', fontSize: '16px' }}>Upcoming Renewal</h4>
                  <p style={{ fontSize: '14px', color: '#1e40af', margin: '0' }}>Next invoice generation date</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 4px 0' }}>
                    {format(nextRenewalDate, 'MMM dd, yyyy')}
                  </p>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '1px', margin: '0' }}>
                    Due Date
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', paddingTop: '40px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ margin: '8px 0' }}>{settings?.footerText || 'Thank you for your business!'}</p>
              <p style={{ fontSize: '11px', margin: '8px 0' }}>Generated by {settings?.appName || "Murphy's Admin"}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceView