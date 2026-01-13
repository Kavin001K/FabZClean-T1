import React, { forwardRef } from 'react';

interface TransitOrder {
    orderNumber: string;
    customerName: string;
    status: string;
    itemCount?: number;
}

interface TransitPrintData {
    transitId: string;
    type: string;
    createdAt: string;
    orders: TransitOrder[];
    vehicleDetails?: {
        vehicleNumber?: string;
        vehicleType?: string;
        driverName?: string;
        driverPhone?: string;
        driverLicense?: string;
    };
    storeDetails?: {
        name?: string;
        address?: string;
        phone?: string;
    };
    factoryDetails?: {
        name?: string;
        address?: string;
    };
}

interface TransitPrintTemplateProps {
    data: TransitPrintData;
}

export const TransitPrintTemplate = forwardRef<HTMLDivElement, TransitPrintTemplateProps>(
    ({ data }, ref) => {
        const isToFactory = data.type === 'To Factory' || data.type === 'store_to_factory';
        const formattedDate = new Date(data.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return (
            <div ref={ref} className="transit-print-template" style={{
                width: '210mm',
                minHeight: '148mm', // A5 height
                padding: '10mm',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                background: 'white',
                color: 'black'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #333',
                    paddingBottom: '8px',
                    marginBottom: '10px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                            TRANSIT CHALLAN
                        </h1>
                        <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>
                            {isToFactory ? 'Store → Factory' : 'Factory → Store'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                            {data.transitId}
                        </p>
                        <p style={{ margin: '2px 0', fontSize: '10px' }}>
                            {formattedDate}
                        </p>
                    </div>
                </div>

                {/* Vehicle & Driver Details */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '10px',
                    padding: '8px',
                    background: '#f5f5f5',
                    borderRadius: '4px'
                }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '10px' }}>Vehicle</p>
                        <p style={{ margin: '2px 0' }}>
                            {data.vehicleDetails?.vehicleNumber || '-'} ({data.vehicleDetails?.vehicleType || '-'})
                        </p>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '10px' }}>Driver</p>
                        <p style={{ margin: '2px 0' }}>
                            {data.vehicleDetails?.driverName || '-'} | {data.vehicleDetails?.driverPhone || '-'}
                        </p>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '10px' }}>License</p>
                        <p style={{ margin: '2px 0' }}>
                            {data.vehicleDetails?.driverLicense || '-'}
                        </p>
                    </div>
                </div>

                {/* From/To Section */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '10px'
                }}>
                    <div style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '10px', color: '#666' }}>FROM</p>
                        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                            {isToFactory ? (data.storeDetails?.name || 'Store') : (data.factoryDetails?.name || 'Factory')}
                        </p>
                        <p style={{ margin: '2px 0', fontSize: '10px' }}>
                            {isToFactory ? data.storeDetails?.address : data.factoryDetails?.address}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '20px' }}>→</div>
                    <div style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '10px', color: '#666' }}>TO</p>
                        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                            {isToFactory ? (data.factoryDetails?.name || 'Factory') : (data.storeDetails?.name || 'Store')}
                        </p>
                        <p style={{ margin: '2px 0', fontSize: '10px' }}>
                            {isToFactory ? data.factoryDetails?.address : data.storeDetails?.address}
                        </p>
                    </div>
                </div>

                {/* Orders Table */}
                <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '12px' }}>
                        Orders ({data.orders?.length || 0})
                    </p>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '10px'
                    }}>
                        <thead>
                            <tr style={{ background: '#333', color: 'white' }}>
                                <th style={{ padding: '6px', textAlign: 'left', width: '40px' }}>#</th>
                                <th style={{ padding: '6px', textAlign: 'left' }}>Order Number</th>
                                <th style={{ padding: '6px', textAlign: 'left' }}>Customer</th>
                                <th style={{ padding: '6px', textAlign: 'center', width: '80px' }}>Items</th>
                                <th style={{ padding: '6px', textAlign: 'center', width: '80px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.orders && data.orders.length > 0 ? (
                                data.orders.map((order, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '5px' }}>{index + 1}</td>
                                        <td style={{ padding: '5px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {order.orderNumber || '-'}
                                        </td>
                                        <td style={{ padding: '5px' }}>{order.customerName || '-'}</td>
                                        <td style={{ padding: '5px', textAlign: 'center' }}>{order.itemCount || '-'}</td>
                                        <td style={{ padding: '5px', textAlign: 'center' }}>{order.status || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                                        No orders in this transit
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                    marginBottom: '15px'
                }}>
                    <div>
                        <strong>Total Orders:</strong> {data.orders?.length || 0}
                    </div>
                </div>

                {/* Signatures */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                    paddingTop: '10px'
                }}>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ borderTop: '1px solid #333', paddingTop: '4px', marginTop: '30px' }}>
                            <p style={{ margin: 0, fontSize: '10px' }}>Sender Signature</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ borderTop: '1px solid #333', paddingTop: '4px', marginTop: '30px' }}>
                            <p style={{ margin: 0, fontSize: '10px' }}>Driver Signature</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ borderTop: '1px solid #333', paddingTop: '4px', marginTop: '30px' }}>
                            <p style={{ margin: 0, fontSize: '10px' }}>Receiver Signature</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '15px',
                    paddingTop: '8px',
                    borderTop: '1px dashed #ccc',
                    textAlign: 'center',
                    fontSize: '9px',
                    color: '#666'
                }}>
                    <p style={{ margin: '2px 0' }}>
                        This is a computer generated challan. Please retain for your records.
                    </p>
                    <p style={{ margin: '2px 0' }}>
                        Generated on {new Date().toLocaleString('en-IN')}
                    </p>
                </div>

                {/* Print Styles */}
                <style>{`
          @media print {
            .transit-print-template {
              width: 100% !important;
              min-height: auto !important;
              padding: 5mm !important;
              margin: 0 !important;
            }
            @page {
              size: A5 landscape;
              margin: 5mm;
            }
          }
        `}</style>
            </div>
        );
    }
);

TransitPrintTemplate.displayName = 'TransitPrintTemplate';

export default TransitPrintTemplate;
