import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';

const router = Router();

router.get('/check-user', async (req: Request, res: Response) => {
    const { username, secret } = req.query;

    if (secret !== 'debug123') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const term = String(username).toLowerCase();
        // Since we don't have a direct getEmployeeByUsername, we list and filter
        // This is a debug route, so performance isn't critical
        const employees = await db.listEmployees();

        const emp = employees.find((e: any) =>
            (e.username && e.username.toLowerCase() === term) ||
            (e.email && e.email.toLowerCase() === term) ||
            (e.employeeId && e.employeeId.toLowerCase() === term)
        );

        if (!emp) {
            return res.json({ status: 'not_found', message: 'User not found' });
        }

        const passwordMatch = (emp as any).password ? await bcrypt.compare('admin123', (emp as any).password) : false;

        return res.json({
            status: 'found',
            user: {
                id: emp.id,
                username: (emp as any).username || (emp as any).employeeId,
                email: emp.email,
                isActive: emp.status === 'active',
                role: (emp as any).role,
                hasPasswordHash: !!(emp as any).password,
                passwordMatchWithAdmin123: passwordMatch
            }
        });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/reset-password', async (req: Request, res: Response) => {
    const { username, secret } = req.query;

    if (secret !== 'debug123') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const term = String(username).toLowerCase();
        const employees = await db.listEmployees();
        const emp = employees.find((e: any) =>
            (e.username && e.username.toLowerCase() === term) ||
            (e.email && e.email.toLowerCase() === term) ||
            (e.employeeId && e.employeeId.toLowerCase() === term)
        );

        if (!emp) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate hash using the server's bcrypt library
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Update employee
        await db.updateEmployee(emp.id, {
            password: passwordHash,
            status: 'active'
        });

        const updated = await db.getEmployee(emp.id);

        return res.json({
            status: 'success',
            message: 'Password reset to admin123',
            user: updated
        });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// Test WhatsApp notification endpoint
router.get('/test-whatsapp', async (req: Request, res: Response) => {
    const { phone, secret } = req.query;

    if (secret !== 'debug123') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (!phone) {
        return res.status(400).json({ error: 'Phone number required (use ?phone=919XXXXXXXXX&secret=debug123)' });
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15559458542';
    const namespace = process.env.MSG91_TEMPLATE_NAMESPACE || '5b9c340a_3221_42e3_9b9f_98b402c0c8ac';
    const templateName = process.env.MSG91_TEMPLATE_NAME_ORDER || 'invoice_for_customer';

    if (!authKey) {
        return res.status(503).json({ error: 'MSG91_AUTH_KEY not configured' });
    }

    // Test data for "invoice_for_customer" template
    const testData = {
        orderNumber: 'FZC-TEST-12345',
        customerName: 'Test Customer',
        itemSummary: 'Dry Cleaning',
        amount: '999',
        pdfUrl: 'https://bill.myfabclean.com/sample.pdf',
    };

    // "invoice_for_customer" template spec:
    // - header_1: DOCUMENT
    // - body_1..4: text
    // - button_2: url
    const payload = {
        integrated_number: integratedNumber,
        content_type: "template",
        payload: {
            messaging_product: "whatsapp",
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: "en",
                    policy: "deterministic",
                },
                namespace: namespace,
                to_and_components: [
                    {
                        to: [String(phone)],
                        components: {
                            // Header: DOCUMENT
                            header_1: {
                                type: "document",
                                filename: `Invoice-${testData.orderNumber}.pdf`,
                                value: testData.pdfUrl,
                            },
                            body_1: {
                                type: "text",
                                value: testData.customerName, // {{1}}
                            },
                            body_2: {
                                type: "text",
                                value: testData.itemSummary, // {{2}}
                            },
                            body_3: {
                                type: "text",
                                value: testData.orderNumber, // {{3}}
                            },
                            body_4: {
                                type: "text",
                                value: testData.amount, // {{4}}
                            },
                            button_2: {
                                subtype: "url",
                                type: "text",
                                value: testData.orderNumber,
                            },
                        },
                    },
                ],
            },
        },
    };

    try {
        console.log('📱 [Test WhatsApp] Sending to:', phone);
        console.log('📄 [Test WhatsApp] Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(
            "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authkey": authKey,
                },
                body: JSON.stringify(payload),
            }
        );

        const resultText = await response.text();
        console.log(`✅ [Test WhatsApp] Response (${response.status}):`, resultText);

        let result;
        try {
            result = JSON.parse(resultText);
        } catch {
            result = { raw: resultText };
        }

        return res.json({
            status: response.ok ? 'success' : 'error',
            httpStatus: response.status,
            response: result,
            payloadSent: payload,
        });

    } catch (err: any) {
        console.error('❌ [Test WhatsApp] Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

export const debugRouter = router;
