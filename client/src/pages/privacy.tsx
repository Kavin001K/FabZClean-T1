import { useEffect } from 'react';

// SEO Meta Tags
const usePrivacySEO = () => {
    useEffect(() => {
        document.title = "Privacy Policy | Fab Clean - Premium Laundry Services";
        const metaTags = [
            { name: "description", content: "Fab Clean's Privacy Policy explains how we collect, use, and protect your personal information." },
            { name: "keywords", content: "fab clean privacy, data protection, personal information, laundry privacy policy" },
            { property: "og:title", content: "Privacy Policy | Fab Clean" },
            { property: "og:description", content: "Learn how Fab Clean protects your privacy and personal data." },
        ];
        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            Object.entries(tag).forEach(([key, value]) => meta.setAttribute(key, value));
            document.head.appendChild(meta);
        });
        return () => { document.title = "Fab Clean - Premium Laundry & Dry Cleaning"; };
    }, []);
};

const privacyData = {
    effectiveDate: "January 1, 2025",
    lastUpdated: "December 19, 2024",
    sections: [
        {
            id: 1,
            title: "Information We Collect",
            content: `We collect information you provide directly to us, including:

PERSONAL INFORMATION: When you create an account, place an order, or contact us, we collect your name, email address, phone number, physical address, and payment information.

ORDER INFORMATION: We collect details about your orders, including garment types, special instructions, service preferences, pickup and delivery addresses, and transaction history.

DEVICE INFORMATION: When you use our website or mobile app, we automatically collect device information such as IP address, browser type, operating system, and device identifiers.

USAGE DATA: We collect information about how you interact with our services, including pages visited, features used, time spent on pages, and navigation patterns.

COMMUNICATIONS: If you contact us via email, phone, or chat, we retain records of those communications along with your contact information.

LOCATION DATA: With your consent, we may collect precise location data from your mobile device to provide location-based services like pickup scheduling and delivery tracking.`
        },
        {
            id: 2,
            title: "How We Use Your Information",
            content: `We use the information we collect for the following purposes:

SERVICE DELIVERY: To process your orders, manage pickups and deliveries, provide customer support, and communicate about your services.

ACCOUNT MANAGEMENT: To create and maintain your account, authenticate your identity, and manage your preferences.

PAYMENT PROCESSING: To process payments, detect and prevent fraud, and comply with financial regulations.

COMMUNICATIONS: To send you service updates, order confirmations, delivery notifications, promotional offers (with your consent), and respond to your inquiries.

IMPROVEMENTS: To analyze usage patterns, improve our services, develop new features, and enhance user experience.

SAFETY & SECURITY: To detect and prevent fraud, abuse, and security incidents, and to protect the rights and safety of our users and third parties.

LEGAL COMPLIANCE: To comply with applicable laws, regulations, legal processes, and government requests.`
        },
        {
            id: 3,
            title: "Information Sharing",
            content: `We may share your information in the following circumstances:

SERVICE PROVIDERS: We share information with third-party service providers who perform services on our behalf, including payment processing, delivery services, SMS/WhatsApp notifications, cloud hosting, and customer support tools.

BUSINESS PARTNERS: With your consent, we may share information with business partners for joint marketing initiatives or co-branded services.

LEGAL REQUIREMENTS: We may disclose information when required by law, court order, or government regulation, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.

BUSINESS TRANSFERS: In connection with a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred to the acquiring entity.

AGGREGATED DATA: We may share aggregated, anonymized data that cannot be used to identify you for research, marketing, or analytics purposes.

WITH YOUR CONSENT: We may share information for other purposes with your explicit consent.`
        },
        {
            id: 4,
            title: "Data Security",
            content: `We implement robust security measures to protect your personal information:

ENCRYPTION: All data transmitted between your device and our servers is encrypted using industry-standard TLS/SSL protocols. Sensitive data at rest is encrypted using AES-256 encryption.

ACCESS CONTROLS: We implement strict access controls, limiting employee access to personal information to only those who need it to perform their job functions.

SECURITY MONITORING: We continuously monitor our systems for security threats and vulnerabilities. We conduct regular security audits and penetration testing.

SECURE PAYMENTS: Payment information is processed through PCI-DSS compliant payment processors. We never store complete credit card numbers on our servers.

INCIDENT RESPONSE: We have established incident response procedures to quickly address any potential data breaches and notify affected users as required by law.

EMPLOYEE TRAINING: All employees receive regular training on data protection practices and security awareness.`
        },
        {
            id: 5,
            title: "Your Privacy Rights",
            content: `You have the following rights regarding your personal information:

ACCESS: You can request a copy of the personal information we hold about you.

CORRECTION: You can request that we correct any inaccurate or incomplete information.

DELETION: You can request that we delete your personal information, subject to certain legal exceptions.

DATA PORTABILITY: You can request your data in a structured, commonly used, machine-readable format.

OPT-OUT: You can opt out of receiving promotional communications at any time by clicking the unsubscribe link in emails or contacting us.

WITHDRAW CONSENT: Where we rely on your consent to process information, you can withdraw that consent at any time.

LODGE COMPLAINTS: You have the right to lodge a complaint with a data protection authority if you believe we have violated your privacy rights.

To exercise these rights, contact us at privacy@myfabclean.com or call +91 93630 59595.`
        },
        {
            id: 6,
            title: "Cookies & Tracking",
            content: `We use cookies and similar tracking technologies:

ESSENTIAL COOKIES: Required for basic website functionality, including session management and security features. These cannot be disabled.

PERFORMANCE COOKIES: Help us understand how visitors use our website, allowing us to improve performance and user experience.

FUNCTIONALITY COOKIES: Remember your preferences and settings to provide a personalized experience.

MARKETING COOKIES: Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.

THIRD-PARTY ANALYTICS: We use services like Google Analytics to analyze website traffic and usage patterns.

You can manage cookie preferences through your browser settings or our cookie consent tool. Note that disabling certain cookies may affect website functionality.

For detailed information, please see our separate Cookie Policy.`
        },
        {
            id: 7,
            title: "Data Retention",
            content: `We retain your information for as long as necessary to:

ACTIVE ACCOUNTS: We retain account information for as long as your account remains active.

TRANSACTION RECORDS: Order and payment records are retained for 7 years to comply with tax and financial regulations.

CUSTOMER SUPPORT: Support communications are retained for 3 years for quality assurance and training purposes.

MARKETING DATA: Marketing preferences and consent records are retained for 5 years or until you withdraw consent.

LEGAL OBLIGATIONS: Some data may be retained longer if required by law or for the establishment, exercise, or defense of legal claims.

After the retention period expires, we securely delete or anonymize your information.`
        },
        {
            id: 8,
            title: "Children's Privacy",
            content: `Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at privacy@myfabclean.com.

If we discover that we have collected personal information from a child without parental consent, we will promptly delete that information.`
        },
        {
            id: 9,
            title: "International Data Transfers",
            content: `Your information may be transferred to and processed in countries other than India:

DATA STORAGE: Our primary servers are located in India, but we may use cloud services with servers in other countries.

SAFEGUARDS: When we transfer data internationally, we implement appropriate safeguards including standard contractual clauses and ensuring recipients maintain adequate data protection standards.

THIRD-PARTY SERVICES: Some of our service providers may process data in countries with different privacy laws. We ensure they provide adequate protection for your data.`
        },
        {
            id: 10,
            title: "Third-Party Links",
            content: `Our website and services may contain links to third-party websites, applications, or services:

NO CONTROL: We have no control over the privacy practices of third-party websites. This Privacy Policy does not apply to any information you provide to third parties.

REVIEW POLICIES: We encourage you to review the privacy policies of any third-party websites you visit.

SOCIAL MEDIA: If you interact with us through social media platforms, your interactions are subject to that platform's privacy policy in addition to ours.`
        },
        {
            id: 11,
            title: "Updates to This Policy",
            content: `We may update this Privacy Policy from time to time:

NOTIFICATION: We will notify you of material changes by email, in-app notification, or by posting a prominent notice on our website.

EFFECTIVE DATE: Changes become effective on the date specified in the updated policy.

CONTINUED USE: Your continued use of our services after changes take effect constitutes acceptance of the updated policy.

ARCHIVE: Previous versions of this policy are available upon request.`
        },
        {
            id: 12,
            title: "Contact Us",
            content: `For questions about this Privacy Policy or our data practices:

DATA PROTECTION OFFICER:
Email: privacy@myfabclean.com
Phone: +91 93630 59595

GRIEVANCE OFFICER (India):
Name: Fab Clean Privacy Team
Email: grievance@myfabclean.com
Address: #16, Venkatramana Round Road, Opp Naturals/HDFC Bank, Mahalingapuram, Pollachi - 642002, Tamil Nadu, India

Response time: We aim to respond to privacy inquiries within 48 hours.`
        }
    ]
};

export default function PrivacyPage() {
    usePrivacySEO();
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
                    <a href="/" className="flex items-center gap-3">
                        <img src="/assets/logo.webp" alt="Fab Clean" className="h-10" />
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                        Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm text-blue-200">
                        <span>Effective: {privacyData.effectiveDate}</span>
                        <span className="w-1 h-1 rounded-full bg-blue-300"></span>
                        <span>Last Updated: {privacyData.lastUpdated}</span>
                    </div>
                </div>
            </div>

            {/* Legal Navigation */}
            <div className="bg-white border-b border-slate-200 py-4">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <a href="/terms" className="px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">Terms & Conditions</a>
                        <span className="text-slate-300">|</span>
                        <span className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-full font-medium">Privacy Policy</span>
                        <span className="text-slate-300">|</span>
                        <a href="/refund" className="px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">Refund Policy</a>
                        <span className="text-slate-300">|</span>
                        <a href="/cookies" className="px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Table of Contents */}
                <div className="bg-slate-50 rounded-xl p-8 mb-12">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Table of Contents</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {privacyData.sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left group"
                            >
                                <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 font-semibold rounded-lg text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {section.id}
                                </span>
                                <span className="text-slate-700 group-hover:text-blue-700 transition-colors">{section.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-12">
                    {privacyData.sections.map((section) => (
                        <section key={section.id} id={`section-${section.id}`} className="scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-600 text-white font-bold rounded-xl text-lg">
                                    {section.id}
                                </span>
                                <h2 className="text-2xl font-bold text-slate-800 pt-2">{section.title}</h2>
                            </div>
                            <div className="pl-16">
                                <div className="prose prose-slate max-w-none">
                                    {section.content.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx} className="text-slate-600 leading-relaxed mb-4 text-justify">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12 mt-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h4 className="font-semibold mb-4">Fab Clean</h4>
                            <p className="text-slate-400 text-sm">Premium laundry and dry cleaning services committed to quality and customer satisfaction.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="/refund" className="hover:text-white transition-colors">Refund Policy</a></li>
                                <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>📧 privacy@myfabclean.com</li>
                                <li>📞 +91 93630 59595</li>
                                <li>🌐 www.myfabclean.com</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
                        <p>© {currentYear} Fab Clean. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
