import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  Download,
  Loader2,
  BadgeCheck,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

const InvoiceModal = ({ invoice, user, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  if (!invoice) return null;

  const rawOrderId = invoice.orderId || invoice._id || '000000';
  const invoiceNo = `INV-2026-${rawOrderId.slice(-6).toUpperCase()}`;
  const purchaseDate = invoice.purchasedAt
    ? new Date(invoice.purchasedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const pricePaid = Number(invoice.pricePaid || invoice.totalAmount || invoice.project?.price || 299);
  const taxAmount = Math.round(pricePaid * 0.18);
  const baseAmount = pricePaid - taxAmount;
  const projectName = invoice.project?.title || invoice.titleAtPurchase || 'Developer Source Code & Architecture';
  const projectCategory = invoice.project?.category || 'Full-Stack Software';
  const licenseType = invoice.licenseType || 'Commercial License';

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);

    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${invoiceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(invoiceRef.current).save();
    } catch (err) {
      console.error('PDF Generation failed, opening print dialogue instead:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="invoice-modal-wrapper animate-fade-in"
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Action Bar (Hidden during Print) */}
        <div
          className="invoice-top-actions no-print"
          style={{
            background: 'var(--bg-secondary, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '14px 14px 0 0',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff', display: 'block' }}>
                Tax Invoice & Official Receipt
              </span>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {invoiceNo} • 100% Tax Compliant
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Primary 1-Click PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#10b981',
                borderColor: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
              }}
              title="Download clean .PDF file directly to your device"
            >
              {downloading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              title="Print Receipt"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                marginLeft: '4px',
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div
          style={{
            overflowY: 'auto',
            borderRadius: '0 0 14px 14px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Printable White A4 Sheet */}
          <div
            id="printable-invoice"
            ref={invoiceRef}
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              padding: '36px 40px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              lineHeight: 1.5,
              fontSize: '13px',
            }}
          >
            {/* Top Header Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '20px',
                borderBottom: '2px solid #e2e8f0',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      background: '#4f46e5',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <Terminal size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
                      ApexMarket
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Digital Developer Store
                    </span>
                  </div>
                </div>

                <div style={{ color: '#475569', fontSize: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div><strong>Merchant:</strong> Khushal Jangid</div>
                  <div><strong>Official Portfolio:</strong> <span style={{ color: '#4f46e5' }}>webkhushal-nu.vercel.app</span></div>
                  <div><strong>UPI Merchant ID:</strong> <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#0f172a' }}>7303354598@omni</code></div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    marginBottom: '8px',
                  }}
                >
                  <CheckCircle2 size={14} /> PAYMENT COMPLETED
                </div>

                <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                  {invoiceNo}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Invoice Date: <strong style={{ color: '#0f172a' }}>{purchaseDate}</strong>
                </div>
              </div>
            </div>

            {/* Billed To and Order Summary Boxes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  Billed To (Customer):
                </span>
                <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f172a' }}>
                  {user?.name || 'Verified Buyer'}
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                  {user?.email || 'buyer@domain.com'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BadgeCheck size={14} /> Verified Buyer License Granted
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                  Payment & Transaction Details:
                </span>
                <div style={{ fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    <strong>Order Reference:</strong> <code style={{ color: '#4f46e5', fontWeight: 700 }}>{rawOrderId}</code>
                  </div>
                  <div>
                    <strong>Payment Method:</strong> UPI QR Instant Verification
                  </div>
                  <div>
                    <strong>Fulfillment:</strong> Direct Digital Asset Unlocked
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Item Description</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800 }}>License</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800 }}>Qty</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800 }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '16px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <strong style={{ color: '#0f172a', fontSize: '14px', display: 'block', marginBottom: '3px' }}>
                        {projectName}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Category: {projectCategory} • Full Source Code & Architecture Guide Included
                      </span>
                    </td>
                    <td style={{ padding: '16px 14px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      <span
                        style={{
                          background: '#ede9fe',
                          color: '#6d28d9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {licenseType}
                      </span>
                    </td>
                    <td style={{ padding: '16px 14px', textAlign: 'center', color: '#475569', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
                      1
                    </td>
                    <td style={{ padding: '16px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                      ₹{pricePaid}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
              <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Taxable Base Value:</span>
                  <span style={{ fontWeight: 600 }}>₹{baseAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Estimated GST (18% Included):</span>
                  <span style={{ fontWeight: 600 }}>₹{taxAmount}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '2px solid #0f172a',
                    fontSize: '17px',
                    fontWeight: 900,
                    color: '#0f172a',
                  }}
                >
                  <span>Grand Total Paid:</span>
                  <span style={{ color: '#059669', fontSize: '19px' }}>₹{pricePaid}</span>
                </div>
              </div>
            </div>

            {/* Footer with Legal Notice and Digital Seal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '20px',
                borderTop: '2px dashed #cbd5e1',
                fontSize: '11px',
                color: '#64748b',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ maxWidth: '420px' }}>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  <strong>Digital Goods Delivery Confirmation:</strong> This official receipt validates full commercial & learning rights for the purchased software artifact. All sales grant permanent access to updates on ApexMarket.
                </p>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
                  Support inquiries: <code>7303354598@omni</code> • Authorized by Khushal Jangid
                </p>
              </div>

              <div style={{ textAlign: 'center', minWidth: '150px' }}>
                <div
                  style={{
                    fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                    fontSize: '22px',
                    color: '#4338ca',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}
                >
                  Khushal Jangid
                </div>
                <div
                  style={{
                    borderTop: '1px solid #94a3b8',
                    paddingTop: '3px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#334155',
                  }}
                >
                  Authorized Merchant Seal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive & Print Styles */}
      <style>{`
        @media (max-width: 640px) {
          #printable-invoice {
            padding: 20px 16px !important;
          }
          .invoice-top-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .invoice-top-actions > div:last-child {
            width: 100% !important;
            justifyContent: space-between !important;
          }
          .invoice-top-actions .btn {
            flex: 1 !important;
            justify-content: center !important;
          }
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-modal-wrapper {
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
