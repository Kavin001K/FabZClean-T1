/**
 * Terms & Conditions Page
 * 
 * Accessible only via direct link: myfabclean.com/terms
 * NOT included in navigation - completely isolated
 * 
 * Professional legal document with premium typography
 * Features: Scroll unrolling animation on page load
 */

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

export default function TermsPage() {
    const currentYear = new Date().getFullYear();
    const [isLoading, setIsLoading] = useState(true);
    const [scrollPhase, setScrollPhase] = useState(0); // 0: closed, 1: opening, 2: open, 3: content visible

    // Load professional fonts and trigger animation
    useEffect(() => {
        // Add Google Fonts link
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Start animation sequence
        const timer1 = setTimeout(() => setScrollPhase(1), 300);  // Start opening
        const timer2 = setTimeout(() => setScrollPhase(2), 1200); // Fully open
        const timer3 = setTimeout(() => setScrollPhase(3), 1800); // Show content
        const timer4 = setTimeout(() => setIsLoading(false), 2500); // Complete

        return () => {
            document.head.removeChild(link);
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 overflow-hidden">

            {/* Scroll Opening Animation Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950">
                    {/* Animated scroll/parchment */}
                    <div className="relative flex flex-col items-center">
                        {/* Top scroll rod */}
                        <div
                            className={`w-72 h-6 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-full shadow-2xl transition-all duration-700 ease-out ${scrollPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                                }`}
                            style={{
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
                            }}
                        >
                            {/* Rod decorations */}
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-600 rounded-full shadow-inner" />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-600 rounded-full shadow-inner" />
                        </div>

                        {/* Unrolling parchment */}
                        <div
                            className={`relative bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 shadow-2xl overflow-hidden transition-all duration-1000 ease-out ${scrollPhase >= 1 ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{
                                width: '280px',
                                height: scrollPhase >= 2 ? '400px' : scrollPhase >= 1 ? '100px' : '0px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 0 30px rgba(139,69,19,0.1)',
                                borderLeft: '2px solid rgba(139,69,19,0.2)',
                                borderRight: '2px solid rgba(139,69,19,0.2)',
                            }}
                        >
                            {/* Parchment texture overlay */}
                            <div
                                className="absolute inset-0 opacity-30"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                                }}
                            />

                            {/* Content on parchment */}
                            <div
                                className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700 ${scrollPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                    }`}
                            >
                                {/* Logo */}
                                <img
                                    src="/assets/fabclean-logo.png"
                                    alt="Fab Clean"
                                    className="h-16 object-contain mb-6"
                                />

                                {/* Decorative line */}
                                <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-700 to-transparent mb-4" />

                                {/* Title */}
                                <h1
                                    className="text-2xl font-bold text-stone-800 text-center mb-2"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Terms & Conditions
                                </h1>

                                <p
                                    className="text-xs text-stone-500 tracking-widest uppercase mb-6"
                                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                                >
                                    Official Document
                                </p>

                                {/* Loading indicator */}
                                <div className="flex items-center gap-2 text-stone-600">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>

                                <p
                                    className="text-xs text-stone-500 mt-4"
                                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                                >
                                    Preparing document...
                                </p>

                                {/* Decorative seal */}
                                <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-900 shadow-lg flex items-center justify-center opacity-80">
                                    <div className="w-12 h-12 rounded-full border-2 border-red-300/50 flex items-center justify-center">
                                        <span className="text-red-100 font-bold text-xs" style={{ fontFamily: "'Cormorant Garamond', serif" }}>FC</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom scroll rod */}
                        <div
                            className={`w-72 h-6 bg-gradient-to-t from-amber-700 via-amber-800 to-amber-900 rounded-full shadow-2xl transition-all duration-700 ease-out ${scrollPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                                }`}
                            style={{
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,255,255,0.2)',
                                transitionDelay: scrollPhase >= 2 ? '200ms' : '0ms'
                            }}
                        >
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-600 rounded-full shadow-inner" />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-600 rounded-full shadow-inner" />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Fades in after animation */}
            <div
                className={`transition-all duration-1000 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`}
            >
                {/* Professional Header */}
                <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40 shadow-sm">
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
                    <Card className="border border-stone-200 shadow-2xl bg-gradient-to-b from-white via-orange-50/20 to-stone-50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <CardContent className="p-10 md:p-14">

                            {/* Document Title */}
                            <div className="text-center mb-14 pb-8 border-b-2 border-stone-300 animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
                                {/* Decorative top element */}
                                <div className="flex justify-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-emerald-600" />
                                        <div className="w-3 h-3 rotate-45 bg-emerald-600" />
                                        <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-emerald-600" />
                                    </div>
                                </div>

                                <h1
                                    className="text-4xl md:text-5xl font-bold text-stone-800 tracking-tight mb-4"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    Terms & Conditions
                                </h1>
                                <p className="text-sm text-stone-500 tracking-widest uppercase" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    Effective Date: December {currentYear} • Document Version 2.1
                                </p>

                                {/* Decorative bottom element */}
                                <div className="flex justify-center mt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-stone-400 to-transparent" />
                                    </div>
                                </div>
                            </div>

                            {/* Preamble */}
                            <div
                                className="mb-12 p-8 bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-xl border border-stone-200 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
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
                            <div className="mb-14 p-8 bg-emerald-50/70 rounded-xl border border-emerald-200/70 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
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
                                    <a href="#section-1" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 1. Service Agreement and Acceptance
                                    </a>
                                    <a href="#section-2" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 2. Order Placement, Processing & Delivery
                                    </a>
                                    <a href="#section-3" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 3. Pricing, Payments & Financial Terms
                                    </a>
                                    <a href="#section-4" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 4. Limitations of Liability & Claims
                                    </a>
                                    <a href="#section-5" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 5. Privacy, Data Protection & Communication
                                    </a>
                                    <a href="#section-6" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 6. Franchise Operations & Dispute Resolution
                                    </a>
                                    <a href="#section-7" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 7. General Provisions
                                    </a>
                                    <a href="#section-8" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">§</span> 8. Contact Information
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
                                                        and professional folding or bagging. Articles are cleaned collectively with other routine
                                                        customer items to optimize efficiency and maintain cost-effectiveness.
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
                                                        and high-precision, temperature-regulated equipment for suits, evening wear, silks, wools,
                                                        and cashmere.
                                                    </span>
                                                </div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">c)</span>
                                                <div>
                                                    <strong className="text-stone-900">Professional Pressing and Finishing:</strong>
                                                    <span className="block mt-1 text-stone-600">
                                                        Meticulous hand-ironing, industrial steaming, and precise finishing techniques for a crisp,
                                                        wrinkle-free, ready-to-wear finish. Items are returned on high-quality hangers with
                                                        protective coverings.
                                                    </span>
                                                </div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">d)</span>
                                                <div>
                                                    <strong className="text-stone-900">Specialized Fabric Treatments:</strong>
                                                    <span className="block mt-1 text-stone-600">
                                                        Expert care for leather, suede, specialized synthetics, antique lace, cashmere, and
                                                        down-filled articles requiring unique chemical processes and extended turnaround times.
                                                    </span>
                                                </div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">e)</span>
                                                <div>
                                                    <strong className="text-stone-900">Dedicated Stain Removal Efforts:</strong>
                                                    <span className="block mt-1 text-stone-600">
                                                        Advanced, multi-step chemical techniques to minimize persistent stains.
                                                        <strong> Note: 100% stain removal is not guaranteed</strong> for all stain types.
                                                    </span>
                                                </div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">f)</span>
                                                <div>
                                                    <strong className="text-stone-900">Minor Repair or Alteration Services:</strong>
                                                    <span className="block mt-1 text-stone-600">
                                                        Basic services including button replacement, simple re-stitching, and hem tacking.
                                                        Availability varies by franchise location.
                                                    </span>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">1.2 Contractual Obligation Commencement</h3>
                                        <p className="text-base leading-7">
                                            The act of placing an order with any Fab Clean franchise—whether in-store, via mobile app,
                                            website, telephone, or authorized third-party collection—automatically signifies your
                                            unconditional entry into a legally binding service agreement. The agreement commences when
                                            a Fab Clean representative officially accepts, inspects, documents, and tags your items
                                            for processing. The service agreement is finalized upon issuance of an itemized service receipt.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">1.3 Right to Refuse Service</h3>
                                        <p className="text-base leading-7">
                                            We reserve the right, at our sole discretion, to refuse service to any customer or decline
                                            any item. Grounds include: items posing equipment/safety risks, bio-hazardous materials,
                                            missing care labels, or policy/ethical violations.
                                        </p>
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
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">2.1 Order Submission and Confirmation</h3>
                                        <p className="text-base leading-7">
                                            Orders may be submitted at franchise locations, via telephone, or through our digital platforms.
                                            A valid order is confirmed upon issuance of an itemized service receipt detailing item count,
                                            service type, and estimated cost. <strong>The Customer bears responsibility for verifying
                                                this information</strong> and must report discrepancies before items depart for processing.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">2.2 Estimated Turnaround Time</h3>
                                        <p className="text-base leading-7">
                                            All quoted delivery times are estimates subject to adjustment based on service complexity,
                                            workload, equipment maintenance, and external circumstances. We will notify customers of
                                            delays exceeding 24 hours from the initial estimate.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">2.3 Express Services</h3>
                                        <p className="text-base leading-7">
                                            Express Orders are available for certain garment categories at an additional,
                                            <strong> non-refundable premium surcharge</strong>. If we miss an express deadline due to
                                            our operational failure (excluding Force Majeure), the express surcharge will be refunded.
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
                                        <h3 className="font-bold text-amber-900 text-lg mb-3">2.4 Unclaimed Items Policy — IMPORTANT</h3>
                                        <p className="text-amber-900 text-base leading-7">
                                            Items must be collected within <strong>30 calendar days</strong> of the delivery date.
                                            After <strong>60 calendar days</strong>, unclaimed items will be deemed abandoned and may
                                            be disposed of, donated, or liquidated without further notice or liability.
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
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">3.1 Pricing Structure</h3>
                                        <p className="text-base leading-7">
                                            Prices are calculated based on: service type, garment category (complexity), material
                                            composition (specialty fabrics incur higher costs), and unique handling requirements.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">3.2 Payment Obligations</h3>
                                        <p className="text-base leading-7">
                                            Full payment is due upon collection or delivery. Items will not be released until payment
                                            is received. We accept cash, UPI, credit/debit cards, and digital payment methods.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">3.3 Price Guarantee</h3>
                                        <p className="text-base leading-7">
                                            <strong>The price documented on your service receipt will be honored</strong> for that
                                            specific order. Price adjustments will not be applied retrospectively to orders in process.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">3.4 Credit Facilities</h3>
                                        <p className="text-base leading-7">
                                            Credit is not standard practice and may only be extended to pre-approved corporate or
                                            commercial customers at franchise management's discretion.
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
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">4.1 Delicate Items Disclaimer</h3>
                                        <p className="text-base leading-7">
                                            Fab Clean shall not be liable for damage to inherently delicate components including:
                                            beading, sequins, ornamental elements, decorative trim, buttons, or damage from inherent
                                            garment defects—unless documented in writing at order submission.
                                        </p>
                                    </div>

                                    <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl">
                                        <h3 className="font-bold text-red-900 text-lg mb-3">4.2 Claims Procedure — CRITICAL NOTICE</h3>
                                        <p className="text-red-900 text-base leading-7 mb-4">
                                            Claims must be submitted <strong>IN WRITING</strong> within <strong>24 HOURS</strong> of
                                            delivery/collection. <strong>Claims after this period will be automatically rejected.</strong>
                                        </p>
                                        <p className="text-red-900 text-base leading-7">
                                            Maximum liability per item: <strong>10 times (10×) the service charge</strong> for that item.
                                            This is the total, exclusive, and final compensation available.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">4.3 Fabric Defects Exclusion</h3>
                                        <p className="text-base leading-7">
                                            We are not liable for: color fading despite following care instructions, expected shrinkage
                                            (1-3%), texture changes, inherent fabric defects, missing/faulty care labels, or wear and
                                            age-related degradation.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">4.4 Personal Belongings</h3>
                                        <p className="text-base leading-7">
                                            Customers must empty all pockets and check detachable parts before submission.
                                            <strong> Fab Clean assumes no liability</strong> for items left in pockets. Found items
                                            are held for 7 days before disposal.
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
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">5.1 Data Collection</h3>
                                        <p className="text-base leading-7">
                                            We collect customer information (name, address, contact details, order history) strictly
                                            for service provision, order fulfillment, payment processing, and operational analytics,
                                            in compliance with applicable data protection laws.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">5.2 Confidentiality</h3>
                                        <p className="text-base leading-7">
                                            Your data will not be sold or shared with third parties, except where legally mandated
                                            or necessary for service fulfillment (e.g., delivery partners, payment processors).
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">5.3 Communications</h3>
                                        <p className="text-base leading-7">
                                            By providing your contact details, you consent to receive service updates, order
                                            notifications, and promotional offers via SMS, email, or WhatsApp. You may opt-out
                                            of marketing communications at any time.
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
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">6.1 Franchise Network</h3>
                                        <p className="text-base leading-7">
                                            Fab Clean operates through independently owned and operated franchises. Each franchise
                                            is a separate legal entity responsible for its operations, staffing, and customer service.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">6.2 Dispute Resolution</h3>
                                        <p className="text-base leading-7">
                                            Complaints must first be addressed <strong>in writing</strong> with the servicing franchise.
                                            Only if unresolved may matters be escalated to Fab Clean Corporate Support for mediation.
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
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">7.1 Governing Law</h3>
                                        <p className="text-base leading-7">
                                            These Terms shall be governed by the laws of the jurisdiction where the servicing
                                            franchise is located. Customers consent to the exclusive jurisdiction of courts in
                                            the franchise's operational territory.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">7.2 Updates to Terms</h3>
                                        <p className="text-base leading-7">
                                            These Terms may be updated periodically. The current version on our website supersedes
                                            all prior versions. Continued use of services constitutes acceptance of modified terms.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">7.3 Severability</h3>
                                        <p className="text-base leading-7">
                                            If any provision is found unenforceable, remaining provisions shall continue in full
                                            force and effect.
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
                                        For formal inquiries, escalation of unresolved disputes, or questions regarding these terms:
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
                                    regarding the provision of textile care services.
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
        </div>
    );
}
