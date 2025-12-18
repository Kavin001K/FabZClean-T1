/**
 * Terms & Conditions Page
 * 
 * Accessible only via direct link: myfabclean.com/terms
 * NOT included in navigation - completely isolated
 * 
 * Features: Royal scroll animation with terms inside the scroll
 * SEO Optimized with meta tags for social sharing
 */

import { useEffect, useState, useMemo } from "react";

// SEO Setup Hook for Terms page
const useTermsSEO = () => {
    useEffect(() => {
        const siteUrl = "https://myfabclean.com";
        const pageUrl = `${siteUrl}/terms`;
        const ogImage = `${siteUrl}/assets/fabclean-og-card.png`;
        const currentYear = new Date().getFullYear();

        // Set document title
        document.title = "Terms & Conditions | Fab Clean - Premium Laundry Services";

        // Helper to set meta tag
        const setMeta = (name: string, content: string, isProperty = false) => {
            const attr = isProperty ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        // Helper to set link tag
        const setLink = (rel: string, href: string) => {
            let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = rel;
                document.head.appendChild(link);
            }
            link.href = href;
        };

        // Primary Meta Tags
        setMeta('title', 'Terms & Conditions | Fab Clean - Premium Laundry Services');
        setMeta('description', "Read the Terms & Conditions for Fab Clean's professional laundry and dry cleaning services. Learn about our service standards, pricing, collection policies, and customer protections.");
        setMeta('keywords', 'fab clean terms, laundry terms and conditions, dry cleaning policy, fab clean service agreement, pollachi laundry, kinathukadavu cleaning, garment care terms');
        setMeta('author', 'Fab Clean');
        setMeta('robots', 'index, follow');

        // Canonical URL
        setLink('canonical', pageUrl);

        // Open Graph / Facebook
        setMeta('og:type', 'website', true);
        setMeta('og:url', pageUrl, true);
        setMeta('og:title', 'Terms & Conditions | Fab Clean', true);
        setMeta('og:description', 'Professional laundry & dry cleaning service agreement. Quality care for your garments with transparent policies and customer-friendly terms.', true);
        setMeta('og:image', ogImage, true);
        setMeta('og:image:width', '1200', true);
        setMeta('og:image:height', '630', true);
        setMeta('og:image:alt', 'Fab Clean - Premium Laundry & Dry Cleaning Services', true);
        setMeta('og:site_name', 'Fab Clean', true);
        setMeta('og:locale', 'en_IN', true);

        // Twitter Cards
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:url', pageUrl);
        setMeta('twitter:title', 'Terms & Conditions | Fab Clean');
        setMeta('twitter:description', 'Professional laundry & dry cleaning service agreement. Quality care for your garments with transparent policies.');
        setMeta('twitter:image', ogImage);

        // Theme Color
        setMeta('theme-color', '#059669');
        setMeta('msapplication-TileColor', '#059669');

        // Structured Data (JSON-LD)
        let script = document.querySelector('script[data-seo="terms"]') as HTMLScriptElement;
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo', 'terms');
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms & Conditions",
            "description": "Terms and Conditions for Fab Clean laundry and dry cleaning services",
            "url": pageUrl,
            "inLanguage": "en-IN",
            "isPartOf": {
                "@type": "WebSite",
                "name": "Fab Clean",
                "url": siteUrl
            },
            "publisher": {
                "@type": "Organization",
                "name": "Fab Clean",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${siteUrl}/assets/fabclean-logo.png`
                }
            },
            "datePublished": "2024-01-01",
            "dateModified": `${currentYear}-12-18`
        });

        // Cleanup on unmount (restore original title)
        return () => {
            document.title = "Fab Clean - Premium Laundry & Dry Cleaning";
        };
    }, []);
};

// Floating particle component
const FloatingParticle = ({ delay, x }: { delay: number; x: number }) => (
    <div
        className="absolute w-1 h-1 rounded-full bg-amber-400/60"
        style={{
            left: `${x}%`,
            animation: `floatUp 4s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            boxShadow: '0 0 8px 2px rgba(251, 191, 36, 0.4)',
        }}
    />
);

export default function TermsPage() {
    const currentYear = new Date().getFullYear();
    const [animationPhase, setAnimationPhase] = useState(0);
    const [showContent, setShowContent] = useState(false);

    // Apply SEO meta tags
    useTermsSEO();

    // Generate floating particles
    const particles = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 4,
        })), []
    );

    // Animation sequence
    useEffect(() => {
        // Load fonts
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const timers = [
            setTimeout(() => setAnimationPhase(1), 300),   // Glow appears
            setTimeout(() => setAnimationPhase(2), 800),   // Top rod
            setTimeout(() => setAnimationPhase(3), 1400),  // Scroll unrolls
            setTimeout(() => setAnimationPhase(4), 2200),  // Seal appears
            setTimeout(() => setAnimationPhase(5), 3000),  // Content fades in
            setTimeout(() => setShowContent(true), 3500),  // Show main content
        ];

        return () => {
            document.head.removeChild(link);
            timers.forEach(t => clearTimeout(t));
        };
    }, []);

    return (
        <>
            {/* CSS Animations */}
            <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes sealBounce {
          0% { transform: scale(0) rotate(-180deg); }
          60% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes scrollUnroll {
          0% { height: 0; }
          100% { height: 80vh; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        html, body { overflow-x: hidden; }
        html::-webkit-scrollbar { display: none; }
        html { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 overflow-hidden hide-scrollbar">

                {/* Floating particles background */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    {particles.map(p => (
                        <FloatingParticle key={p.id} x={p.x} delay={p.delay} />
                    ))}
                </div>

                {/* Ambient glow */}
                <div
                    className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full transition-all duration-1500 ${animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}
                    style={{
                        background: 'radial-gradient(circle, rgba(180,83,9,0.3) 0%, rgba(120,53,15,0.1) 40%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />

                {/* Royal Scroll Container */}
                <div className="relative min-h-screen flex items-center justify-center py-16 px-4">
                    <div className="relative flex flex-col items-center max-w-4xl w-full">

                        {/* Top Scroll Rod */}
                        <div
                            className={`relative z-20 w-full max-w-5xl transition-all duration-1000 ease-out ${animationPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'
                                }`}
                            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                            <div className="relative h-12 rounded-full shadow-2xl bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 ring-2 ring-yellow-900/50"
                                style={{
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.3)'
                                }}
                            >
                                {/* Rod decorations */}
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-800 shadow-lg border border-yellow-900" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-800 shadow-lg border border-yellow-900" />
                                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-24 h-5 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-inner border border-yellow-700" />
                            </div>
                        </div>

                        {/* Scroll Parchment */}
                        <div
                            className={`relative z-10 w-full max-w-5xl overflow-hidden transition-all duration-[2000ms] ease-in-out ${animationPhase >= 3 ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{
                                height: animationPhase >= 3 ? '85vh' : '0',
                                minHeight: animationPhase >= 3 ? '700px' : '0',
                                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        >
                            {/* Parchment texture */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: `
                    linear-gradient(180deg, 
                      #fef3c7 0%, 
                      #fde68a 8%, 
                      #fef3c7 15%, 
                      #fde68a 30%, 
                      #fef3c7 50%, 
                      #fde68a 70%, 
                      #fef3c7 85%, 
                      #fde68a 92%, 
                      #fef3c7 100%
                    )
                  `,
                                    boxShadow: 'inset 0 0 100px rgba(180,83,9,0.15), 0 20px 60px rgba(0,0,0,0.4)',
                                }}
                            />

                            {/* Edge shadows */}
                            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/15 to-transparent" />
                            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black/15 to-transparent" />

                            {/* Scroll content */}
                            <div
                                className={`relative h-full overflow-y-auto hide-scrollbar p-8 md:p-12 transition-all duration-700 ${animationPhase >= 5 ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                {/* Header */}
                                <div className="text-center mb-10">
                                    <img
                                        src="/assets/fabclean-logo.png"
                                        alt="Fab Clean"
                                        className={`h-16 mx-auto mb-6 transition-all duration-700 ${animationPhase >= 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                                    />
                                    <h1
                                        className="text-3xl md:text-4xl font-bold text-stone-800 mb-3"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        Terms & Conditions
                                    </h1>
                                    <p className="text-sm text-stone-600 tracking-widest uppercase" style={{ fontFamily: "'Crimson Pro', serif" }}>
                                        Service Agreement • Effective {currentYear}
                                    </p>
                                    <div className="flex items-center justify-center gap-3 mt-4">
                                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent" />
                                        <div className="w-2 h-2 rotate-45 bg-amber-700" />
                                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent" />
                                    </div>
                                </div>

                                {/* Terms Content */}
                                <div className="space-y-8 text-stone-700" style={{ fontFamily: "'Crimson Pro', serif", fontSize: '16px', lineHeight: '1.8' }}>

                                    {/* Welcome Section */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§1</span> Welcome to Fab Clean
                                        </h2>
                                        <p className="text-justify">
                                            Thank you for choosing Fab Clean for your garment care needs. By entrusting your items to us, you agree to these terms which ensure a smooth and professional service experience for both parties. We are committed to delivering quality service while maintaining transparency in our operations.
                                        </p>
                                    </section>

                                    {/* Service Standards */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§2</span> Service Standards
                                        </h2>
                                        <p className="text-justify mb-3">
                                            At Fab Clean, we employ industry-standard cleaning methods and professional-grade equipment to care for your garments. Our skilled team handles each item with attention to detail. Standard processing typically takes 3-5 business days, with express services available upon request.
                                        </p>
                                        <p className="text-justify">
                                            While we strive for excellence, the nature of cleaning processes means results may vary based on fabric type, stain age, and garment condition. We process items according to care label instructions and professional best practices.
                                        </p>
                                    </section>

                                    {/* Customer Responsibilities */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§3</span> Customer Responsibilities
                                        </h2>
                                        <ul className="space-y-2 ml-4">
                                            <li className="flex items-start gap-2">
                                                <span className="text-amber-700 mt-1">•</span>
                                                <span>Please remove all personal items from pockets before submission. We cannot be responsible for items left in garments.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-amber-700 mt-1">•</span>
                                                <span>Kindly inform us of any existing damage, special fabrics, or specific care requirements at the time of drop-off.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-amber-700 mt-1">•</span>
                                                <span>Verify item counts on your receipt during drop-off. This helps us maintain accurate records for your order.</span>
                                            </li>
                                        </ul>
                                    </section>

                                    {/* Pricing & Payment */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§4</span> Pricing & Payment
                                        </h2>
                                        <p className="text-justify mb-3">
                                            Our pricing is based on garment type and service selected. Prices are clearly displayed at our outlets and on invoices. Additional charges may apply for heavily soiled items, specialty fabrics, or express processing. All applicable taxes are included as per government regulations.
                                        </p>
                                        <p className="text-justify">
                                            Payment is due upon collection of cleaned items. We accept cash, cards, and digital payments for your convenience. Uncollected items are subject to storage fees after the complimentary holding period.
                                        </p>
                                    </section>

                                    {/* Quality Concerns */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§5</span> Quality Concerns
                                        </h2>
                                        <div className="bg-amber-50/50 border-l-4 border-amber-600 p-4 rounded-r-lg">
                                            <p className="font-medium text-stone-800 mb-2">Important Notice</p>
                                            <p className="text-justify">
                                                If you have any concerns about your cleaned items, please bring them to our attention within 24 hours of collection. This allows us to promptly address any issues. We will re-process items at no additional cost if our service standards were not met. Claims made after this period may be subject to review.
                                            </p>
                                        </div>
                                    </section>

                                    {/* Liability */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§6</span> Liability & Care
                                        </h2>
                                        <p className="text-justify mb-3">
                                            We take utmost care with every garment. However, cleaning processes may affect certain fabrics, colors, or embellishments differently. We follow care label instructions and industry standards, but cannot guarantee outcomes for items with pre-existing damage, incorrect care labels, or delicate materials.
                                        </p>
                                        <p className="text-justify">
                                            In the rare event of damage attributable to our service, compensation is calculated based on the item's current value, considering age and condition, up to a maximum of ten times the cleaning charge for that item. We recommend customers retain receipts for high-value items.
                                        </p>
                                    </section>

                                    {/* Unclaimed Items */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§7</span> Collection of Items
                                        </h2>
                                        <div className="bg-emerald-50/50 border-l-4 border-emerald-600 p-4 rounded-r-lg">
                                            <p className="text-justify">
                                                Items should be collected within <strong>30 days</strong> of the scheduled delivery date. A courtesy reminder will be sent after 15 days. Items remaining uncollected beyond 90 days may be donated to charitable organizations or disposed of, with no further liability to Fab Clean. Please collect your garments promptly.
                                            </p>
                                        </div>
                                    </section>

                                    {/* Privacy */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§8</span> Privacy & Data
                                        </h2>
                                        <p className="text-justify">
                                            Your personal information is used solely to provide our services, communicate about your orders, and improve your experience. We maintain strict confidentiality and do not share your data with third parties for marketing purposes. By using our services, you consent to receiving service-related communications.
                                        </p>
                                    </section>

                                    {/* Delivery */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§9</span> Delivery Services
                                        </h2>
                                        <p className="text-justify">
                                            Home pickup and delivery services are available in select areas. Delivery times are estimates and may vary due to traffic or weather conditions. Items are considered delivered when handed to any person at the provided address. Delivery charges, if applicable, are communicated at the time of booking.
                                        </p>
                                    </section>

                                    {/* General */}
                                    <section>
                                        <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                                            <span className="text-amber-700">§10</span> General Provisions
                                        </h2>
                                        <p className="text-justify mb-3">
                                            These terms may be updated periodically. Continued use of our services constitutes acceptance of any modifications. These terms are governed by the laws of Tamil Nadu, India. Any disputes shall be subject to the exclusive jurisdiction of courts in Pollachi.
                                        </p>
                                        <p className="text-justify">
                                            If any provision of these terms is found to be unenforceable, the remaining provisions shall continue in full effect. Our failure to enforce any right or provision does not constitute a waiver of such right.
                                        </p>
                                    </section>

                                    {/* Contact */}
                                    <section className="mt-10 pt-6 border-t border-amber-200">
                                        <div className="text-center">
                                            <h2 className="text-xl font-semibold text-stone-800 mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                                                Questions?
                                            </h2>
                                            <p className="text-stone-600 mb-2">We're here to help!</p>
                                            <p className="text-stone-700">
                                                📞 +91 93630 59595 | ✉️ support@myfabclean.com
                                            </p>
                                        </div>
                                    </section>

                                    {/* Footer */}
                                    <div className="mt-10 pt-6 border-t border-amber-200 text-center text-sm text-stone-500">
                                        <p>© {currentYear} Fab Clean. All Rights Reserved.</p>
                                        <p className="mt-1 text-xs">Document Version 2.0 • Last Updated: December {currentYear}</p>
                                    </div>
                                </div>

                                {/* Wax Seal */}
                                <div
                                    className={`absolute bottom-6 right-6 transition-all ${animationPhase >= 4 ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    style={{
                                        animation: animationPhase >= 4 ? 'sealBounce 0.6s ease-out forwards' : 'none',
                                    }}
                                >
                                    <div className="w-20 h-20 rounded-full shadow-2xl flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)' }}
                                    >
                                        <div className="w-16 h-16 rounded-full border-2 border-red-300/30 flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
                                        >
                                            <span className="text-red-100 font-bold text-lg" style={{ fontFamily: "'Cinzel', serif" }}>FC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Scroll Rod */}
                        <div
                            className={`relative z-20 w-full max-w-5xl transition-all duration-1000 ease-out ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                }`}
                            style={{
                                transitionDelay: animationPhase >= 3 ? '400ms' : '0',
                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            <div className="relative h-14 rounded-full shadow-2xl bg-gradient-to-r from-amber-800 via-yellow-700 to-amber-800 ring-2 ring-yellow-900/50"
                                style={{
                                    boxShadow: '0 -10px 40px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(255,255,255,0.2)'
                                }}
                            >
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-900 shadow-xl border border-yellow-800" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-900 shadow-xl border border-yellow-800" />
                                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-32 h-6 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-700 shadow-inner border border-yellow-800" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back to Top Button */}
                {showContent && (
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
                    >
                        ↑
                    </button>
                )}
            </div>
        </>
    );
}
