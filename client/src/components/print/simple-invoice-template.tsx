import React from 'react';

interface InvoiceData {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    company: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logo?: string;
    };
    customer: {
        name: string;
        address: string;
        phone: string;
        email: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal: number;
    deliveryCharges?: number;
    expressSurcharge?: number;
    total: number;
    paymentTerms: string;
    notes?: string;
    qrCode?: string;
    isExpressOrder?: boolean;
}

// Self-contained utility functions
const formatIndianCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SimpleInvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => {
    const {
        invoiceNumber,
        invoiceDate,
        customer,
        items,
        subtotal,
        deliveryCharges = 0,
        expressSurcharge = 0,
        total,
        qrCode,
        isExpressOrder = false,
    } = data;

    // HARDCODED COMPANY DETAILS
    const companyDetails = {
        name: "Fab Clean",
        address: "#16, Venkatramana Round Road,\nOpp to HDFC Bank,\nMahalingapuram, Pollachi - 642002",
        phone: "+91 93630 59595",
        email: "support@myfabclean.com",
        logo: "/assets/logo.webp"
    };

    // Brand Colors
    const colors = {
        primary: '#84cc16', // Lime Green
        secondary: '#3f6212', // Dark Green
        light: '#ecfccb', // Light Lime
        text: '#1a1a1a',
        gray: '#6b7280',
        express: '#ea580c', // Orange for EXPRESS
        expressLight: '#fff7ed', // Light orange bg
    };

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '40px',
            width: '210mm',
            minHeight: '297mm',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: colors.text,
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* EXPRESS Watermark Background */}
            {isExpressOrder && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-35deg)',
                    fontSize: '120px',
                    fontWeight: '900',
                    color: colors.express,
                    opacity: 0.06,
                    letterSpacing: '15px',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 0,
                    userSelect: 'none',
                }}>
                    EXPRESS
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.secondary }}>{companyDetails.name}</h1>
                    <p style={{ whiteSpace: 'pre-line', color: colors.gray, fontSize: '12px' }}>{companyDetails.address}</p>
                    <p style={{ color: colors.gray, fontSize: '12px' }}>{companyDetails.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {/* EXPRESS Badge */}
                    {isExpressOrder && (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: `linear-gradient(135deg, ${colors.express} 0%, #c2410c 100%)`,
                            color: 'white',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            marginBottom: '8px',
                            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                            letterSpacing: '1px',
                        }}>
                            ⚡ EXPRESS ORDER
                        </div>
                    )}
                    <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: isExpressOrder ? colors.express : colors.primary }}>INVOICE</h2>
                    <p style={{ fontWeight: 'bold' }}>#{invoiceNumber}</p>
                    <p style={{ fontSize: '12px' }}>Date: {new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
                </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: colors.light, borderRadius: '8px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: colors.secondary, textTransform: 'uppercase', marginBottom: '8px' }}>Bill To</h3>
                <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{customer.name}</p>
                <p>{customer.phone}</p>
                {customer.address && <p style={{ whiteSpace: 'pre-line', fontSize: '13px' }}>{customer.address}</p>}
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.primary}` }}>
                        <th style={{ textAlign: 'left', padding: '10px', color: colors.secondary }}>Description</th>
                        <th style={{ textAlign: 'center', padding: '10px', color: colors.secondary }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '10px', color: colors.secondary }}>Price</th>
                        <th style={{ textAlign: 'right', padding: '10px', color: colors.secondary }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.description}</td>
                            <td style={{ textAlign: 'center', padding: '10px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '10px' }}>{item.unitPrice.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span>Subtotal</span>
                        <span>{formatIndianCurrency(subtotal)}</span>
                    </div>
                    {deliveryCharges > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>Delivery Charges</span>
                            <span>{formatIndianCurrency(deliveryCharges)}</span>
                        </div>
                    )}
                    {/* EXPRESS Surcharge */}
                    {isExpressOrder && expressSurcharge > 0 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                            padding: '8px 10px',
                            background: colors.expressLight,
                            borderRadius: '6px',
                            border: `1px solid ${colors.express}30`,
                        }}>
                            <span style={{
                                color: colors.express,
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}>
                                ⚡ Express Surcharge (50%)
                            </span>
                            <span style={{ color: colors.express, fontWeight: '700' }}>
                                {formatIndianCurrency(expressSurcharge)}
                            </span>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: isExpressOrder ? colors.express : colors.secondary,
                        borderTop: `2px solid ${isExpressOrder ? colors.express : colors.primary}`,
                        paddingTop: '10px'
                    }}>
                        <span>Total</span>
                        <span>{formatIndianCurrency(total)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '12px', color: colors.gray }}>
                <p>Thank you for your business!</p>
                {qrCode && (
                    <div style={{ marginTop: '20px' }}>
                        <img src={qrCode} alt="Payment QR" style={{ width: '100px', height: '100px' }} />
                        <p style={{ marginTop: '5px' }}>Scan to Pay</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimpleInvoiceTemplate;
