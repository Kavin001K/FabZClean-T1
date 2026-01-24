export function maskSensitiveData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    // Handle Date objects and other non-JSON objects by leaving them alone or converting to string
    if (data instanceof Date) return data;

    const masked = Array.isArray(data) ? [...data] : { ...data };

    // Fields to completely redact
    const sensitiveFields = ['password', 'token', 'access_token', 'refreshToken', 'card', 'cvc', 'secret', 'auth', 'credentials'];
    // Fields to mask as PII
    const piiFields = ['email', 'phone', 'phoneNumber', 'mobile', 'address'];

    for (const key in masked) {
        if (Object.prototype.hasOwnProperty.call(masked, key)) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                masked[key] = '***MASKED_SECRET***';
            } else if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                masked[key] = '***MASKED_PII***';
            } else if (typeof masked[key] === 'object' && masked[key] !== null) {
                masked[key] = maskSensitiveData(masked[key]);
            }
        }
    }
    return masked;
}
