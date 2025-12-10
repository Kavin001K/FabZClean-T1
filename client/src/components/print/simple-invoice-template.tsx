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
    total: number;
    paymentTerms: string;
    notes?: string;
    qrCode?: string;
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
        total,
        qrCode,
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
        gray: '#6b7280'
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
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.secondary }}>{companyDetails.name}</h1>
                    <p style={{ whiteSpace: 'pre-line', color: colors.gray, fontSize: '12px' }}>{companyDetails.address}</p>
                    <p style={{ color: colors.gray, fontSize: '12px' }}>{companyDetails.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>INVOICE</h2>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '250px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: colors.secondary, borderTop: `2px solid ${colors.primary}`, paddingTop: '10px' }}>
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
