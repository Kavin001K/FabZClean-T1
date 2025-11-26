import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { convertOrderToInvoiceData } from '@/lib/print-driver';
import { printDriver } from '@/lib/print-driver';

// Test order data
const testOrder = {
    id: '1764184186937',
    orderNumber: 'ORD-1764184186937',
    customerName: 'KAVINBALAJI S K',
    customerPhone: '08826700372',
    customerEmail: 'kavinbalaji365@gmail.com',
    shippingAddress: '(*institutions**)',
    totalAmount: 45.00,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'Cash',
    createdAt: new Date('2025-11-26'),
    items: [
        {
            name: 'Service Item',
            description: 'Dry cleaning service',
            quantity: 1,
            unitPrice: 45.00,
            total: 45.00,
            taxRate: 0.1
        }
    ],
    notes: 'Test order for invoice generation'
};

export default function TestInvoice() {
    const [generating, setGenerating] = useState(false);

    const handleGenerateInvoice = async () => {
        try {
            setGenerating(true);
            const invoiceData = convertOrderToInvoiceData(testOrder);
            await printDriver.printInvoice(invoiceData, 'invoice');
            console.log('Invoice generated successfully');
        } catch (error) {
            console.error('Failed to generate invoice:', error);
            alert('Failed to generate invoice: ' + (error as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Invoice Test Page</h1>
            <div className="bg-gray-100 p-4 rounded mb-4">
                <h2 className="font-semibold mb-2">Test Order Data:</h2>
                <pre className="text-xs overflow-auto">
                    {JSON.stringify(testOrder, null, 2)}
                </pre>
            </div>
            <Button
                onClick={handleGenerateInvoice}
                disabled={generating}
                className="w-full"
            >
                {generating ? 'Generating Invoice...' : 'Generate Test Invoice'}
            </Button>
        </div>
    );
}
