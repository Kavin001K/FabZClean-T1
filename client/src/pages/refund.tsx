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
const useRefundSEO = () => {
    useEffect(() => {
        document.title = "Refund Policy | Fab Clean - Premium Laundry Services";

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
        themeColor.content = '#f59e0b';

        const metaTags = [
            { name: "description", content: "Fab Clean's Refund Policy explains our cancellation, refund, and compensation procedures for laundry services." },
            { name: "keywords", content: "fab clean refund, laundry refund policy, dry cleaning refund, garment compensation" },
            { property: "og:title", content: "Refund Policy | Fab Clean" },
            { property: "og:description", content: "Learn about Fab Clean's refund, cancellation, and compensation policies." },
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
        style.id = 'refund-mobile-styles';
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
            const existingStyle = document.getElementById('refund-mobile-styles');
            if (existingStyle) existingStyle.remove();
        };
    }, []);
};

const refundData = {
    effectiveDate: "January 1, 2025",
    lastUpdated: "December 19, 2024",
    sections: [
        {
            id: 1,
            title: "Overview",
            shortTitle: "Overview",
            content: `At Fab Clean, we are committed to providing exceptional laundry and dry cleaning services. We understand that sometimes situations arise where you may need a refund or compensation.

Our refund policy is designed to balance customer satisfaction with the realities of providing laundry and dry cleaning services. We process thousands of garments daily with the highest care standards.

This policy applies to all services offered by Fab Clean, including regular laundry, dry cleaning, express services, specialty garment care, and home delivery services.`
        },
        {
            id: 2,
            title: "Order Cancellation",
            shortTitle: "Cancellation",
            content: `BEFORE PICKUP: Orders can be cancelled free of charge any time before our pickup agent arrives at your location.

AFTER PICKUP, BEFORE PROCESSING: If you need to cancel after pickup but before processing begins, a nominal handling fee of ₹50 will apply.

AFTER PROCESSING BEGINS: Once cleaning or processing has started, cancellation is not possible. The full order amount will be charged.

EXPRESS ORDERS: Express and same-day service orders cannot be cancelled once confirmed due to the priority scheduling involved.`
        },
        {
            id: 3,
            title: "Refund Eligibility",
            shortTitle: "Eligibility",
            content: `You may be eligible for a refund in the following situations:

SERVICE NOT PERFORMED: If we fail to pick up your order as scheduled, you are entitled to a full refund.

QUALITY ISSUES: If the cleaning quality does not meet our standards, you may be eligible for a partial or full refund.

GARMENT DAMAGE: If your garment is damaged during our care, compensation will be provided as per our liability policy.

BILLING ERRORS: Any overcharges or billing mistakes will be refunded immediately upon verification.`
        },
        {
            id: 4,
            title: "Non-Refundable Cases",
            shortTitle: "Non-Refundable",
            content: `Refunds will NOT be provided in the following circumstances:

NORMAL WEAR & TEAR: Natural aging, fading, or wear of garments that becomes more visible after cleaning.

PRE-EXISTING DAMAGE: Damage, stains, or defects that existed before the garment was given to us.

UNDECLARED ISSUES: Problems with garments that were not disclosed at the time of order.

COLOR BLEEDING: Color bleeding from unstable dyes, especially in new or cheaply made garments.`
        },
        {
            id: 5,
            title: "Refund Process",
            shortTitle: "Process",
            content: `STEP 1 - REPORT THE ISSUE: Report any issues within 48 hours of receiving your order via app, website, email, or phone.

STEP 2 - DOCUMENTATION: Provide photographs of the issue and retain the garment in its delivered condition.

STEP 3 - ASSESSMENT: Our quality team will assess the issue within 2-3 business days.

STEP 4 - RESOLUTION: Once verified, we will offer an appropriate resolution.

STEP 5 - REFUND PROCESSING: Approved refunds are processed within 5-7 business days.`
        },
        {
            id: 6,
            title: "Compensation for Damage",
            shortTitle: "Compensation",
            content: `If a garment is damaged during our care, we provide fair compensation:

COMPENSATION CALCULATION:
- Garments less than 1 year old: Up to 80% of original purchase price
- Garments 1-3 years old: Up to 50% of original purchase price
- Garments over 3 years old: Up to 25% of original purchase price

MAXIMUM LIABILITY: Our maximum liability per garment is capped at ₹5,000 for regular items and ₹15,000 for premium/designer items.

REPAIR OPTION: Where possible, we may offer professional repair or restoration.`
        },
        {
            id: 7,
            title: "Contact for Refunds",
            shortTitle: "Contact",
            content: `For all refund-related inquiries:

CUSTOMER SUPPORT:
Phone: +91 93630 59595
Email: support@myfabclean.com
Hours: Monday-Saturday, 8:00 AM - 8:00 PM IST

ESCALATIONS:
Email: escalations@myfabclean.com

ADDRESS:
Fab Clean - Refunds Department
#16, Venkatramana Round Road
Pollachi - 642002, Tamil Nadu, India

Please include your order number for fastest resolution.`
        }
    ]
};

export default function RefundPage() {
    useRefundSEO();
    const isMobile = useIsMobile();
    const currentYear = new Date().getFullYear();
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showMobileToc, setShowMobileToc] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm safe-area-top">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-center">
                    <a href="/" className="flex items-center gap-3 touch-target">
                        <img src="/assets/logo.webp" alt="Fab Clean" className="h-8 md:h-10" />
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-10 md:py-16">
                <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">Refund Policy</h1>
                    <p className="text-amber-100 text-base md:text-lg max-w-2xl mx-auto">
                        Our commitment to fair and transparent refund, cancellation, and compensation procedures.
                    </p>
                    <div className="mt-4 md:mt-6 flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-amber-200">
                        <span>Effective: {refundData.effectiveDate}</span>
                        <span className="w-1 h-1 rounded-full bg-amber-300"></span>
                        <span>Updated: {refundData.lastUpdated}</span>
                    </div>
                </div>
            </div>

            {/* Legal Navigation - Mobile Optimized */}
            <div className="bg-white border-b border-slate-200 py-3 md:py-4">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-start md:justify-center gap-2 md:gap-4 overflow-x-auto hide-scrollbar">
                        <a href="/terms" className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors whitespace-nowrap touch-target">
                            <FileText className="w-3 h-3 md:w-4 md:h-4" />
                            Terms
                        </a>
                        <a href="/privacy" className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors whitespace-nowrap touch-target">
                            <Shield className="w-3 h-3 md:w-4 md:h-4" />
                            Privacy
                        </a>
                        <span className="px-3 py-2 text-xs md:text-sm bg-amber-100 text-amber-700 rounded-full font-medium whitespace-nowrap flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
                            Refund
                        </span>
                        <a href="/cookies" className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors whitespace-nowrap touch-target">
                            <Cookie className="w-3 h-3 md:w-4 md:h-4" />
                            Cookies
                        </a>
                    </div>
                </div>
            </div>

            {/* Mobile TOC Button */}
            {isMobile && (
                <button
                    onClick={() => setShowMobileToc(true)}
                    className="fixed bottom-20 right-4 z-40 bg-amber-500 text-white p-3 rounded-full shadow-lg touch-target active:scale-95 transition-transform"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Mobile TOC Drawer */}
            {isMobile && showMobileToc && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
                        onClick={() => setShowMobileToc(false)}
                    />
                    <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl animate-slide-up overflow-y-auto">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-semibold text-slate-800">Quick Jump</h3>
                            <button onClick={() => setShowMobileToc(false)} className="p-2 touch-target">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {refundData.sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        setShowMobileToc(false);
                                        document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg touch-target active:scale-95 transition-transform text-left"
                                >
                                    <span className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white font-semibold rounded-lg text-sm">
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

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
                {/* Table of Contents - Desktop */}
                {!isMobile && (
                    <div className="bg-slate-50 rounded-xl p-6 md:p-8 mb-8 md:mb-12">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">Table of Contents</h2>
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
                )}

                {/* Sections */}
                <div className="space-y-8 md:space-y-12">
                    {refundData.sections.map((section) => (
                        <section key={section.id} id={`section-${section.id}`} className="scroll-mt-32">
                            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                                <span className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-amber-500 text-white font-bold rounded-xl text-base md:text-lg">
                                    {section.id}
                                </span>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-800 pt-1 md:pt-2">
                                    {isMobile ? section.shortTitle : section.title}
                                </h2>
                            </div>
                            <div className="pl-0 md:pl-16">
                                <div className="prose prose-slate max-w-none">
                                    {section.content.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx} className="text-sm md:text-base text-slate-600 leading-relaxed mb-3 md:mb-4">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-4 right-4 z-40 bg-amber-500 text-white p-3 rounded-full shadow-lg touch-target active:scale-95 transition-transform animate-fade-in"
                >
                    <ChevronUp className="w-5 h-5" />
                </button>
            )}

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-8 md:py-12 mt-12 md:mt-16 safe-area-bottom">
                <div className="max-w-5xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
                        <div>
                            <h4 className="font-semibold mb-3 md:mb-4">Fab Clean</h4>
                            <p className="text-slate-400 text-sm">Premium laundry and dry cleaning services committed to quality and customer satisfaction.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3 md:mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="/refund" className="hover:text-white transition-colors">Refund Policy</a></li>
                                <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3 md:mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@myfabclean.com</li>
                                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 93630 59595</li>
                                <li className="flex items-center gap-2"><Globe className="w-4 h-4" /> www.myfabclean.com</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-6 md:pt-8 text-center text-slate-500 text-xs md:text-sm">
                        <p>© {currentYear} Fab Clean. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
