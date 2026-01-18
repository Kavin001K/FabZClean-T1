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

        const passwordMatch = emp.password ? await bcrypt.compare('admin123', emp.password) : false;

        return res.json({
            status: 'found',
            user: {
                id: emp.id,
                username: emp.username || emp.employeeId,
                email: emp.email,
                isActive: emp.status === 'active',
                role: emp.role,
                hasPasswordHash: !!emp.password,
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
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || '15558125705';
    const namespace = process.env.MSG91_NAMESPACE_Bill || '1520cd50_8420_404b_b634_4808f5f33034';
    const templateName = process.env.MSG91_TEMPLATE_NAME_Bill || 'bill';

    if (!authKey) {
        return res.status(503).json({ error: 'MSG91_AUTH_KEY not configured' });
    }

    // Test data for "bill" template
    const testData = {
        orderNumber: 'FZC-TEST-12345',
        customerName: 'Test Customer',
        imageUrl: 'https://rxyatfvjjnvjxwyhhhqn.supabase.co/storage/v1/object/public/Templates/Screenshot%202025-12-27%20at%2010.32.31%20PM.png',
    };

    // "bill" template (ACTUAL MSG91 SPEC):
    // - header_1: IMAGE
    // - body_1, body_2: text (only 2 params)
    // - button_1, button_2: url
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
                            // Header: IMAGE (not document!)
                            header_1: {
                                type: "image",
                                value: testData.imageUrl,
                            },
                            // Body: Only 2 params for "bill" template
                            body_1: {
                                type: "text",
                                value: testData.customerName, // {{1}} = Customer Name
                            },
                            body_2: {
                                type: "text",
                                value: testData.orderNumber, // {{2}} = Order Number
                            },
                            // Button 1: Track Order - dynamic URL suffix
                            // Template URL: https://myfabclean.com/trackorder/{{1}}
                            button_1: {
                                subtype: "url",
                                type: "text",
                                value: testData.orderNumber, // Order ID for tracking
                            },
                            // NOTE: button_2 (Terms) is STATIC URL, no dynamic variable needed
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
