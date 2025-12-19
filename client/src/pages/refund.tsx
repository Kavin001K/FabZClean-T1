import { useEffect } from 'react';

// SEO Meta Tags
const useRefundSEO = () => {
    useEffect(() => {
        document.title = "Refund Policy | Fab Clean - Premium Laundry Services";
        const metaTags = [
            { name: "description", content: "Fab Clean's Refund Policy explains our cancellation, refund, and compensation procedures for laundry services." },
            { name: "keywords", content: "fab clean refund, laundry refund policy, dry cleaning refund, garment compensation" },
            { property: "og:title", content: "Refund Policy | Fab Clean" },
            { property: "og:description", content: "Learn about Fab Clean's refund, cancellation, and compensation policies." },
        ];
        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            Object.entries(tag).forEach(([key, value]) => meta.setAttribute(key, value));
            document.head.appendChild(meta);
        });
        return () => { document.title = "Fab Clean - Premium Laundry & Dry Cleaning"; };
    }, []);
};

const refundData = {
    effectiveDate: "January 1, 2025",
    lastUpdated: "December 19, 2024",
    sections: [
        {
            id: 1,
            title: "Overview",
            content: `At Fab Clean, we are committed to providing exceptional laundry and dry cleaning services. We understand that sometimes situations arise where you may need a refund or compensation. This policy outlines our procedures for handling such requests fairly and transparently.

Our refund policy is designed to balance customer satisfaction with the realities of providing laundry and dry cleaning services. We process thousands of garments daily with the highest care standards, but we also stand behind our work and address valid concerns promptly.

This policy applies to all services offered by Fab Clean, including regular laundry, dry cleaning, express services, specialty garment care, and home delivery services.`
        },
        {
            id: 2,
            title: "Order Cancellation",
            content: `BEFORE PICKUP: Orders can be cancelled free of charge any time before our pickup agent arrives at your location. Simply cancel through the app, website, or by calling our customer service.

AFTER PICKUP, BEFORE PROCESSING: If you need to cancel after pickup but before processing begins, a nominal handling fee of ₹50 will apply to cover logistics costs. Contact us within 2 hours of pickup.

AFTER PROCESSING BEGINS: Once cleaning or processing has started, cancellation is not possible. The full order amount will be charged as the service has been rendered.

EXPRESS ORDERS: Express and same-day service orders cannot be cancelled once confirmed due to the priority scheduling involved. Standard cancellation fees apply.

SUBSCRIPTION CANCELLATION: Monthly subscription services can be cancelled with 7 days' notice before the next billing cycle. Unused credits from the current cycle are non-refundable but can be used until the cycle ends.`
        },
        {
            id: 3,
            title: "Refund Eligibility",
            content: `You may be eligible for a refund in the following situations:

SERVICE NOT PERFORMED: If we fail to pick up your order as scheduled or are unable to complete the service, you are entitled to a full refund.

QUALITY ISSUES: If the cleaning quality does not meet our standards and cannot be remedied through re-cleaning, you may be eligible for a partial or full refund.

GARMENT DAMAGE: If your garment is damaged during our care (subject to assessment), compensation will be provided as per our liability policy.

BILLING ERRORS: Any overcharges or billing mistakes will be refunded immediately upon verification.

DUPLICATE CHARGES: If you are charged multiple times for the same order, duplicate amounts will be refunded promptly.

NON-DELIVERY: If we fail to deliver your order after processing, a full refund plus compensation for inconvenience will be provided.`
        },
        {
            id: 4,
            title: "Non-Refundable Situations",
            content: `Refunds will NOT be provided in the following circumstances:

NORMAL WEAR & TEAR: Natural aging, fading, or wear of garments that becomes more visible after cleaning.

PRE-EXISTING DAMAGE: Damage, stains, or defects that existed before the garment was given to us.

UNDECLARED ISSUES: Problems with garments that were not disclosed at the time of order, such as hidden stains or fragile areas.

CUSTOMER-CAUSED DELAYS: Delays or issues arising from incorrect addresses, unavailability during delivery, or failure to provide access.

COLOR BLEEDING: Color bleeding from unstable dyes, especially in new or cheaply made garments.

SHRINKAGE WARNINGS: Shrinkage in garments where care labels warn against washing or dry cleaning.

SUBJECTIVE PREFERENCES: Requests based on personal preferences rather than objective quality issues (e.g., preferred fold style, slightly different scent).

FORCE MAJEURE: Situations beyond our control including natural disasters, strikes, or government restrictions.`
        },
        {
            id: 5,
            title: "Refund Process",
            content: `STEP 1 - REPORT THE ISSUE: Report any issues within 48 hours of receiving your order. You can report via the app, website, email (support@myfabclean.com), or phone (+91 93630 59595).

STEP 2 - DOCUMENTATION: Provide photographs of the issue and retain the garment in its delivered condition. Do not attempt to fix or alter the garment as this may void the refund.

STEP 3 - ASSESSMENT: Our quality team will assess the issue within 2-3 business days. We may request to inspect the garment in person for significant claims.

STEP 4 - RESOLUTION: Once verified, we will offer an appropriate resolution which may include re-cleaning, partial refund, full refund, or compensation.

STEP 5 - REFUND PROCESSING: Approved refunds are processed within 5-7 business days. The refund will be credited to your original payment method or as store credit, as per your preference.

ESCALATION: If you are unsatisfied with the resolution, you may escalate to our Customer Experience Manager at escalations@myfabclean.com.`
        },
        {
            id: 6,
            title: "Refund Methods",
            content: `ORIGINAL PAYMENT METHOD: Refunds are preferably processed to the original payment method used for the order.

CREDIT/DEBIT CARDS: Refunds to cards may take 5-10 business days to appear on your statement, depending on your bank.

UPI/NET BANKING: Refunds to UPI or bank accounts are typically processed within 3-5 business days.

WALLETS: If paid via any wallet service, refunds will be credited back to the same wallet within 24-48 hours.

STORE CREDIT: You may opt for instant store credit instead of waiting for payment refund. Store credits come with a 10% bonus amount and are valid for 6 months.

CASH PAYMENTS: For cash orders, refunds will be provided as store credit or via bank transfer (NEFT/IMPS) upon providing bank details.`
        },
        {
            id: 7,
            title: "Garment Damage Compensation",
            content: `If a garment is damaged during our care, we provide fair compensation:

ASSESSMENT: All damage claims are assessed by our quality control team. We consider the garment's age, original cost, condition, and extent of damage.

COMPENSATION CALCULATION: Maximum compensation is calculated as:
- Garments less than 1 year old: Up to 80% of original purchase price
- Garments 1-3 years old: Up to 50% of original purchase price
- Garments over 3 years old: Up to 25% of original purchase price

MAXIMUM LIABILITY: Our maximum liability per garment is capped at ₹5,000 for regular items and ₹15,000 for premium/designer items (declared at time of order).

PROOF OF VALUE: For claims above ₹2,000, we may request proof of purchase or similar evidence of the garment's value.

SPECIALTY ITEMS: Higher compensation limits apply to wedding garments, heirlooms, and declared high-value items. These must be declared and documented at the time of order with additional insurance opted.

REPAIR OPTION: Where possible, we may offer professional repair or restoration instead of monetary compensation.`
        },
        {
            id: 8,
            title: "Lost Garments",
            content: `In the rare event that a garment is lost:

SEARCH PERIOD: We conduct a thorough 7-day search of our facilities before confirming a garment as lost.

COMPENSATION: For confirmed lost items, we provide compensation at the greater of: (a) the garment's depreciated value based on age, or (b) 10x the cleaning charge for that item.

MAXIMUM LIMIT: Maximum compensation for lost items is ₹10,000 per garment unless higher value was declared and insured.

BATCH ORDERS: If an entire order is lost, we compensate for each item individually up to a maximum of ₹50,000 per order.

DOCUMENTATION: We require customers to provide a description and, if possible, photos of lost items to support the claim.

INSURANCE: Customers can opt for premium garment insurance at the time of order for higher coverage on valuable items.`
        },
        {
            id: 9,
            title: "Re-Cleaning Service",
            content: `If you're not satisfied with the cleaning quality:

FREE RE-CLEAN: We offer free re-cleaning for quality issues reported within 48 hours of delivery.

PICKUP: We will schedule a pickup for the unsatisfactorily cleaned item at no extra cost.

PRIORITY PROCESSING: Re-clean orders receive priority processing and are typically returned within 24-48 hours.

LIMITATIONS: Re-cleaning is offered once per original order. If quality issues persist after re-cleaning, a refund can be requested.

EXCLUSIONS: Re-cleaning does not apply to stains disclosed as "best effort" at the time of order or inherent garment issues.`
        },
        {
            id: 10,
            title: "Subscription Refunds",
            content: `For monthly subscription or package holders:

PRO-RATA REFUNDS: Cancelled subscriptions are eligible for pro-rata refunds of unused services at our discretion.

UNUSED CREDITS: Unused pickup/delivery credits expire at the end of each billing cycle and are non-refundable.

PREPAID PACKAGES: Prepaid packages can be refunded with a 15% cancellation fee for the unused portion.

TRIAL PERIODS: If a trial subscription is cancelled within the trial period, you will receive a full refund of any charges.

UPGRADE/DOWNGRADE: You can change your subscription tier at any time. The difference will be prorated.`
        },
        {
            id: 11,
            title: "Special Circumstances",
            content: `EXPRESS SERVICE FAILURES: If an express/same-day order is not delivered within the promised timeframe, the express premium charge (difference between express and regular pricing) will be automatically refunded.

WEDDING/EVENT ORDERS: For wedding and special event orders, if we fail to deliver by the confirmed date, a 100% refund plus compensation equal to 50% of the order value will be provided.

RECURRING ISSUES: Customers experiencing repeated quality issues on the same account will be assigned a dedicated quality manager and offered enhanced compensation.

SERVICE OUTAGES: During service disruptions due to unforeseen circumstances, pending orders will be completed at the earliest opportunity. Refunds will be provided upon request for significant delays.

DEATH/EMERGENCY: In cases of customer emergency or bereavement, all pending matters will be handled with sensitivity and full flexibility on refunds and cancellations.`
        },
        {
            id: 12,
            title: "Dispute Resolution",
            content: `If you are dissatisfied with our refund decision:

INTERNAL REVIEW: Request a review by our Customer Experience Manager by emailing escalations@myfabclean.com.

MEDIATION: We are open to third-party mediation through recognized consumer dispute resolution forums.

CONSUMER FORUM: You have the right to approach the Consumer Disputes Redressal Forum if the matter cannot be resolved internally.

JURISDICTION: All disputes are subject to the jurisdiction of courts in Pollachi, Tamil Nadu, India.

GOOD FAITH: We commit to resolving all disputes in good faith and in the best interest of maintaining customer relationships.`
        },
        {
            id: 13,
            title: "Contact for Refunds",
            content: `For all refund-related inquiries:

CUSTOMER SUPPORT:
Phone: +91 93630 59595
Email: support@myfabclean.com
Hours: Monday-Saturday, 8:00 AM - 8:00 PM IST

ESCALATIONS:
Email: escalations@myfabclean.com

WRITTEN CORRESPONDENCE:
Fab Clean - Refunds Department
#16, Venkatramana Round Road
Opp Naturals/HDFC Bank, Mahalingapuram
Pollachi - 642002
Tamil Nadu, India

Please include your order number, contact details, and a clear description of the issue for fastest resolution.`
        }
    ]
};

export default function RefundPage() {
    useRefundSEO();
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
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-16">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund Policy</h1>
                    <p className="text-amber-100 text-lg max-w-2xl mx-auto">
                        Our commitment to fair and transparent refund, cancellation, and compensation procedures.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm text-amber-200">
                        <span>Effective: {refundData.effectiveDate}</span>
                        <span className="w-1 h-1 rounded-full bg-amber-300"></span>
                        <span>Last Updated: {refundData.lastUpdated}</span>
                    </div>
                </div>
            </div>

            {/* Legal Navigation */}
            <div className="bg-white border-b border-slate-200 py-4">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <a href="/terms" className="px-4 py-2 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">Terms & Conditions</a>
                        <span className="text-slate-300">|</span>
                        <a href="/privacy" className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">Privacy Policy</a>
                        <span className="text-slate-300">|</span>
                        <span className="px-4 py-2 text-sm bg-amber-100 text-amber-700 rounded-full font-medium">Refund Policy</span>
                        <span className="text-slate-300">|</span>
                        <a href="/cookies" className="px-4 py-2 text-sm text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Table of Contents */}
                <div className="bg-slate-50 rounded-xl p-8 mb-12">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Table of Contents</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {refundData.sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left group"
                            >
                                <span className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 font-semibold rounded-lg text-sm group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    {section.id}
                                </span>
                                <span className="text-slate-700 group-hover:text-amber-700 transition-colors">{section.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-12">
                    {refundData.sections.map((section) => (
                        <section key={section.id} id={`section-${section.id}`} className="scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-amber-500 text-white font-bold rounded-xl text-lg">
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
                                <li>📧 support@myfabclean.com</li>
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
