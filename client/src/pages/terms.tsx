/**
 * Terms & Conditions Page
 * 
 * Accessible only via direct link: myfabclean.com/terms
 * NOT included in navigation - completely isolated
 * 
 * Professional legal document with premium typography
 * Features: Enhanced scroll unrolling animation with particles and effects
 */

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useMemo } from "react";

// Particle component for sparkle effects
const Particle = ({ delay, duration, x, y, size }: { delay: number; duration: number; x: number; y: number; size: number }) => (
    <div
        className="absolute rounded-full bg-amber-300/80 animate-pulse"
        style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
            boxShadow: '0 0 6px 2px rgba(251, 191, 36, 0.6)',
        }}
    />
);

export default function TermsPage() {
    const currentYear = new Date().getFullYear();
    const [isLoading, setIsLoading] = useState(true);
    const [scrollPhase, setScrollPhase] = useState(0);
    const [showParticles, setShowParticles] = useState(false);
    const [textReveal, setTextReveal] = useState(0);

    // Generate random particles
    const particles = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            delay: Math.random() * 1000,
            duration: Math.random() * 1000 + 500,
        })), []
    );

    // Load professional fonts and trigger animation
    useEffect(() => {
        // Add Google Fonts link
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Enhanced animation sequence with more phases
        const timers = [
            setTimeout(() => setScrollPhase(1), 200),   // Glow appears
            setTimeout(() => setScrollPhase(2), 600),   // Top rod appears  
            setTimeout(() => setScrollPhase(3), 1000),  // Parchment starts unrolling
            setTimeout(() => setShowParticles(true), 1200), // Particles start
            setTimeout(() => setScrollPhase(4), 1600),  // Bottom rod appears
            setTimeout(() => setTextReveal(1), 1800),   // Logo appears
            setTimeout(() => setTextReveal(2), 2100),   // Title appears
            setTimeout(() => setTextReveal(3), 2400),   // Subtitle appears
            setTimeout(() => setScrollPhase(5), 2800),  // Seal stamps
            setTimeout(() => setScrollPhase(6), 3400),  // Flash effect
            setTimeout(() => setIsLoading(false), 3800), // Complete
        ];

        return () => {
            document.head.removeChild(link);
            timers.forEach(t => clearTimeout(t));
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-950 to-black overflow-hidden">

            {/* Scroll Opening Animation Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-stone-900 via-stone-950 to-black overflow-hidden">

                    {/* Ambient background glow */}
                    <div
                        className={`absolute w-[600px] h-[600px] rounded-full transition-all duration-1000 ease-out ${scrollPhase >= 1 ? 'opacity-30 scale-100' : 'opacity-0 scale-50'
                            }`}
                        style={{
                            background: 'radial-gradient(circle, rgba(217,119,6,0.3) 0%, rgba(120,53,15,0.1) 50%, transparent 70%)',
                            filter: 'blur(40px)',
                        }}
                    />

                    {/* Floating particles */}
                    {showParticles && (
                        <div className="absolute inset-0 pointer-events-none">
                            {particles.map(p => (
                                <Particle key={p.id} {...p} />
                            ))}
                        </div>
                    )}

                    {/* Main scroll container */}
                    <div className="relative flex flex-col items-center">

                        {/* Top scroll rod with glow */}
                        <div
                            className={`relative w-80 h-7 transition-all ease-out ${scrollPhase >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 -translate-y-8'
                                }`}
                            style={{
                                transitionDuration: '800ms',
                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        >
                            {/* Glow effect */}
                            <div
                                className="absolute inset-0 rounded-full blur-md"
                                style={{
                                    background: 'linear-gradient(to bottom, #d97706, #92400e)',
                                    opacity: 0.5,
                                }}
                            />
                            {/* Rod */}
                            <div
                                className="relative w-full h-full rounded-full"
                                style={{
                                    background: 'linear-gradient(to bottom, #f59e0b, #b45309, #78350f)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)',
                                }}
                            >
                                {/* Rod decorations */}
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }} />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }} />
                                {/* Center ornament */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #fcd34d, #b45309)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)' }} />
                            </div>
                        </div>

                        {/* Unrolling parchment with effects */}
                        <div
                            className={`relative overflow-hidden transition-all ease-out ${scrollPhase >= 3 ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{
                                width: '300px',
                                height: scrollPhase >= 4 ? '420px' : scrollPhase >= 3 ? '80px' : '0px',
                                transitionDuration: '1200ms',
                                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                                background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 20%, #fef3c7 50%, #fde68a 80%, #fef3c7 100%)',
                                boxShadow: `
                  0 20px 60px rgba(0,0,0,0.5),
                  inset 0 0 60px rgba(180,83,9,0.1),
                  inset 2px 0 8px rgba(0,0,0,0.1),
                  inset -2px 0 8px rgba(0,0,0,0.1)
                `,
                                borderLeft: '3px solid rgba(180,83,9,0.2)',
                                borderRight: '3px solid rgba(180,83,9,0.2)',
                            }}
                        >
                            {/* Parchment edge shadows */}
                            <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-black/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-black/10 to-transparent" />

                            {/* Unroll line effect */}
                            <div
                                className={`absolute left-0 right-0 h-1 bg-gradient-to-b from-amber-900/30 to-transparent transition-all duration-500 ${scrollPhase >= 4 ? 'opacity-0 bottom-0' : 'opacity-100 bottom-0'
                                    }`}
                            />

                            {/* Parchment texture overlay */}
                            <div
                                className="absolute inset-0 opacity-20 mix-blend-overlay"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                                }}
                            />

                            {/* Content on parchment */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-10">

                                {/* Decorative top border */}
                                <div
                                    className={`w-48 h-0.5 mb-6 transition-all duration-700 ${textReveal >= 1 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                                        }`}
                                    style={{
                                        background: 'linear-gradient(90deg, transparent, #92400e, #b45309, #92400e, transparent)',
                                        transitionDelay: '100ms',
                                    }}
                                />

                                {/* Logo with glow */}
                                <div
                                    className={`relative transition-all duration-700 ${textReveal >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'
                                        }`}
                                    style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                                >
                                    <div className="absolute inset-0 blur-xl bg-amber-500/30 scale-150" />
                                    <img
                                        src="/assets/fabclean-logo.png"
                                        alt="Fab Clean"
                                        className="relative h-16 object-contain drop-shadow-lg"
                                    />
                                </div>

                                {/* Decorative divider */}
                                <div
                                    className={`flex items-center gap-2 my-5 transition-all duration-500 ${textReveal >= 2 ? 'opacity-100' : 'opacity-0'
                                        }`}
                                >
                                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-700" />
                                    <div className="w-2 h-2 rotate-45 bg-amber-700" />
                                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-700" />
                                </div>

                                {/* Title with letter animation */}
                                <h1
                                    className={`text-2xl font-bold text-stone-800 text-center mb-2 transition-all duration-700 ${textReveal >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                        }`}
                                    style={{
                                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    Terms & Conditions
                                </h1>

                                <p
                                    className={`text-xs text-stone-600 tracking-[0.3em] uppercase mb-6 transition-all duration-700 ${textReveal >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                        }`}
                                    style={{
                                        fontFamily: "'Source Sans 3', sans-serif",
                                        transitionDelay: '150ms',
                                    }}
                                >
                                    Official Document
                                </p>

                                {/* Elegant loading indicator */}
                                <div
                                    className={`flex flex-col items-center gap-3 transition-all duration-500 ${textReveal >= 3 ? 'opacity-100' : 'opacity-0'
                                        }`}
                                >
                                    <div className="flex gap-2">
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 bg-emerald-600 rounded-full"
                                                style={{
                                                    animation: 'bounce 1s infinite',
                                                    animationDelay: `${i * 150}ms`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p
                                        className="text-xs text-stone-500 animate-pulse"
                                        style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                                    >
                                        Preparing document...
                                    </p>
                                </div>

                                {/* Decorative wax seal with stamp animation */}
                                <div
                                    className={`absolute bottom-8 right-8 transition-all ${scrollPhase >= 5 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-150 rotate-45'
                                        }`}
                                    style={{
                                        transitionDuration: '500ms',
                                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                >
                                    <div
                                        className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-full border-2 border-red-300/40 flex items-center justify-center"
                                            style={{
                                                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                            }}
                                        >
                                            <span
                                                className="text-red-100 font-bold text-sm"
                                                style={{ fontFamily: "'Cormorant Garamond', serif", textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                            >
                                                FC
                                            </span>
                                        </div>
                                    </div>
                                    {/* Seal shine */}
                                    <div
                                        className={`absolute top-1 left-3 w-4 h-2 rounded-full bg-white/30 blur-sm transition-opacity duration-300 ${scrollPhase >= 5 ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        style={{ transitionDelay: '200ms' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom scroll rod with glow */}
                        <div
                            className={`relative w-80 h-7 transition-all ease-out ${scrollPhase >= 4 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'
                                }`}
                            style={{
                                transitionDuration: '800ms',
                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        >
                            {/* Glow effect */}
                            <div
                                className="absolute inset-0 rounded-full blur-md"
                                style={{
                                    background: 'linear-gradient(to top, #d97706, #92400e)',
                                    opacity: 0.5,
                                }}
                            />
                            {/* Rod */}
                            <div
                                className="relative w-full h-full rounded-full"
                                style={{
                                    background: 'linear-gradient(to top, #f59e0b, #b45309, #78350f)',
                                    boxShadow: '0 -4px 20px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(255,255,255,0.3), inset 0 2px 4px rgba(0,0,0,0.3)',
                                }}
                            >
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }} />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }} />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 rounded-full" style={{ background: 'linear-gradient(to top, #fcd34d, #b45309)', boxShadow: 'inset 0 -1px 2px rgba(255,255,255,0.5)' }} />
                            </div>
                        </div>
                    </div>

                    {/* Flash transition effect */}
                    <div
                        className={`absolute inset-0 bg-white transition-opacity duration-300 pointer-events-none ${scrollPhase >= 6 ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            transitionDelay: scrollPhase >= 6 ? '0ms' : '0ms',
                        }}
                    />
                </div>
            )}

            {/* Main Content - Fades in after animation */}
            <div
                className={`transition-all duration-1000 ease-out ${isLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
                    }`}
            >
                {/* Professional Header */}
                <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40 shadow-lg">
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
                    <Card className="border border-stone-200 shadow-2xl bg-gradient-to-b from-white via-orange-50/20 to-stone-50 backdrop-blur-sm">
                        <CardContent className="p-10 md:p-14">

                            {/* Document Title */}
                            <div className="text-center mb-14 pb-8 border-b-2 border-stone-300">
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
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>1</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Service Agreement and Acceptance
                                    </h2>
                                </div>

                                <div className="space-y-8 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">1.1 Scope of Services</h3>
                                        <p className="mb-5 text-base leading-7">
                                            Fab Clean delivers comprehensive textile care services including:
                                        </p>
                                        <ul className="list-none space-y-4 ml-4">
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">a)</span>
                                                <div><strong className="text-stone-900">High-Volume Standard Services (Wash and Fold)</strong> - Economical laundering for everyday apparel and linens.</div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">b)</span>
                                                <div><strong className="text-stone-900">Premium Garment Dry Cleaning</strong> - Specialized care for suits, silks, wools, and cashmere.</div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">c)</span>
                                                <div><strong className="text-stone-900">Professional Pressing and Finishing</strong> - Meticulous hand-ironing and steaming.</div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">d)</span>
                                                <div><strong className="text-stone-900">Specialized Fabric Treatments</strong> - Expert care for leather, suede, and delicates.</div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">e)</span>
                                                <div><strong className="text-stone-900">Stain Removal</strong> - Advanced techniques (100% removal not guaranteed).</div>
                                            </li>
                                            <li className="flex gap-4">
                                                <span className="text-emerald-600 font-bold text-lg flex-shrink-0">f)</span>
                                                <div><strong className="text-stone-900">Minor Repairs</strong> - Button replacement, re-stitching (varies by location).</div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">1.2 Contractual Obligation</h3>
                                        <p className="text-base leading-7">Placing an order signifies entry into a legally binding agreement. The agreement commences when items are accepted, inspected, and tagged.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">1.3 Right to Refuse Service</h3>
                                        <p className="text-base leading-7">We reserve the right to refuse service for items posing safety risks, bio-hazards, or missing care labels.</p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Section 2 */}
                            <section id="section-2" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>2</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Order Placement, Processing & Delivery
                                    </h2>
                                </div>

                                <div className="space-y-8 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">2.1 Order Submission</h3>
                                        <p className="text-base leading-7">Orders confirmed upon issuance of itemized service receipt. <strong>Customer responsibility to verify.</strong></p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">2.2 Turnaround Time</h3>
                                        <p className="text-base leading-7">All times are estimates. Notifications for delays exceeding 24 hours.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">2.3 Express Services</h3>
                                        <p className="text-base leading-7">Available at <strong>non-refundable premium surcharge</strong>.</p>
                                    </div>
                                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
                                        <h3 className="font-bold text-amber-900 text-lg mb-3">2.4 Unclaimed Items — IMPORTANT</h3>
                                        <p className="text-amber-900 text-base leading-7">Collect within <strong>30 days</strong>. After <strong>60 days</strong>, items deemed abandoned.</p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Section 3 */}
                            <section id="section-3" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>3</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Pricing, Payments & Financial Terms
                                    </h2>
                                </div>

                                <div className="space-y-8 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">3.1 Pricing</h3><p className="text-base leading-7">Based on service type, garment category, and material composition.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">3.2 Payment</h3><p className="text-base leading-7">Due upon collection. We accept cash, UPI, cards, and digital payments.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">3.3 Price Guarantee</h3><p className="text-base leading-7"><strong>Receipt price honored</strong> for that order.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">3.4 Credit</h3><p className="text-base leading-7">Only for pre-approved corporate customers.</p></div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Section 4 */}
                            <section id="section-4" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>4</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Limitations of Liability & Claims
                                    </h2>
                                </div>

                                <div className="space-y-8 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">4.1 Delicate Items</h3><p className="text-base leading-7">Not liable for damage to beading, sequins, or embellishments unless documented.</p></div>
                                    <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl">
                                        <h3 className="font-bold text-red-900 text-lg mb-3">4.2 Claims — CRITICAL</h3>
                                        <p className="text-red-900 text-base leading-7 mb-3">Submit <strong>IN WRITING within 24 HOURS</strong>. Late claims rejected.</p>
                                        <p className="text-red-900 text-base leading-7">Max liability: <strong>10× service charge</strong>.</p>
                                    </div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">4.3 Exclusions</h3><p className="text-base leading-7">Not liable for color fading, shrinkage (1-3%), or age-related wear.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">4.4 Personal Belongings</h3><p className="text-base leading-7">Empty pockets before submission. <strong>No liability for pocket contents.</strong></p></div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Section 5 */}
                            <section id="section-5" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>5</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Privacy, Data Protection & Communication
                                    </h2>
                                </div>

                                <div className="space-y-8 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">5.1 Data Collection</h3><p className="text-base leading-7">Used for service provision and analytics. Compliant with data protection laws.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">5.2 Confidentiality</h3><p className="text-base leading-7">Data not sold or shared except where legally required.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">5.3 Communications</h3><p className="text-base leading-7">Consent to receive updates via SMS, email, WhatsApp. Opt-out available.</p></div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Section 6 */}
                            <section id="section-6" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>6</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Franchise Operations & Dispute Resolution
                                    </h2>
                                </div>

                                <div className="space-y-8 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">6.1 Franchise Network</h3><p className="text-base leading-7">Independently owned franchises. Each is a separate legal entity.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">6.2 Dispute Resolution</h3><p className="text-base leading-7">Address complaints <strong>in writing</strong> to the franchise first. Escalate to Corporate only if unresolved.</p></div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Section 7 */}
                            <section id="section-7" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>7</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        General Provisions
                                    </h2>
                                </div>

                                <div className="space-y-8 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">7.1 Governing Law</h3><p className="text-base leading-7">Governed by laws of the franchise's jurisdiction.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">7.2 Updates</h3><p className="text-base leading-7">Terms may be updated. Continued use constitutes acceptance.</p></div>
                                    <div><h3 className="font-bold text-stone-900 text-lg mb-3">7.3 Severability</h3><p className="text-base leading-7">Invalid provisions do not affect remaining terms.</p></div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Section 8 - Contact */}
                            <section id="section-8" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-5xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>8</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Contact Information
                                    </h2>
                                </div>

                                <div className="text-stone-700 leading-relaxed" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div className="bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-xl p-8">
                                        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-stone-300">
                                            <img src="/assets/fabclean-logo.png" alt="Fab Clean" className="h-14 object-contain" />
                                            <div>
                                                <p className="font-bold text-stone-900 text-xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Corporate Support</p>
                                                <p className="text-sm text-stone-500">Mediation and Escalation</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-stone-700 text-base">
                                            <p><span className="font-semibold text-stone-900">Email:</span> <a href="mailto:support@myfabclean.com" className="text-emerald-600 hover:underline">support@myfabclean.com</a></p>
                                            <p><span className="font-semibold text-stone-900">Website:</span> <a href="https://www.myfabclean.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">www.myfabclean.com</a></p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Acceptance Notice */}
                            <div className="mt-14 p-10 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-xl" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                <h3 className="text-xl font-bold text-emerald-900 uppercase tracking-wider mb-5 text-center" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                    Acknowledgment and Acceptance
                                </h3>
                                <p className="text-emerald-800 leading-relaxed text-center max-w-3xl mx-auto text-base">
                                    By utilizing Fab Clean services, you acknowledge that you have read, fully understood,
                                    and unconditionally agree to be bound by these Terms & Conditions in their entirety.
                                </p>
                            </div>

                            {/* Document Footer */}
                            <div className="mt-14 pt-10 border-t-2 border-stone-300 text-center">
                                <img src="/assets/fabclean-logo.png" alt="Fab Clean" className="h-12 object-contain mx-auto mb-5 opacity-70" />
                                <p className="text-base text-stone-600 font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                    © {currentYear} Fab Clean. All Rights Reserved.
                                </p>
                                <p className="text-sm text-stone-500 mt-1" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    Professional Laundry & Dry Cleaning Services
                                </p>
                                <div className="mt-6 pt-6 border-t border-stone-200">
                                    <p className="text-xs text-stone-400 tracking-wider" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                        DOCUMENT ID: FC-TC-{currentYear}-V2.1 | PUBLIC | DECEMBER {currentYear}
                                    </p>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </main>
            </div>

            {/* Global animation keyframes */}
            <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
        </div>
    );
}
