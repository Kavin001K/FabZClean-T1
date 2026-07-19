import { useEffect, useState } from 'react';
import { ChevronUp, Phone, Mail, Globe, Menu, X, ChevronRight, FileText, Shield, RefreshCw, Cookie } from 'lucide-react';

// Mobile detection hook
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

// SEO and Mobile Meta Tags Hook
const useTermsSEO = () => {
    useEffect(() => {
        document.title = "Terms & Conditions | Fab Clean - Premium Laundry Services";

        // Mobile viewport meta
        let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';

        // Theme color
        let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!themeColor) {
            themeColor = document.createElement('meta');
            themeColor.name = 'theme-color';
            document.head.appendChild(themeColor);
        }
        themeColor.content = '#059669';

        const metaTags = [
            { name: "description", content: "Read Fab Clean's comprehensive terms and conditions for premium laundry and dry cleaning services." },
            { name: "keywords", content: "fab clean terms, laundry terms, dry cleaning policy, garment care agreement" },
            { property: "og:title", content: "Terms & Conditions | Fab Clean" },
            { property: "og:description", content: "Comprehensive service agreement for Fab Clean laundry services." },
            { property: "og:type", content: "website" },
        ];

        const addedMetas: HTMLMetaElement[] = [];
        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            Object.entries(tag).forEach(([key, value]) => meta.setAttribute(key, value));
            document.head.appendChild(meta);
            addedMetas.push(meta);
        });

        // Add mobile-friendly styles
        const style = document.createElement('style');
        style.id = 'terms-mobile-styles';
        style.textContent = `
            html {
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
            }
            .safe-area-top {
                padding-top: env(safe-area-inset-top, 0px);
            }
            .safe-area-bottom {
                padding-bottom: env(safe-area-inset-bottom, 16px);
            }
            .touch-target {
                min-height: 44px;
                min-width: 44px;
            }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes slide-up {
                0% { transform: translateY(10px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes fade-in {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        `;
        document.head.appendChild(style);

        return () => {
            document.title = "Fab Clean - Premium Laundry & Dry Cleaning";
            addedMetas.forEach(meta => meta.remove());
            const existingStyle = document.getElementById('terms-mobile-styles');
            if (existingStyle) existingStyle.remove();
        };
    }, []);
};

// Terms Data — matches official Fab Clean Terms & Conditions document
const termsData = {
    lastUpdated: "July 19, 2026",
    effectiveDate: "January 1, 2025",
    sections: [
        {
            id: 1,
            title: "Stain Removal & Garment Care",
            shortTitle: "Garment Care",
            content: `We take utmost care to remove stains without damaging garments. We do not guarantee complete removal of stubborn as well as old stains.

We will treat all garments with extreme care. We cannot guarantee against color loss, bleeding, shrinkage, or damage to weak and tender fabrics during process.

If special instructions or delicate garments are there, the customer should inform at the time of booking. Otherwise the store is not responsible for damage or color bleed.

We will undertake the cleaning of the garments in the best possible manner that our technicians deem fit. The various cleaning methods deployed by us will vary from wash in emulsifier, detergent and softeners, to soft wash for delicate garments.`
        },
        {
            id: 2,
            title: "Pickup & Delivery",
            shortTitle: "Delivery",
            content: `Pick up and drop facility is available only within a 3 km radius from the store for a minimum order value of Rs 500 and above. This service availability depends on delivery.

Every effort is made to deliver the clothes on time. However, due to unforeseen circumstances, labor problems, or power issues, the delivery time may be delayed.

Urgent delivery of garments will be charged at 50% extra and will be delivered within 48 hours (Express Delivery).`
        },
        {
            id: 3,
            title: "Quality, Inspection & Reprocessing",
            shortTitle: "Quality",
            content: `In case of any unsatisfactory quality, the order tags need to be intact and garments should be in unused condition. After inspection only, the garment is taken for free reprocess.

Customers are requested to check and examine the clothes at the time of delivery. Complaints or any loss will not be entertained after 48 hours from the date of delivery.

Customers are advised to remove all packing covers within a day after receiving garments from the store. Fungus may occur due to moisture in the environment. Hence the store is not responsible and will not reprocess for the same.`
        },
        {
            id: 4,
            title: "Liability & Risk",
            shortTitle: "Liability",
            content: `The store shall not be liable for damage or color bleed during laundry service (wash by per kg/pcs).

Articles with embroidery work, color threads, plastic beads, metal objects, stones, or dyeing clothes are accepted only at the risk of the customer.

Old or weak silk sarees, sarees, and dhotis may tear or get damaged at the time of dry cleaning, for which the store is not responsible. This may be caused by fungus, which reduces the strength of the fiber or cloth.

At the time of processing, long-time sweat stains may spread throughout the fabric in different colors or shades. The company may not be responsible for the same.

The store is not responsible for customers' old or delicate clothes for any damages incurred at the time of starching, ironing, processing, or drying.

Leather shoes may change color or shade after cleaning. The store is not responsible for the same.

All garments for laundry and dry cleaning are accepted only at customer risk.`
        },
        {
            id: 5,
            title: "Loss, Damage & Collection",
            shortTitle: "Loss & Damage",
            content: `In case of any unfortunate event of loss or damage of any garments, a maximum of 5 times compensation of those particular garments as mentioned in the bill would be reimbursed in terms of laundry or dry clean vouchers. No cash demand will be entertained.

We will not be responsible for maintenance of clothes if the garments are not collected within 30 days from the scheduled delivery date.`
        },
        {
            id: 6,
            title: "Pricing, Refunds & Promotions",
            shortTitle: "Pricing",
            content: `Our prices may change from time to time depending on raw material price hikes or labor wage hikes.

Our prices may vary from store to store and city to city.

The tariff of garments will be decided on a case-to-case basis depending on the complexity of the garments. The rates mentioned in the price list are indicative and minimal.

Once services have been availed, no request for refunds would be entertained.

We may use the images of your clothes for promotional purposes.`
        },
        {
            id: 7,
            title: "Contact Information",
            shortTitle: "Contact",
            content: `For questions regarding these Terms or our services:

CUSTOMER SERVICE:
Phone: +91 93630 59595
Email: support@myfabclean.com

REGISTERED OFFICE:
Fab Clean
#16, Venkatramana Round Road
Opp Naturals/HDFC Bank, Mahalingapuram
Pollachi - 642002
Tamil Nadu, India

WEBSITE: www.myfabclean.com`
        }
    ]
};

export default function TermsPage() {
    useTermsSEO();
    const isMobile = useIsMobile();
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [showToc, setShowToc] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const currentYear = new Date().getFullYear();

    // Track scroll position for back to top button
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: number) => {
        document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth' });
        setShowToc(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header - Mobile Optimized */}
            <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm safe-area-top">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 active:opacity-70 transition-opacity">
                        <img src="/assets/logo.webp" alt="Fab Clean" className="h-8 md:h-10" />
                    </a>

                    {/* Mobile TOC Toggle */}
                    {isMobile && (
                        <button
                            onClick={() => setShowToc(!showToc)}
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-700 touch-target"
                            aria-label="Table of Contents"
                        >
                            {showToc ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </header>

            {/* Mobile TOC Drawer */}
            {isMobile && showToc && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
                        onClick={() => setShowToc(false)}
                    />
                    <div className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl animate-slide-up overflow-y-auto safe-area-top">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Contents</h3>
                            <button
                                onClick={() => setShowToc(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 touch-target"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {termsData.sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="flex items-center gap-3 w-full p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-left touch-target transition-colors active:bg-emerald-100"
                                >
                                    <span className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-sm flex-shrink-0">
                                        {section.id}
                                    </span>
                                    <span className="text-slate-700 text-sm">{section.shortTitle}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Hero Section - Compact on Mobile */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-10 md:py-16">
                <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4">Terms & Conditions</h1>
                    <p className="text-emerald-100 text-sm md:text-lg max-w-2xl mx-auto">
                        Service agreement for Fab Clean's premium laundry services
                    </p>
                    <div className="mt-4 md:mt-6 flex items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-emerald-200 flex-wrap">
                        <span>Effective: {termsData.effectiveDate}</span>
                        <span className="w-1 h-1 rounded-full bg-emerald-300 hidden md:block"></span>
                        <span>Updated: {termsData.lastUpdated}</span>
                    </div>
                </div>
            </div>

            {/* Legal Navigation - Horizontal Scroll on Mobile */}
            <div className="bg-white border-b border-slate-200 py-3 md:py-4 overflow-x-auto hide-scrollbar">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="flex items-center gap-2 md:gap-4 md:justify-center min-w-max">
                        <span className="px-3 md:px-4 py-2 text-xs md:text-sm bg-emerald-100 text-emerald-700 rounded-full font-medium whitespace-nowrap flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Terms
                        </span>
                        <a href="/privacy" className="px-3 md:px-4 py-2 text-xs md:text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors whitespace-nowrap flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            Privacy
                        </a>
                        <a href="/refund" className="px-3 md:px-4 py-2 text-xs md:text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors whitespace-nowrap flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refunds
                        </a>
                        <a href="/cookies" className="px-3 md:px-4 py-2 text-xs md:text-sm text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors whitespace-nowrap flex items-center gap-1.5">
                            <Cookie className="w-3.5 h-3.5" />
                            Cookies
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">

                {/* Table of Contents - Desktop Only */}
                {!isMobile && (
                    <div className="bg-slate-50 rounded-xl p-6 md:p-8 mb-8 md:mb-12">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Table of Contents</h2>
                        <div className="grid md:grid-cols-2 gap-2 md:gap-3">
                            {termsData.sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left group touch-target"
                                >
                                    <span className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                                        {section.id}
                                    </span>
                                    <span className="text-slate-700 group-hover:text-emerald-700 transition-colors text-sm md:text-base">{section.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile: Quick Jump */}
                {isMobile && (
                    <button
                        onClick={() => setShowToc(true)}
                        className="w-full mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between touch-target active:bg-emerald-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Menu className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-emerald-700">Table of Contents</span>
                        </div>
                        <span className="text-sm text-emerald-600">{termsData.sections.length} sections</span>
                    </button>
                )}

                {/* Terms Sections */}
                <div className="space-y-8 md:space-y-12">
                    {termsData.sections.map((section) => (
                        <section
                            key={section.id}
                            id={`section-${section.id}`}
                            className="scroll-mt-24 md:scroll-mt-40"
                        >
                            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                                <span className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-emerald-600 text-white font-bold rounded-xl text-base md:text-lg">
                                    {section.id}
                                </span>
                                <h2 className="text-lg md:text-2xl font-bold text-slate-800 pt-1.5 md:pt-2">
                                    {isMobile ? section.shortTitle : section.title}
                                </h2>
                            </div>
                            <div className="pl-0 md:pl-16">
                                <div className="prose prose-slate max-w-none">
                                    {section.content.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx} className="text-slate-600 leading-relaxed mb-3 md:mb-4 text-sm md:text-base text-justify">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {/* Acceptance Section */}
                <div className="mt-12 md:mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white text-center">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Acknowledgment & Acceptance</h3>
                    <p className="text-emerald-100 max-w-2xl mx-auto mb-4 md:mb-6 text-sm md:text-base">
                        By using Fab Clean services, you confirm that you have read, understood, and agree to these Terms and Conditions.
                    </p>
                    <a
                        href="mailto:support@myfabclean.com"
                        className="inline-flex items-center gap-2 px-5 md:px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors touch-target active:scale-95"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Support
                    </a>
                </div>
            </main>

            {/* Footer - Mobile Optimized */}
            <footer className="bg-slate-900 text-white py-10 md:py-12 mt-12 md:mt-16 safe-area-bottom">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-8">
                        <div className="col-span-2 md:col-span-1">
                            <img src="/assets/logo.webp" alt="Fab Clean" className="h-8 brightness-0 invert opacity-80 mb-3" />
                            <p className="text-slate-400 text-sm">Premium laundry services committed to quality.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3 text-sm md:text-base">Legal</h4>
                            <ul className="space-y-2 text-xs md:text-sm text-slate-400">
                                <li><a href="/terms" className="hover:text-white transition-colors">Terms</a></li>
                                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                                <li><a href="/refund" className="hover:text-white transition-colors">Refunds</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3 text-sm md:text-base">Contact</h4>
                            <ul className="space-y-2 text-xs md:text-sm text-slate-400">
                                <li className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +91 93630 59595</li>
                                <li className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> support@myfabclean.com</li>
                                <li className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> www.myfabclean.com</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-6 text-center text-xs md:text-sm text-slate-500">
                        <p>© {currentYear} Fab Clean. All rights reserved. | GSTIN: 33AITPD3522F1ZK</p>
                    </div>
                </div>
            </footer>

            {/* Back to Top Button - Touch Optimized */}
            {showBackToTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center z-50 touch-target active:scale-95 animate-fade-in"
                    aria-label="Back to top"
                >
                    <ChevronUp className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            )}
        </div>
    );
}
