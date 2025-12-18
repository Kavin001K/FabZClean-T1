import { useEffect, useState } from 'react';

// SEO Meta Tags Hook
const useTermsSEO = () => {
    useEffect(() => {
        document.title = "Terms & Conditions | Fab Clean - Premium Laundry Services";

        const metaTags = [
            { name: "description", content: "Read Fab Clean's comprehensive terms and conditions for premium laundry and dry cleaning services." },
            { name: "keywords", content: "fab clean terms, laundry terms, dry cleaning policy, garment care agreement" },
            { property: "og:title", content: "Terms & Conditions | Fab Clean" },
            { property: "og:description", content: "Comprehensive service agreement for Fab Clean laundry services." },
            { property: "og:type", content: "website" },
        ];

        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            Object.entries(tag).forEach(([key, value]) => meta.setAttribute(key, value));
            document.head.appendChild(meta);
        });

        return () => {
            document.title = "Fab Clean - Premium Laundry & Dry Cleaning";
        };
    }, []);
};

// Terms Data - Comprehensive Content
const termsData = {
    lastUpdated: "December 18, 2025",
    effectiveDate: "January 1, 2025",
    sections: [
        {
            id: 1,
            title: "Introduction & Acceptance",
            content: `Welcome to Fab Clean ("Company," "we," "us," or "our"). These Terms and Conditions ("Terms," "Agreement") constitute a legally binding agreement between you ("Customer," "you," or "your") and Fab Clean governing your use of our laundry, dry cleaning, and garment care services ("Services").

By submitting garments or utilizing any of our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree to these Terms, please do not use our Services. We reserve the right to modify these Terms at any time, and such modifications shall be effective immediately upon posting. Your continued use of our Services following any modifications constitutes your acceptance of the revised Terms.

These Terms apply to all customers, whether accessing our Services through physical store locations, mobile applications, website platforms, or any other means. The Terms also apply to pickup and delivery services, express services, specialty cleaning, and all ancillary services offered by Fab Clean.

Our commitment is to provide exceptional garment care while maintaining complete transparency in our operations. We encourage all customers to thoroughly review these Terms and contact our customer service team with any questions or concerns before utilizing our Services.`
        },
        {
            id: 2,
            title: "Service Description & Scope",
            content: `Fab Clean provides comprehensive garment care services including but not limited to: standard laundry washing and folding, professional dry cleaning, stain treatment and removal, ironing and pressing, alterations and repairs, specialized fabric care, leather and suede cleaning, wedding dress preservation, and home textile cleaning.

Our standard processing time is 3-5 business days from the date of garment receipt. Express services are available at additional cost, offering 24-48 hour turnaround depending on service type and garment requirements. Same-day service may be available for select items when submitted before 10:00 AM, subject to availability and additional charges.

We employ industry-leading cleaning methods, state-of-the-art equipment, and environmentally conscious cleaning solutions. Our professional team undergoes continuous training to handle various fabric types, from everyday cotton to delicate silk, cashmere, and specialty textiles. Each garment is individually assessed to determine the optimal cleaning method.

Pickup and delivery services are available within our designated service areas. Customers may schedule pickups through our mobile application, website, or by contacting customer service directly. Delivery times are estimates and may vary based on route optimization and external factors beyond our control.`
        },
        {
            id: 3,
            title: "Customer Responsibilities & Obligations",
            content: `Customers bear certain responsibilities to ensure optimal service delivery and to protect both parties' interests:

GARMENT INSPECTION: Before submission, customers must inspect all garments and remove personal items from pockets including but not limited to: cash, credit cards, identification documents, jewelry, electronics, keys, and any other valuables. Fab Clean is not responsible for loss or damage to items left in garment pockets.

DISCLOSURE OF DEFECTS: Customers must disclose any known defects, weak seams, missing buttons, existing stains, or damage at the time of submission. Pre-existing conditions not disclosed may result in additional charges or exclusion from our liability coverage.

CARE LABELS: Customers should ensure all garments have intact care labels. When care labels are missing, faded, or provide incomplete instructions, customers must provide specific cleaning instructions. We will process such items using our professional judgment, but cannot guarantee results without proper care information.

ACCURATE INFORMATION: Customers must provide accurate contact information for order communications. Failure to provide correct phone numbers or addresses may result in delayed pickup/delivery or inability to contact regarding garment-specific concerns.

TIMELY COLLECTION: Customers are responsible for collecting processed garments within the specified timeframe. Garments not collected within 30 days may incur storage fees. Garments unclaimed after 90 days may be donated or disposed of in accordance with applicable laws.`
        },
        {
            id: 4,
            title: "Pricing, Payment & Billing",
            content: `All prices are quoted in Indian Rupees (INR) and are subject to applicable taxes (GST at prevailing rates). Prices are based on our current rate card and may vary based on garment type, fabric, cleaning method required, and any special treatments.

PAYMENT TERMS: Payment is due upon service completion unless otherwise arranged. We accept cash, all major credit/debit cards, UPI payments (Google Pay, PhonePe, Paytm), and net banking. Corporate accounts may be eligible for credit terms subject to approval.

PRICING VARIATIONS: Certain items may require additional charges including but not limited to: heavily soiled garments, garments requiring special handling, rush/express processing, specialty stain treatment, leather/suede care, wedding dress services, and oversized items. Such additional charges will be communicated before processing whenever possible.

DISPUTED CHARGES: Any billing disputes must be raised within 7 days of invoice date. We will investigate all disputed charges and provide resolution within 14 business days. Undisputed portions of invoices remain payable by the original due date.

PRICE CHANGES: We reserve the right to modify our pricing at any time. Price changes will not affect orders already in processing. Updated pricing will be reflected on our rate cards, website, and mobile application.`
        },
        {
            id: 5,
            title: "Quality Standards & Service Guarantee",
            content: `Fab Clean is committed to delivering exceptional quality in every aspect of our service. Our quality assurance program includes multi-point inspection, professional finishing, and careful packaging of all processed garments.

QUALITY COMMITMENT: Each garment undergoes thorough inspection before and after processing. Our trained professionals assess fabric condition, identify stains, check for damage, and determine optimal cleaning methods. Post-processing inspection ensures cleaning effectiveness and proper finishing.

SERVICE GUARANTEE: If you are not satisfied with our cleaning results, notify us within 48 hours of collection. We will re-clean the garment at no additional charge. This guarantee covers cleaning quality concerns and does not extend to pre-existing damage, natural fabric limitations, or issues arising from incorrect care label information.

LIMITATIONS: While we strive for excellence, certain factors may affect cleaning outcomes. These include: set-in stains that have oxidized over time, damage caused by previous cleaning attempts, fabric degradation due to age or wear, dye instability, and inherent fabric weaknesses. We will communicate any concerns about expected outcomes before processing whenever possible.

CONTINUOUS IMPROVEMENT: Customer feedback is essential to our quality improvement efforts. We encourage all customers to share their experiences through our feedback channels. Constructive feedback helps us enhance our services and address any operational gaps.`
        },
        {
            id: 6,
            title: "Liability & Damage Policy",
            content: `While we exercise utmost care in handling all garments, certain risks are inherent in the cleaning process. This section outlines our liability framework and damage policies.

LIABILITY LIMITATIONS: Our maximum liability for any lost or damaged item shall not exceed ten (10) times the cleaning charge for that specific item, or the fair market value of the item accounting for age and wear, whichever is lower. In no event shall our total liability exceed INR 10,000 per garment or INR 50,000 per order.

EXCLUSIONS FROM LIABILITY: We are not liable for: damage arising from pre-existing conditions not disclosed at submission; damage caused by defective or weak fabrics, fastenings, or trimmings; shrinkage or color loss due to improper care labeling by manufacturers; damage to garments with missing or illegible care labels; items left in pockets; normal wear and deterioration; and damage caused by factors beyond our control.

DAMAGE CLAIMS: All damage claims must be submitted in writing within 48 hours of garment collection. Claims should include: original receipt, description of damage, photographs if applicable, and proof of garment value. We will investigate all claims and respond within 14 business days.

FORCE MAJEURE: We shall not be liable for delays, damage, or loss arising from circumstances beyond our reasonable control, including but not limited to: natural disasters, fire, flood, civil unrest, labor disputes, power failures, or government actions.`
        },
        {
            id: 7,
            title: "Specialty Items & Special Care",
            content: `Certain garments and textiles require specialized handling and are subject to additional terms:

WEDDING DRESSES & FORMAL WEAR: These items require extensive specialized handling and are processed according to industry best practices for preservation. Additional forms and consultations may be required. Processing times are typically 2-3 weeks. Preservation packaging is available at additional cost.

LEATHER & SUEDE: These materials require specialized cleaning methods and products. Results may vary based on leather type, age, and condition. Color restoration may be recommended and is available at additional cost. Processing typically requires 7-14 business days.

VINTAGE & ANTIQUE TEXTILES: Items over 50 years old require special assessment. We reserve the right to decline processing items we assess as too fragile. When accepted, these items are processed at owner's risk with appropriate documentation.

DELICATE FABRICS: Silks, cashmere, embroidered items, and other delicates require gentle handling. While we exercise extreme care, inherent fragility may result in unavoidable damage during cleaning. Customers accepting processing of such items acknowledge these risks.

HOME TEXTILES: Curtains, upholstery covers, rugs, and similar items are processed according to their specific requirements. Shrinkage is possible with certain fabrics. We recommend professional measurement before and after processing for items where fit is critical.`
        },
        {
            id: 8,
            title: "Pickup & Delivery Services",
            content: `Fab Clean offers convenient pickup and delivery services subject to the following terms:

SERVICE AREA: Pickup and delivery services are available within our designated service zones. Service area maps are available on our website and mobile application. Areas outside designated zones may be serviced subject to additional charges or minimum order requirements.

SCHEDULING: Pickups and deliveries can be scheduled through our mobile application, website, or customer service hotline. We offer flexible time slots to accommodate customer schedules. While we strive to meet scheduled times, traffic conditions and operational factors may cause variations of up to 60 minutes from scheduled slots.

DELIVERY ATTEMPTS: For deliveries, we will make up to two attempts at the scheduled address. If delivery cannot be completed, the order will be held at our nearest service center for customer collection. Storage fees may apply after 7 days.

PICKUP VERIFICATION: At pickup, our representative will count items and provide a receipt. Customers should verify item counts match the receipt. Any discrepancies must be reported immediately. Items not listed on the receipt will not be covered under our service terms.

CONTACTLESS OPTIONS: We offer contactless pickup and delivery options. Customers may designate a secure collection point. Fab Clean is not liable for items left at contactless collection points once delivery is confirmed.`
        },
        {
            id: 9,
            title: "Data Privacy & Security",
            content: `Fab Clean is committed to protecting customer privacy and handling personal data responsibly in accordance with applicable data protection laws.

DATA COLLECTION: We collect personal information necessary for service delivery including: name, address, phone number, email address, payment information, and order history. This information is used solely for service provision, communication, and service improvement.

DATA SECURITY: We implement appropriate technical and organizational measures to protect personal data against unauthorized access, alteration, disclosure, or destruction. Payment information is processed through secure, PCI-compliant payment gateways.

DATA SHARING: We do not sell, rent, or trade customer personal information to third parties for marketing purposes. Data may be shared with: service providers essential to our operations (payment processors, delivery partners); legal authorities when required by law; and affiliated entities for service coordination.

DATA RETENTION: Order records are retained for the period required by tax and business regulations (typically 7 years). Customer accounts and preferences are retained as long as the account remains active. Customers may request data deletion subject to legal retention requirements.

CUSTOMER RIGHTS: Customers have the right to: access their personal data; request corrections to inaccurate data; request data deletion (subject to legal requirements); and opt-out of marketing communications. Requests should be submitted through our customer service channels.`
        },
        {
            id: 10,
            title: "Intellectual Property",
            content: `All intellectual property rights related to Fab Clean's brand, services, and materials are protected:

TRADEMARKS: The Fab Clean name, logo, taglines, and associated branding are registered trademarks. Unauthorized use of our trademarks is strictly prohibited and may result in legal action.

CONTENT: All content on our website, mobile application, and marketing materials including text, graphics, images, and software is owned by or licensed to Fab Clean. This content is protected by copyright and other intellectual property laws.

USAGE RESTRICTIONS: Customers may not: reproduce, distribute, or publicly display our branded materials without written permission; use our brand or likeness for commercial purposes; create derivative works based on our intellectual property; or reverse engineer our software applications.

USER CONTENT: Any feedback, suggestions, or ideas provided by customers may be used by Fab Clean for service improvement without compensation. By providing such input, customers grant us a perpetual, royalty-free license to use such contributions.`
        },
        {
            id: 11,
            title: "Dispute Resolution",
            content: `We are committed to resolving disputes fairly and efficiently:

INFORMAL RESOLUTION: We encourage customers to first contact our customer service team to resolve any concerns. Most issues can be resolved through direct communication. Our team is empowered to offer reasonable solutions to ensure customer satisfaction.

FORMAL COMPLAINTS: If informal resolution is unsuccessful, customers may submit formal written complaints to our management team. We will acknowledge complaints within 48 hours and provide a substantive response within 14 business days.

MEDIATION: For disputes exceeding INR 10,000 that cannot be resolved through our internal process, either party may request mediation through a mutually agreed mediator. Mediation costs will be shared equally unless otherwise agreed.

ARBITRATION: Disputes not resolved through mediation shall be finally resolved by binding arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in Coimbatore, Tamil Nadu, in English.

GOVERNING LAW: These Terms shall be governed by and construed in accordance with the laws of India. The courts of Coimbatore, Tamil Nadu shall have exclusive jurisdiction over any legal proceedings.

LIMITATION PERIOD: Any claim or dispute must be brought within one (1) year of the event giving rise to the claim, after which such claims shall be permanently barred.`
        },
        {
            id: 12,
            title: "Environmental Commitment",
            content: `Fab Clean is dedicated to environmentally responsible operations:

ECO-FRIENDLY PRACTICES: We continuously invest in eco-friendly cleaning technologies and biodegradable cleaning solutions. Our processes are designed to minimize water usage, reduce chemical discharge, and lower our carbon footprint.

PACKAGING: We utilize recyclable and biodegradable packaging materials wherever possible. Customers are encouraged to return hangers and garment covers for reuse. Bulk orders may opt for minimal packaging to reduce waste.

ENERGY EFFICIENCY: Our facilities employ energy-efficient equipment and lighting. We optimize delivery routes to reduce fuel consumption and emissions. Solar panels and water recycling systems are implemented at select locations.

COMMUNITY INITIATIVES: We participate in community clean-up drives, textile recycling programs, and environmental awareness campaigns. A portion of proceeds from designated services supports environmental conservation efforts.

CUSTOMER PARTICIPATION: Customers can contribute to our environmental efforts by: opting for consolidated pickups/deliveries; choosing eco-friendly packaging options; participating in our hanger return program; and selecting water-efficient washing options where available.`
        },
        {
            id: 13,
            title: "Corporate & Bulk Services",
            content: `Special terms apply to corporate accounts and bulk service arrangements:

CORPORATE ACCOUNTS: Businesses may apply for corporate accounts offering consolidated billing, dedicated support, and customized pricing. Account approval is subject to credit verification and minimum volume requirements.

SERVICE AGREEMENTS: Corporate clients may enter into formal service agreements specifying volumes, pricing, service levels, and payment terms. Such agreements supplement but do not replace these general Terms.

BULK PRICING: Volume-based pricing is available for customers with consistent high-volume needs. Pricing tiers are based on monthly or quarterly volume commitments. Failure to meet committed volumes may result in pricing adjustments.

DEDICATED SUPPORT: Corporate accounts are assigned dedicated relationship managers for streamlined service coordination. Priority processing and customized pickup/delivery schedules may be arranged.

REPORTING: Corporate clients receive detailed activity reports including volume analysis, spend tracking, and service metrics. Custom reporting can be developed based on client requirements.`
        },
        {
            id: 14,
            title: "Termination & Account Closure",
            content: `Either party may terminate the service relationship subject to the following:

CUSTOMER TERMINATION: Customers may discontinue services at any time. Outstanding balances must be cleared, and any items in processing must be collected. Prepaid credits may be refunded less any applicable service charges.

COMPANY TERMINATION: We reserve the right to refuse service or terminate accounts for: violation of these Terms; abusive behavior toward staff; fraudulent activity; repeated payment defaults; or any conduct deemed detrimental to our operations.

EFFECT OF TERMINATION: Upon termination, customers must: collect all items in our possession within 30 days; clear outstanding balances; and return any company materials (loyalty cards, etc.). Uncollected items will be handled per our unclaimed garments policy.

SURVIVAL: Provisions relating to liability limitations, intellectual property, dispute resolution, and indemnification shall survive termination.`
        },
        {
            id: 15,
            title: "Miscellaneous Provisions",
            content: `ENTIRE AGREEMENT: These Terms, together with any service-specific terms, constitute the entire agreement between you and Fab Clean regarding our services, superseding all prior agreements and understandings.

SEVERABILITY: If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect. The unenforceable provision shall be modified to the minimum extent necessary to make it enforceable.

WAIVER: Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. Any waiver must be in writing and signed by an authorized representative.

ASSIGNMENT: We may assign our rights and obligations under these Terms to any affiliate or successor entity. Customers may not assign their rights without our written consent.

NOTICES: All formal notices should be sent to our registered office address or via email to legal@myfabclean.com. Notices to customers will be sent to the contact information on file.

HEADINGS: Section headings are for convenience only and do not affect the interpretation of these Terms.

LANGUAGE: These Terms are drafted in English. In case of any conflict between the English version and any translation, the English version shall prevail.`
        },
        {
            id: 16,
            title: "Contact Information",
            content: `For questions, concerns, or feedback regarding these Terms or our services:

CUSTOMER SERVICE:
Phone: +91 93630 59595
Email: support@myfabclean.com
Hours: Monday-Saturday, 8:00 AM - 8:00 PM IST

CORPORATE INQUIRIES:
Email: corporate@myfabclean.com

LEGAL & COMPLIANCE:
Email: legal@myfabclean.com

REGISTERED OFFICE:
Fab Clean
#16, Venkatramana Round Road
Opp Naturals/HDFC Bank, Mahalingapuram
Pollachi - 642002
Tamil Nadu, India

WEBSITE: www.myfabclean.com

We value your business and are committed to addressing all inquiries promptly and professionally.`
        }
    ]
};

export default function TermsPage() {
    useTermsSEO();
    const [activeSection, setActiveSection] = useState<number | null>(null);
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
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
                    <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                        Comprehensive service agreement governing your use of Fab Clean's premium laundry and dry cleaning services.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm text-emerald-200">
                        <span>Effective: {termsData.effectiveDate}</span>
                        <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
                        <span>Last Updated: {termsData.lastUpdated}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">

                {/* Table of Contents */}
                <div className="bg-slate-50 rounded-xl p-8 mb-12">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Table of Contents</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {termsData.sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left group"
                            >
                                <span className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    {section.id}
                                </span>
                                <span className="text-slate-700 group-hover:text-emerald-700 transition-colors">{section.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Terms Sections */}
                <div className="space-y-12">
                    {termsData.sections.map((section) => (
                        <section
                            key={section.id}
                            id={`section-${section.id}`}
                            className="scroll-mt-40"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-600 text-white font-bold rounded-xl text-lg">
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

                {/* Acceptance Section */}
                <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white text-center">
                    <h3 className="text-2xl font-bold mb-4">Acknowledgment & Acceptance</h3>
                    <p className="text-emerald-100 max-w-2xl mx-auto mb-6">
                        By using Fab Clean services, you confirm that you have read, understood, and agree to be bound by these
                        Terms and Conditions. These terms form a binding agreement between you and Fab Clean.
                    </p>
                    <div className="flex items-center justify-center">
                        <a
                            href="mailto:support@myfabclean.com"
                            className="px-6 py-3 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>
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
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>📞 +91 93630 59595</li>
                                <li>✉️ support@myfabclean.com</li>
                                <li>🌐 www.myfabclean.com</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
                        <p>© {currentYear} Fab Clean. All rights reserved. | GSTIN: 33AITPD3522F1ZK</p>
                    </div>
                </div>
            </footer>

            {/* Back to Top Button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-8 right-8 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center z-50"
                aria-label="Back to top"
            >
                ↑
            </button>

            <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}
