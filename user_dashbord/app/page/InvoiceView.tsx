"use client"

import React, { useRef, useState } from 'react'
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

  // Extract client and service data
  const clientData = assignmentData?.client_id || {}
  const serviceData = assignmentData?.service_catalog_id || {}
  const currency = serviceData?.currency || settings?.currency || 'USD'
  
  const getCurrencySymbol = (curr: string) => {
    const symbols: any = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', INR: '₹', JPY: '¥' }
    return symbols[curr] || '$'
  }
  const currencySymbol = getCurrencySymbol(currency)

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
    <div>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxHeight: '75vh',
        overflow: 'auto',
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
                border: '1px solid #e5e7eb',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#374151'
              }}
            >
              <X size={16} color="#374151" />
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
            boxSizing: 'border-box',
            pageBreakInside: 'avoid'
          }}>

            {/* Logo at Top */}
            {settings?.logo && (
              <div style={{ textAlign: 'center', marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <img
                  src={settings.logo}
                  alt="Company Logo"
                  style={{ height: '80px', maxWidth: '200px', display: 'inline-block', objectFit: 'contain' }}
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Logo & Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '40px',
              borderBottom: '2px solid #111827',
              paddingBottom: '20px',
              flexWrap: 'wrap',
              gap: '20px',
              pageBreakInside: 'avoid'
            }}>
              <div style={{ flex: '1', minWidth: '280px' }}>
                {settings?.logo && (
                  <img
                    src={settings.logo}
                    alt="Company Logo"
                    style={{ height: '60px', marginBottom: '16px', display: 'block', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                )}
                <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: '#111827' }}>
                  {settings?.appName || "Murphy's Technology"}
                </h1>
                <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                  {settings?.address && <p style={{ margin: '3px 0' }}>{settings.address}</p>}
                  {settings?.contactEmail && <p style={{ margin: '3px 0' }}>Email: {settings.contactEmail}</p>}
                  {settings?.contactPhone && <p style={{ margin: '3px 0' }}>Phone: {settings.contactPhone}</p>}
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '220px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 20px 0', letterSpacing: '2px' }}>INVOICE</h2>
                <div style={{ fontSize: '13px', textAlign: 'right' }}>
                  <p style={{ color: '#6b7280', margin: '0 0 4px 0', fontSize: '11px', textTransform: 'uppercase' }}>Invoice Number</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 12px 0', fontFamily: 'monospace' }}>
                    {assignmentData.invoice_id || `INV-${assignmentData._id?.slice(-8).toUpperCase()}`}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backgroundColor: '#f9fafb',
                      color: '#374151',
                      textAlign: 'center'
                    }}>
                      {assignmentData.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & Contract Info Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '30px',
              marginBottom: '40px',
              width: '100%',
              pageBreakInside: 'avoid'
            }}>
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
                  Bill To
                </h3>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 6px 0' }}>
                  {clientData.firstName && clientData.lastName ? `${clientData.firstName} ${clientData.lastName}` : assignmentData.client_name}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '3px 0' }}>{clientData.email || assignmentData.email}</p>
                {clientData.phone && <p style={{ fontSize: '13px', color: '#6b7280', margin: '3px 0' }}>{clientData.phone}</p>}
                {clientData.city && clientData.country && (
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '3px 0' }}>{clientData.city}, {clientData.country}</p>
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
                  Contract Information
                </h3>
                <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span style={{ color: '#6b7280' }}>Invoice Date:</span>
                    <span style={{ fontWeight: '600' }}>{format(new Date(assignmentData.createdAt || new Date()), 'MMM dd, yyyy')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span style={{ color: '#6b7280' }}>Billing Cycle:</span>
                    <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{assignmentData.cycle || 'One-time'}</span>
                  </div>
                  {assignmentData.start_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                      <span style={{ color: '#6b7280' }}>Service Period:</span>
                      <span style={{ fontWeight: '600' }}>
                        {format(new Date(assignmentData.start_date), 'MMM dd, yyyy')} - {assignmentData.end_date ? format(new Date(assignmentData.end_date), 'MMM dd, yyyy') : 'Ongoing'}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                    <span style={{ color: '#6b7280' }}>Currency:</span>
                    <span style={{ fontWeight: '600' }}>{currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '40px',
              tableLayout: 'fixed',
              pageBreakInside: 'auto'
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
                    <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px', fontSize: '14px' }}>
                      {serviceData.name || assignmentData.service_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Main Subscription</div>
                    {serviceData.description && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                        {serviceData.description.substring(0, 80)}{serviceData.description.length > 80 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '16px 12px', color: '#6b7280', fontSize: '13px', verticalAlign: 'middle' }}>
                    {assignmentData.start_date ? format(new Date(assignmentData.start_date), 'MMM dd, yyyy') : '-'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '16px 12px', fontWeight: '600', color: '#111827', fontSize: '15px', verticalAlign: 'middle' }}>
                    {currencySymbol}{parseFloat(assignmentData.price || '0').toFixed(2)}
                  </td>
                </tr>

                {allRenewals.filter((r: any) => r.haspaid).map((renewal: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', pageBreakInside: 'avoid' }}>
                    <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: '#ffffff',
                          color: '#374151',
                          border: '1px solid #d1d5db',
                          fontSize: '10px',
                          fontWeight: '600',
                          letterSpacing: '0.5px',
                          textAlign: 'center',
                          minWidth: '45px'
                        }}>
                          PAID
                        </span>
                        <span style={{ color: '#111827', fontWeight: '500' }}>{renewal.label || `Renewal #${i + 1}`}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px 12px', color: '#6b7280', fontSize: '13px', verticalAlign: 'middle' }}>
                      {renewal.date ? format(new Date(renewal.date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px 12px', fontWeight: '600', color: '#111827', fontSize: '15px', verticalAlign: 'middle' }}>
                      {currencySymbol}{parseFloat(renewal.price || '0').toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', width: '100%', pageBreakInside: 'avoid' }}>
              <div style={{ width: '320px', maxWidth: '100%', border: '1px solid #d1d5db' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Subtotal</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{currencySymbol}{calculateTotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>Tax (0%)</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{currencySymbol}0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: '#111827', fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                  <span>Total</span>
                  <span>{currencySymbol}{calculateTotal().toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>

            {/* Next Renewal */}
            {nextRenewalDate && (
              <div style={{
                border: '1px solid #d1d5db',
                padding: '20px',
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                pageBreakInside: 'avoid'
              }}>
                <div>
                  <h4 style={{ fontWeight: '600', color: '#111827', margin: '0 0 4px 0', fontSize: '14px' }}>Upcoming Renewal</h4>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>Next invoice generation date</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
                    {format(nextRenewalDate, 'MMM dd, yyyy')}
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0' }}>
                    Due Date
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', paddingTop: '40px', borderTop: '1px solid #e5e7eb', pageBreakInside: 'avoid' }}>
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