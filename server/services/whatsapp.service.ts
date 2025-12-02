import axios from 'axios';

// Load from .env
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '480091AbJuma92Ie692de24aP1'; // Fallback to your key
const MSG91_INTEGRATED_NUMBER = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';

// Define the parameters we need to send a bill
interface SendBillParams {
    customerName: string;
    customerPhone: string;
    orderId: string;
    amount: string;       // For body_3
    paymentLink: string;  // For body_4
    pdfUrl: string;       // The hosted URL of the PDF
}

export const sendWhatsAppBill = async (params: SendBillParams) => {
    try {
        const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

        const data = {
            integrated_number: MSG91_INTEGRATED_NUMBER,
            content_type: "template",
            payload: {
                messaging_product: "whatsapp",
                type: "template",
                template: {
                    name: "bill", // The specific template name you provided
                    language: {
                        code: "en",
                        policy: "deterministic"
                    },
                    namespace: "1520cd50_8420_404b_b634_4808f5f33034", // Your specific namespace
                    to_and_components: [
                        {
                            to: [
                                // MSG91 expects number with country code, e.g., "919876543210"
                                params.customerPhone.replace(/\+/g, '')
                            ],
                            components: {
                                header_1: {
                                    type: "document",
                                    filename: `Invoice_${params.orderId}.pdf`,
                                    value: params.pdfUrl // URL to the hosted PDF
                                },
                                body_1: {
                                    type: "text",
                                    value: params.customerName // {{1}}
                                },
                                body_2: {
                                    type: "text",
                                    value: params.orderId // {{2}}
                                },
                                body_3: {
                                    type: "text",
                                    value: params.amount // {{3}}
                                },
                                body_4: {
                                    type: "text",
                                    value: params.paymentLink // {{4}}
                                }
                            }
                        }
                    ]
                }
            }
        };

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'authkey': MSG91_AUTH_KEY
            }
        };

        console.log('Sending WhatsApp Bill Payload:', JSON.stringify(data, null, 2));

        const response = await axios.post(url, data, config);
        console.log('WhatsApp Response:', response.data);

        return response.data;

    } catch (error: any) {
        console.error('WhatsApp Service Error:', error.response?.data || error.message);
        throw new Error('Failed to send WhatsApp message');
    }
};
