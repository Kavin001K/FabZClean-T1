/**
 * Terms & Conditions Page
 * 
 * Accessible only via direct link: myfabclean.com/terms
 * NOT included in navigation - completely isolated
 * 
 * Professional legal document with premium typography
 */

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";

export default function TermsPage() {
    const currentYear = new Date().getFullYear();

    // Load professional fonts
    useEffect(() => {
        // Add Google Fonts link
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 via-orange-50/20 to-stone-100">
            {/* Professional Header */}
            <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-8 py-5">
                    <div className="flex items-center justify-center">
                        <img
                            src="/assets/fabclean-logo.png"
                            alt="Fab Clean - Dry Clean | Laundry"
                            className="h-14 object-contain"
                        />
                    </div>
                </div>
            </header>

            {/* Main Document */}
            <main className="max-w-4xl mx-auto px-8 py-12">
                <Card className="border border-stone-200 shadow-xl bg-white/95 backdrop-blur-sm">
                    <CardContent className="p-10 md:p-14">

                        {/* Document Title */}
                        <div className="text-center mb-14 pb-8 border-b-2 border-stone-300">
                            <h1
                                className="text-4xl md:text-5xl font-bold text-stone-800 tracking-tight mb-4"
                                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                                Terms & Conditions
                            </h1>
                            <p className="text-sm text-stone-500 tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                Effective Date: December {currentYear} • Document Version 2.1
                            </p>
                        </div>

                        {/* Preamble */}
                        <div
                            className="mb-12 p-8 bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-xl border border-stone-200"
                            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                        >
                            <p className="text-stone-700 leading-relaxed text-justify text-lg">
                                Welcome to <strong className="text-stone-900">Fab Clean</strong>. By utilizing our professional
                                laundry, dry cleaning, and garment care services, you acknowledge that you have carefully read,
                                fully understood, and unconditionally agree to be bound by the following comprehensive Terms &
                                Conditions. These terms constitute a legally binding agreement between you (hereinafter referred
                                to as "Customer", "you", or "your") and Fab Clean (hereinafter referred to as "Company", "we",
                                "us", or "our"), including all independently owned and operated franchise locations operating
                                under the Fab Clean brand.
                            </p>
                        </div>

                        {/* Table of Contents */}
                        <div className="mb-14 p-8 bg-emerald-50/70 rounded-xl border border-emerald-200/70">
                            <h2
                                className="text-lg font-bold text-emerald-800 uppercase tracking-widest mb-6 text-center"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                Table of Contents
                            </h2>
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <a href="#section-1" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 1. Service Agreement and Acceptance
                                </a>
                                <a href="#section-2" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 2. Order Placement, Processing & Delivery
                                </a>
                                <a href="#section-3" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 3. Pricing, Payments & Financial Terms
                                </a>
                                <a href="#section-4" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 4. Limitations of Liability & Claims
                                </a>
                                <a href="#section-5" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 5. Privacy, Data Protection & Communication
                                </a>
                                <a href="#section-6" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 6. Franchise Operations & Dispute Resolution
                                </a>
                                <a href="#section-7" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 7. General Provisions
                                </a>
                                <a href="#section-8" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
                                    § 8. Contact Information
                                </a>
                            </div>
                        </div>

                        {/* Section 1 */}
                        <section id="section-1" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    1
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Service Agreement and Acceptance
                                </h2>
                            </div>

                            <div
                                className="space-y-8 text-stone-700 leading-relaxed text-justify"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">1.1 Scope of Services: The Fab Clean Service Portfolio</h3>
                                    <p className="mb-5 text-base leading-7">
                                        Fab Clean, operating through an extensive, quality-controlled, and professionally audited
                                        network of independently owned and operated franchises, delivers a comprehensive and diverse
                                        array of professional textile care services meticulously engineered to satisfy a wide spectrum
                                        of customer requirements, utilizing cutting-edge textile science and environmentally conscientious
                                        methodologies. These specialized services encompass, but are not exclusively limited to, the
                                        following core offerings:
                                    </p>
                                    <ul className="list-none space-y-5 ml-4">
                                        <li className="flex gap-4">
                                            <span className="text-emerald-600 font-bold text-lg flex-shrink-0">a)</span>
                                            <div>
                                                <strong className="text-stone-900">High-Volume Standard Services (Wash and Fold):</strong>
                                                <span className="block mt-1 text-stone-600">
                                                    This represents our most economical and time-efficient solution, intended for everyday
                                                    apparel, linens, and general articles. The service incorporates routine laundering in
                                                    commercial-grade, temperature-controlled machines, machine drying to standard specifications,
                                                    and professional folding or bagging. It is fundamentally stipulated that in this high-volume
                                                    service, articles are cleaned collectively with other routine customer items to optimize
                                                    efficiency and maintain cost-effectiveness. This process is ideally suited for bulk,
                                                    non-delicate, and non-structured items but inherently precludes item-specific stain
                                                    pretreatment or individualized handling.
                                                </span>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-emerald-600 font-bold text-lg flex-shrink-0">b)</span>
                                            <div>
                                                <strong className="text-stone-900">Premium Garment Dry Cleaning:</strong>
                                                <span className="block mt-1 text-stone-600">
                                                    A sophisticated and essential process dedicated to preserving the integrity of structured,
                                                    delicate, or high-value garments. This service employs specialized, non-water-based solvents
                                                    (e.g., hydrocarbon or eco-friendly alternatives) and high-precision, temperature-regulated
                                                    equipment. It is expertly customized for items such as suits, evening wear, silks, wools,
                                                    and cashmere. This premium service is paramount for maintaining fabric shape, preventing
                                                    fiber distortion and shrinkage, ensuring superior color preservation, and safely managing
                                                    embellishments that are sensitive to water-based cleaning.
                                                </span>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-emerald-600 font-bold text-lg flex-shrink-0">c)</span>
                                            <div>
                                                <strong className="text-stone-900">Professional Pressing and Finishing:</strong>
                                                <span className="block mt-1 text-stone-600">
                                                    A dedicated, detail-oriented service involving meticulous hand-ironing, industrial steaming,
                                                    and precise finishing techniques. This guarantees that every garment—from business shirts to
                                                    formal gowns—achieves a crisp, wrinkle-free, ready-to-wear finish. Items are customarily
                                                    returned on high-quality hangers with protective coverings, projecting a professional
                                                    presentation essential for formal, corporate, and high-fashion attire.
                                                </span>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-emerald-600 font-bold text-lg flex-shrink-0">d)</span>
                                            <div>
                                                <strong className="text-stone-900">Specialized Fabric Treatments:</strong>
                                                <span className="block mt-1 text-stone-600">
                                                    This offering comprises expert, customized care for challenging and sensitive materials that
                                                    fall outside the purview of standard dry cleaning or laundry. This includes, but is not
                                                    limited to, leather, suede, specialized synthetics, delicate antique lace, cashmere, and
                                                    down-filled articles (such as winter jackets, comforters, and duvets). These treatments
                                                    necessitate unique chemical processes, gentle manual manipulation, highly specialized
                                                    equipment, and frequently require significantly extended turnaround times due to multi-stage
                                                    processing and drying requirements.
                                                </span>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-emerald-600 font-bold text-lg flex-shrink-0">e)</span>
                                            <div>
                                                <strong className="text-stone-900">Dedicated Stain Removal Efforts:</strong>
                                                <span className="block mt-1 text-stone-600">
                                                    Our certified technicians employ advanced, multi-step chemical techniques, localized spotting
                                                    treatments, and deep-soaking methods to meticulously target and minimize the visibility of
                                                    persistent and set stains. Success is critically dependent upon the stain's type, age, the
                                                    underlying fabric, and whether it has been chemically fixed by previous treatments. However,
                                                    it is explicitly understood by the Customer that <strong>there is absolutely no guarantee of
                                                        100% success</strong> for the complete eradication of all stains, particularly those that are
                                                    aged, have been chemically fixed or oxidized, are inherent to the delicate nature of the
                                                    fabric type, or are situated in areas of high wear.
                                                </span>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="text-emerald-600 font-bold text-lg flex-shrink-0">f)</span>
                                            <div>
                                                <strong className="text-stone-900">Minor Repair or Alteration Services:</strong>
                                                <span className="block mt-1 text-stone-600">
                                                    Basic, non-structural services are offered conditionally to enhance the value of the principal
                                                    cleaning service. These typically include the secure replacement of standard buttons, simple
                                                    re-stitching of minor, straight-line seams, and occasional hem tacking. The specific scope,
                                                    availability, pricing, and requisite duration of these minor services may fluctuate significantly
                                                    by individual franchise location, contingent upon its specific in-house equipment, staffing
                                                    expertise (e.g., an onsite tailor), and current workload capacity. These services are provided
                                                    on an "as-is" basis and do not constitute a full, custom tailoring service.
                                                </span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">1.2 Contractual Obligation Commencement</h3>
                                    <p className="text-base leading-7">
                                        The act of placing an order with any Fab Clean franchise—irrespective of whether this transaction
                                        is completed physically at a store location, processed through our dedicated mobile application
                                        interface, initiated via our official website interface, communicated verbally over a recorded
                                        telephone line, or begun through an authorized third-party collection service—automatically and
                                        immediately signifies your unconditional entry into a legally binding service agreement with
                                        Fab Clean. The totality of the terms of this specific engagement is strictly and exclusively
                                        governed by the entirety of this document. This legally enforceable agreement commences precisely
                                        at the moment a Fab Clean representative officially accepts, meticulously inspects, completes
                                        the pre-cleaning documentation, and tags your items for processing and care, thereby formally
                                        initiating the service workflow and accepting the contractual obligation. The service agreement
                                        is only finalized upon the issuance of an itemized service receipt.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">1.3 Right to Refuse Service: Exercise of Discretion</h3>
                                    <p className="text-base leading-7 mb-4">
                                        We unequivocally and explicitly reserve the right, exercisable at our sole, absolute, and
                                        non-reviewable discretion, to refuse service to any prospective customer or to decline acceptance
                                        of any specific item presented for cleaning and processing. This right is fundamental for protecting
                                        our assets and maintaining a professional environment. Grounds for such refusal are multifaceted
                                        and are instituted primarily to safeguard our sophisticated processing assets, ensure the operational
                                        health and safety of our expert staff, and protect the garments of our other customers from potential
                                        cross-contamination or damage. These reasons may include, but are not strictly limited to:
                                    </p>
                                    <ul className="list-disc ml-8 space-y-2 text-stone-600">
                                        <li><strong>Safety and Equipment Risk:</strong> Items identified by our trained staff as potentially posing an undue, quantifiable risk to our sophisticated and expensive processing equipment.</li>
                                        <li><strong>Bio-Hazardous Material:</strong> Items that are deemed excessively soiled, pose a known bio-hazard, or are unsanitary in a manner requiring specialized decontamination beyond our standard protocols.</li>
                                        <li><strong>Care Label Deficiency:</strong> Items that are missing essential, appropriate, or legible manufacturer's care labels, making proper, safe processing impossible to accurately determine.</li>
                                        <li><strong>Policy Violation or Ethical Concerns:</strong> Any instances where the requested service, the item itself, or the customer's conduct violates our established internal operating policies or ethical standards.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <Separator className="my-12 bg-stone-300" />

                        {/* Section 2 */}
                        <section id="section-2" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    2
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Order Placement, Processing & Delivery
                                </h2>
                            </div>

                            <div
                                className="space-y-8 text-stone-700 leading-relaxed text-justify"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">2.1 Order Submission Channels and Formal Confirmation</h3>
                                    <p className="text-base leading-7">
                                        Customers retain full flexibility in securely submitting orders through various official and
                                        secure Fab Clean channels. This includes: physically presenting the items at a dedicated franchise
                                        location for in-person intake; initiating the order through dedicated and verified telephone lines;
                                        or utilizing our proprietary suite of digital platforms (including the official, secure Fab Clean
                                        website or mobile application). A valid and formally accepted order is confirmed only upon the
                                        issuance of an official, verifiable, itemized service receipt (which may be delivered digitally
                                        via email/SMS or provided physically). This receipt must clearly detail the accurate, documented
                                        count of all submitted items, the specific service type requested and agreed upon for each
                                        individual item, and the calculated estimated cost for the total service. <strong>The Customer
                                            bears the primary and immediate responsibility for meticulously verifying this critical information
                                            against their submission upon receipt</strong> and must report any discrepancy before the items
                                        depart the intake area for processing.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">2.2 Estimated Turnaround Time Disclaimer: Operational Fluidity</h3>
                                    <p className="text-base leading-7 mb-4">
                                        All delivery and collection times quoted by the franchise representative, whether digitally or
                                        verbally, at the time of order placement are strictly estimates and solely represent a target
                                        completion goal. These projected timelines are inherently non-guaranteed and are necessarily
                                        subject to non-negotiable adjustments based on a variety of fluid, complex, and unpredictable
                                        operational factors, including, but not limited to:
                                    </p>
                                    <ul className="list-disc ml-8 space-y-2 text-stone-600 mb-4">
                                        <li><strong>Service Complexity:</strong> The complexity, inherent duration, and specialized nature of the service required.</li>
                                        <li><strong>Workload and Volume:</strong> The specific receiving franchise's current operational workload and volume.</li>
                                        <li><strong>Maintenance and Equipment:</strong> The continuous, safe functionality of processing equipment, including mandatory regulatory checks and preventative maintenance.</li>
                                        <li><strong>External Circumstances:</strong> Unpredictable, unforeseen external circumstances or Force Majeure events (e.g., severe regional weather events, mandatory public holidays, supply chain interruptions).</li>
                                    </ul>
                                    <p className="text-base leading-7">
                                        While Fab Clean makes every professional endeavor to diligently adhere to initial estimates,
                                        we commit to notifying customers promptly of any significant or unexpected delays (typically
                                        defined as a delay exceeding 24 hours from the initial estimated time) that may substantially
                                        affect the promised delivery time, utilizing the primary contact method on file.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">2.3 Express and Expedited Services: Conditions and Surcharge</h3>
                                    <p className="text-base leading-7">
                                        Expedited processing services, commonly referred to as "Express Orders," "Rush Service," or
                                        "Same-Day Service," are made conditionally available only for certain pre-approved, non-specialty
                                        garment categories and are placed on a strictly prioritized operational schedule to minimize
                                        turnaround time below the standard rate. The provision of these accelerated services is strictly
                                        conditional upon the Customer's explicit understanding, acceptance, and payment of an additional,
                                        <strong> non-refundable premium surcharge</strong>, which will be calculated, clearly communicated,
                                        and mutually agreed upon by the Customer and the franchise prior to the commencement of any
                                        processing. Should an express order be accepted but the deadline missed due to a documented
                                        operational failure clearly on our part (excluding Force Majeure), the express surcharge will
                                        be fully refunded to the Customer, but the core service charges will remain due and payable.
                                    </p>
                                </div>

                                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
                                    <h3 className="font-bold text-amber-900 text-lg mb-3">2.4 Unclaimed Items Policy and Absolute Abandonment — IMPORTANT NOTICE</h3>
                                    <p className="text-amber-900 text-base leading-7">
                                        Customers are under a strict, non-negotiable obligation to collect or accept delivery of their
                                        finished, professionally processed items within <strong>30 calendar days</strong> commencing
                                        from the original promised delivery date, as formally notified by the servicing franchise via
                                        the agreed-upon communication method. Following the expiry of the initial 30-day period, a
                                        documented, reasonable effort will be made by the franchise to contact the customer regarding
                                        their uncollected items. Any items that remain unclaimed or uncollected after a full period of
                                        <strong> 60 calendar days</strong> following the original delivery date will be unequivocally
                                        and irrevocably deemed abandoned property by the Customer, with all ownership rights relinquished.
                                        Fab Clean explicitly reserves the full, unqualified right, without any further notice or
                                        subsequent obligation to the customer, to dispose of, donate to a recognized charitable
                                        organization, or otherwise liquidate these abandoned items to recover storage and administrative
                                        costs. We shall consequently assume <strong>absolutely no further liability, responsibility,
                                            or financial obligation</strong> for such disposal or liquidation.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <Separator className="my-12 bg-stone-300" />

                        {/* Section 3 */}
                        <section id="section-3" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    3
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Pricing, Payments & Financial Terms
                                </h2>
                            </div>

                            <div
                                className="space-y-8 text-stone-700 leading-relaxed text-justify"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">3.1 Detailed Pricing Structure and Variables</h3>
                                    <p className="text-base leading-7 mb-4">
                                        The final service prices are meticulously calculated based on a detailed, transparent, and
                                        itemized structure, the complete matrix for which is generally available for review at the
                                        franchise location prior to order placement. This comprehensive calculation considers several
                                        key, interrelated variables to ensure fairness, accuracy, and reflection of the resources utilized:
                                    </p>
                                    <ul className="list-disc ml-8 space-y-2 text-stone-600">
                                        <li><strong>The Specified Service Type Requested:</strong> This is the primary determinant (e.g., premium dry cleaning, standard bulk laundry, specialized ozone treatment, bespoke wedding dress preservation).</li>
                                        <li><strong>The Specific Garment Category:</strong> Prices are tiered based on the complexity of the item (e.g., formal gown requiring multi-step hand-finishing, heavy down-filled winter coat, standard business shirt).</li>
                                        <li><strong>The Material's Composition:</strong> Specialty or challenging materials incur a higher cost (e.g., silk, genuine leather, suede, cashmere, or heavily textured synthetic blends).</li>
                                        <li><strong>Unique or Bespoke Handling Requirements:</strong> Explicit, documented requests by the customer that necessitate additional, non-standard labor or resources.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">3.2 Payment Obligations and Acceptance Methods</h3>
                                    <p className="text-base leading-7">
                                        Full and complete payment for all services rendered is due and strictly payable immediately
                                        upon the Customer's collection of the processed items from the franchise or the acceptance
                                        of delivery at their designated location. Processed items will not be physically released to
                                        the Customer, nor will the third-party delivery be completed, until the total service fee has
                                        been received in full by the franchise. Fab Clean franchises are typically equipped to accept
                                        multiple, convenient forms of payment including cash, Unified Payments Interface (UPI) transfers,
                                        and most major digital payment methods (such as credit/debit cards, mobile wallets, and secure
                                        online payment links). However, final payment acceptance is subject to the specific technical
                                        capabilities and operational infrastructure of the individual franchise location.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">3.3 Price Guarantee and Policy on Changes</h3>
                                    <p className="text-base leading-7">
                                        While our standard, comprehensive, published pricing matrix is dynamic and subject to necessary,
                                        periodic revision and change without requiring prior direct notification to the general public,
                                        <strong> the specific, itemized price that is formally quoted to the customer and diligently
                                            documented on the official service receipt at the precise moment the order is accepted by the
                                            franchise will be honored and guaranteed for that specific, documented order.</strong> Price
                                        adjustments will not be applied retrospectively to orders already accepted, tagged, and actively
                                        in process.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">3.4 Credit Facilities and Exceptional Arrangements</h3>
                                    <p className="text-base leading-7">
                                        The extension of credit or delayed payment facilities is emphatically not standard operating
                                        practice at Fab Clean for individual, walk-in, or routine digital customers. Such arrangements
                                        represent a significant, isolated exception and may be exclusively extended only to select,
                                        pre-approved corporate clients or long-term, high-volume commercial customers who have
                                        demonstrably maintained a history of reliable and consistent service use. Such decisions are
                                        made solely at the discretionary decision of the individual franchise management and are subject
                                        to stringent financial review. Any approved credit facility will be subject to a separate, formal,
                                        and legally binding credit agreement detailing specific, non-negotiable terms and conditions.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <Separator className="my-12 bg-stone-300" />

                        {/* Section 4 */}
                        <section id="section-4" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    4
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Limitations of Liability & Claims
                                </h2>
                            </div>

                            <div
                                className="space-y-8 text-stone-700 leading-relaxed text-justify"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">4.1 Garment Inspection and Liability for Delicate Items</h3>
                                    <p className="text-base leading-7 mb-4">
                                        While our professional technicians are extensively trained to exercise the highest level of
                                        industry-standard care, diligence, and expertise throughout the cleaning and finishing processes,
                                        Fab Clean shall not be held liable for any pre-existing damage, or any damage that occurs during
                                        the necessary and standard cleaning process, to inherently delicate, fragile, or non-cleanable
                                        garment components. This liability exclusion specifically includes, but is not limited to:
                                    </p>
                                    <ul className="list-disc ml-8 space-y-2 text-stone-600 mb-4">
                                        <li>Intricate beading, permanently sewn-on sequins, loose or exceptionally fragile ornamental elements, or non-colorfast embroidery.</li>
                                        <li>Delicate decorative trim, non-fastened buttons, or structurally weak embellishments.</li>
                                        <li>Damage arising directly from inherent, non-visible defects in the garment's design or construction that only become apparent during the cleaning process.</li>
                                    </ul>
                                    <p className="text-base leading-7">
                                        This exclusion applies rigorously unless the Customer specifically identifies, meticulously
                                        documents, and notes these particular conditions in writing on the service receipt at the exact
                                        time of order submission, and the franchise representative acknowledges the potential risk in writing.
                                    </p>
                                </div>

                                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl">
                                    <h3 className="font-bold text-red-900 text-lg mb-3">4.2 Strict Claims Procedure for Loss or Damage — CRITICAL NOTICE</h3>
                                    <p className="text-red-900 text-base leading-7 mb-4">
                                        Any and all claims pertaining to items allegedly lost or verifiable physical damage sustained
                                        during our processing must be formally submitted, <strong>in writing</strong>, to the servicing
                                        franchise location within a strict, non-negotiable period of <strong>24 HOURS</strong> following
                                        the confirmed time of delivery or collection. This immediate window is absolutely essential for
                                        a timely, accurate, and effective internal investigation. <strong>The failure to formally report
                                            a claim in writing within this non-negotiable 24-hour window will result in the claim being
                                            automatically rejected without further review or investigation.</strong>
                                    </p>
                                    <p className="text-red-900 text-base leading-7">
                                        In the rare event that a claim for verifiable loss or damage is officially approved following a
                                        thorough internal investigation, the maximum liability assumed by Fab Clean for any single item,
                                        regardless of its true original purchase price, its current replacement value, or its sentimental
                                        value, shall be strictly limited and shall <strong>not exceed ten (10) times the documented
                                            service charge</strong> billed for the cleaning of that specific item. This maximum liability
                                        represents the total, exclusive, and final compensation offered to the customer.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">4.3 Fabric Defects and Care Label Compliance Exclusion</h3>
                                    <p className="text-base leading-7 mb-4">
                                        Fab Clean explicitly holds no responsibility or liability for common, unavoidable textile issues
                                        that can manifest or become more apparent after cleaning, such as:
                                    </p>
                                    <ul className="list-disc ml-8 space-y-2 text-stone-600 mb-4">
                                        <li>Natural or expected color fading or dye bleeding that occurs despite our diligent and good-faith following of manufacturer's care label instructions.</li>
                                        <li>Expected minimal shrinkage (within documented industry tolerances for the fabric type, which is typically 1-3%).</li>
                                        <li>Normal and unavoidable texture changes, pilling, or loss of the original "hand" (feel) of the fabric due to required cleaning solvents, heat, or agitation.</li>
                                        <li>Damage resulting from the complete absence of a manufacturer's care label, or our good-faith adherence to instructions that subsequently prove to be faulty.</li>
                                        <li>Cumulative, chronic wear and tear, age-related degradation, or damage sustained by the item prior to its submission for cleaning.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">4.4 Responsibility for Personal Belongings and Pockets</h3>
                                    <p className="text-base leading-7">
                                        Customers bear the sole and absolute responsibility for meticulously inspecting and completely
                                        emptying all pockets, checking all detachable parts (e.g., belts, detachable hoods, removable
                                        collars), and searching all hidden compartments of garments prior to submitting them to Fab Clean
                                        for cleaning. <strong>Fab Clean assumes no liability whatsoever</strong> for the loss, damage, or
                                        destruction of any items (including, but not limited to: money, keys, jewelry, watches, documents,
                                        electronic devices, or any other valuables) that were left in pockets and subsequently lost,
                                        damaged, or destroyed during the cleaning, handling, or transportation process. Any valuable
                                        items found will be documented, securely logged, and held by the franchise for a period of
                                        7 calendar days before being disposed of or handed over to local authorities as lost property.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <Separator className="my-12 bg-stone-300" />

                        {/* Section 5 */}
                        <section id="section-5" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    5
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Privacy, Data Protection & Communication
                                </h2>
                            </div>

                            <div
                                className="space-y-8 text-stone-700 leading-relaxed text-justify"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">5.1 Data Collection and Usage Protocol Compliance</h3>
                                    <p className="text-base leading-7">
                                        We are firmly committed to the secure and ethical collection, processing, and storage of only
                                        the necessary customer information (including name, physical address, contact details, and
                                        transactional order history). This data is collected and used strictly for the primary, explicit,
                                        and essential purposes of: efficient service provision, accurate order fulfillment, secure
                                        payment processing, internal analytics to rigorously manage our operations, and the ongoing
                                        enhancement of the overall customer experience through data analysis and service optimization.
                                        All data processing is carried out in strict compliance with current, applicable data protection
                                        and privacy laws in the relevant jurisdiction, including measures for data minimization and accuracy.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">5.2 Confidentiality and Disclosure Restrictions</h3>
                                    <p className="text-base leading-7">
                                        Your personal data is handled with the utmost confidentiality and treated with a high standard
                                        of security, employing industry-standard encryption, firewalls, and access controls where
                                        applicable. It will not be sold, leased, rented, or shared with any external third parties
                                        outside the Fab Clean network, except in specific, legally mandated situations (e.g., compliance
                                        with a legally binding court order or government subpoena) or where absolutely necessary for the
                                        direct fulfillment of the contracted services (e.g., securely sharing delivery details with an
                                        authorized third-party logistics partner or a central, PCI-compliant payment gateway for
                                        transaction processing). All third-party processors are vetted for their own compliance with
                                        data protection laws.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">5.3 Marketing and Service Notifications Consent</h3>
                                    <p className="text-base leading-7">
                                        By willingly providing your mobile telephone number and/or email address, you expressly consent
                                        to receive crucial service updates, automated order status notifications (e.g., order acceptance,
                                        completion, and dispatch), targeted promotional offers, and occasional customer satisfaction
                                        feedback requests from Fab Clean. These communications will be delivered via standard electronic
                                        channels, which include, but are not limited to, standard SMS, email, and designated messaging
                                        platforms like WhatsApp. You retain the absolute right to withdraw this consent and opt-out of
                                        receiving purely promotional or marketing messages at any time by following the secure unsubscribe
                                        instructions provided in the respective messages or by contacting Fab Clean Support directly.
                                        Opting out of marketing will not prevent the receipt of essential, operational service-related
                                        notifications.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <Separator className="my-12 bg-stone-300" />

                        {/* Section 6 */}
                        <section id="section-6" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    6
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Franchise Operations & Dispute Resolution
                                </h2>
                            </div>

                            <div
                                className="space-y-8 text-stone-700 leading-relaxed text-justify"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">6.1 Independent Franchise Network Structure and Governance</h3>
                                    <p className="text-base leading-7">
                                        Fab Clean's operational model is centered on a decentralized network comprising numerous
                                        independently owned and operated franchise businesses. This means that while every franchise
                                        is contractually obligated, through a binding franchise agreement, to strictly adhere to
                                        Fab Clean's rigorous brand quality standards, operational guidelines, and ethical standards,
                                        each individual franchise functions as a separate and distinct legal entity. This structure
                                        allows for localized service and responsiveness.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">6.2 Local Operational Responsibility</h3>
                                    <p className="text-base leading-7">
                                        Each individual franchise location maintains the sole and complete responsibility for: its
                                        daily operational activities, the recruitment, training, and internal management of its staff,
                                        the setting of local, competitive pricing policies (within general corporate guidelines), and
                                        direct, frontline customer service interactions, including initial claims handling. The Customer
                                        contracts directly and primarily with the specific franchise that accepts the order for the
                                        provision of the cleaning and finishing services. Therefore, the primary and immediate point
                                        of contact for service-related issues is the servicing franchise.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">6.3 Initial Dispute Resolution Protocol</h3>
                                    <p className="text-base leading-7">
                                        In the event of any query, formal complaint, or dispute concerning the quality of service
                                        provided, specific item damage, or failure of order fulfillment, the Customer is strictly
                                        required to first address the issue directly and promptly, <strong>in writing</strong>, with
                                        the specific franchise location where the service was originally performed. This direct, local
                                        communication is mandated as the fastest, most efficient, and contractually required initial
                                        path to resolution. Only if a complete and satisfactory resolution cannot be achieved at the
                                        local franchise level, and following documented, good-faith attempts by the Customer to resolve
                                        the issue locally (e.g., documented emails or service tickets), may the matter then be formally
                                        escalated to the Fab Clean Corporate Support team for further review, mediation, and potential
                                        corporate intervention. Corporate support will not act as a first line of claims processing.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <Separator className="my-12 bg-stone-300" />

                        {/* Section 7 */}
                        <section id="section-7" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    7
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    General Provisions
                                </h2>
                            </div>

                            <div
                                className="space-y-8 text-stone-700 leading-relaxed text-justify"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">7.1 Governing Law and Jurisdiction</h3>
                                    <p className="text-base leading-7">
                                        These Terms & Conditions and the entirety of the service agreement established between
                                        Fab Clean and the Customer shall be governed by and construed strictly in accordance with
                                        the laws of the specific jurisdiction where the servicing franchise is physically located,
                                        without giving effect to any principles of conflict of laws that would result in the application
                                        of the law of a different jurisdiction. The Customer consents to the exclusive jurisdiction
                                        and venue of the courts located in the servicing franchise's operational territory.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">7.2 Updates and Modifications to Terms</h3>
                                    <p className="text-base leading-7">
                                        These Terms & Conditions are dynamic, living documents and are subject to periodic updates,
                                        necessary amendments, or modifications at our discretion to reflect evolving changes in our
                                        services, technological advancements, or changes in legal and regulatory requirements. The
                                        most current, operative, and controlling version of these terms will always be prominently
                                        published on our official website and supersedes all prior versions. It is the Customer's
                                        responsibility to review them periodically. Your continued engagement with and use of our
                                        services following the posting of any such changes constitutes your definitive, explicit,
                                        and irrevocable acceptance of those modified terms.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3">7.3 Severability Clause</h3>
                                    <p className="text-base leading-7">
                                        Should any specific provision or clause of these Terms & Conditions be found by a court of
                                        competent jurisdiction or an administrative body to be invalid, unlawful, or otherwise
                                        unenforceable for any reason whatsoever, the validity, legality, and enforceability of all
                                        remaining provisions contained herein shall not in any way be affected, impaired, or diminished.
                                        The invalid clause shall be severed and removed, and the remainder of the agreement shall
                                        continue in full force and effect as if the severed provision had never been included,
                                        preserving the maximum possible effect of the original intent.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <Separator className="my-12 bg-stone-300" />

                        {/* Section 8 - Contact */}
                        <section id="section-8" className="mb-14 scroll-mt-24">
                            <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                <span
                                    className="text-5xl font-bold text-emerald-600"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    8
                                </span>
                                <h2
                                    className="text-2xl font-bold text-stone-800 uppercase tracking-wide"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Contact Information
                                </h2>
                            </div>

                            <div
                                className="text-stone-700 leading-relaxed"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                <p className="mb-6 text-justify text-base leading-7">
                                    For any formal inquiries regarding the service contract, for the process of formally escalating
                                    unresolved disputes from the local franchise level (as per Section 6.3), or for questions regarding
                                    the interpretation or application of these terms or our services, please contact the Fab Clean
                                    Corporate Support team through the following official channels:
                                </p>

                                <div className="bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-xl p-8">
                                    <div className="flex items-center gap-5 mb-6 pb-6 border-b border-stone-300">
                                        <img
                                            src="/assets/fabclean-logo.png"
                                            alt="Fab Clean"
                                            className="h-14 object-contain"
                                        />
                                        <div>
                                            <p className="font-bold text-stone-900 text-xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                                Corporate Support
                                            </p>
                                            <p className="text-sm text-stone-500">Mediation and Escalation Department</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-stone-700 text-base">
                                        <p>
                                            <span className="font-semibold text-stone-900">Email:</span>{" "}
                                            <a href="mailto:support@myfabclean.com" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                                                support@myfabclean.com
                                            </a>
                                        </p>
                                        <p>
                                            <span className="font-semibold text-stone-900">Website:</span>{" "}
                                            <a href="https://www.myfabclean.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                                                www.myfabclean.com
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Acceptance Notice */}
                        <div
                            className="mt-14 p-10 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-xl"
                            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                        >
                            <h3
                                className="text-xl font-bold text-emerald-900 uppercase tracking-wider mb-5 text-center"
                                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                                Acknowledgment and Acceptance
                            </h3>
                            <p className="text-emerald-800 leading-relaxed text-center max-w-3xl mx-auto text-base">
                                By utilizing Fab Clean services, you acknowledge that you have read, fully understood,
                                and unconditionally agree to be bound by these Terms & Conditions in their entirety.
                                These terms constitute the complete and exclusive agreement between you and Fab Clean
                                regarding the provision of textile care services and supersede all prior or contemporaneous
                                understandings, agreements, negotiations, representations, and warranties, both written and oral.
                            </p>
                        </div>

                        {/* Document Footer */}
                        <div className="mt-14 pt-10 border-t-2 border-stone-300 text-center">
                            <img
                                src="/assets/fabclean-logo.png"
                                alt="Fab Clean"
                                className="h-12 object-contain mx-auto mb-5 opacity-70"
                            />
                            <p
                                className="text-base text-stone-600 font-medium"
                                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                                © {currentYear} Fab Clean. All Rights Reserved.
                            </p>
                            <p
                                className="text-sm text-stone-500 mt-1"
                                style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                            >
                                Professional Laundry & Dry Cleaning Services
                            </p>
                            <div className="mt-6 pt-6 border-t border-stone-200">
                                <p
                                    className="text-xs text-stone-400 tracking-wider"
                                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                                >
                                    DOCUMENT ID: FC-TC-{currentYear}-V2.1 | CLASSIFICATION: PUBLIC | LAST REVISED: DECEMBER {currentYear}
                                </p>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
