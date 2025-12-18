/**
 * Terms & Conditions Page
 * 
 * Accessible only via direct link: myfabclean.com/terms
 * NOT included in navigation - completely isolated
 * 
 * Professional legal document with formal legal language
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
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        const timers = [
            setTimeout(() => setScrollPhase(1), 200),
            setTimeout(() => setScrollPhase(2), 600),
            setTimeout(() => setScrollPhase(3), 1000),
            setTimeout(() => setShowParticles(true), 1200),
            setTimeout(() => setScrollPhase(4), 1600),
            setTimeout(() => setTextReveal(1), 1800),
            setTimeout(() => setTextReveal(2), 2100),
            setTimeout(() => setTextReveal(3), 2400),
            setTimeout(() => setScrollPhase(5), 2800),
            setTimeout(() => setScrollPhase(6), 3400),
            setTimeout(() => setIsLoading(false), 3800),
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

                    <div
                        className={`absolute w-[600px] h-[600px] rounded-full transition-all duration-1000 ease-out ${scrollPhase >= 1 ? 'opacity-30 scale-100' : 'opacity-0 scale-50'
                            }`}
                        style={{
                            background: 'radial-gradient(circle, rgba(217,119,6,0.3) 0%, rgba(120,53,15,0.1) 50%, transparent 70%)',
                            filter: 'blur(40px)',
                        }}
                    />

                    {showParticles && (
                        <div className="absolute inset-0 pointer-events-none">
                            {particles.map(p => (
                                <Particle key={p.id} {...p} />
                            ))}
                        </div>
                    )}

                    <div className="relative flex flex-col items-center">

                        <div
                            className={`relative w-80 h-7 transition-all ease-out ${scrollPhase >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 -translate-y-8'
                                }`}
                            style={{ transitionDuration: '800ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                            <div className="absolute inset-0 rounded-full blur-md" style={{ background: 'linear-gradient(to bottom, #d97706, #92400e)', opacity: 0.5 }} />
                            <div className="relative w-full h-full rounded-full" style={{ background: 'linear-gradient(to bottom, #f59e0b, #b45309, #78350f)', boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)' }} />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)' }} />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 rounded-full" style={{ background: 'linear-gradient(to bottom, #fcd34d, #b45309)' }} />
                            </div>
                        </div>

                        <div
                            className={`relative overflow-hidden transition-all ease-out ${scrollPhase >= 3 ? 'opacity-100' : 'opacity-0'}`}
                            style={{
                                width: '300px',
                                height: scrollPhase >= 4 ? '420px' : scrollPhase >= 3 ? '80px' : '0px',
                                transitionDuration: '1200ms',
                                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                                background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 20%, #fef3c7 50%, #fde68a 80%, #fef3c7 100%)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 60px rgba(180,83,9,0.1)',
                                borderLeft: '3px solid rgba(180,83,9,0.2)',
                                borderRight: '3px solid rgba(180,83,9,0.2)',
                            }}
                        >
                            <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-black/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-black/10 to-transparent" />

                            <div className="absolute inset-0 flex flex-col items-center justify-center p-10">

                                <div className={`w-48 h-0.5 mb-6 transition-all duration-700 ${textReveal >= 1 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} style={{ background: 'linear-gradient(90deg, transparent, #92400e, #b45309, #92400e, transparent)' }} />

                                <div className={`relative transition-all duration-700 ${textReveal >= 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'}`}>
                                    <div className="absolute inset-0 blur-xl bg-amber-500/30 scale-150" />
                                    <img src="/assets/fabclean-logo.png" alt="Fab Clean" className="relative h-16 object-contain drop-shadow-lg" />
                                </div>

                                <div className={`flex items-center gap-2 my-5 transition-all duration-500 ${textReveal >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-700" />
                                    <div className="w-2 h-2 rotate-45 bg-amber-700" />
                                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-700" />
                                </div>

                                <h1 className={`text-2xl font-bold text-stone-800 text-center mb-2 transition-all duration-700 ${textReveal >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                    Terms & Conditions
                                </h1>

                                <p className={`text-xs text-stone-600 tracking-[0.3em] uppercase mb-6 transition-all duration-700 ${textReveal >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    Legal Agreement
                                </p>

                                <div className={`flex flex-col items-center gap-3 transition-all duration-500 ${textReveal >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="flex gap-2">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="w-2 h-2 bg-emerald-600 rounded-full" style={{ animation: 'bounce 1s infinite', animationDelay: `${i * 150}ms` }} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-stone-500 animate-pulse" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>Loading document...</p>
                                </div>

                                <div className={`absolute bottom-8 right-8 transition-all ${scrollPhase >= 5 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-150 rotate-45'}`} style={{ transitionDuration: '500ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                    <div className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)' }}>
                                        <div className="w-12 h-12 rounded-full border-2 border-red-300/40 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
                                            <span className="text-red-100 font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif" }}>FC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`relative w-80 h-7 transition-all ease-out ${scrollPhase >= 4 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'}`} style={{ transitionDuration: '800ms', transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                            <div className="absolute inset-0 rounded-full blur-md" style={{ background: 'linear-gradient(to top, #d97706, #92400e)', opacity: 0.5 }} />
                            <div className="relative w-full h-full rounded-full" style={{ background: 'linear-gradient(to top, #f59e0b, #b45309, #78350f)', boxShadow: '0 -4px 20px rgba(0,0,0,0.6)' }}>
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)' }} />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #fbbf24, #b45309)' }} />
                            </div>
                        </div>
                    </div>

                    <div className={`absolute inset-0 bg-white transition-opacity duration-300 pointer-events-none ${scrollPhase >= 6 ? 'opacity-100' : 'opacity-0'}`} />
                </div>
            )}

            {/* Main Content */}
            <div className={`transition-all duration-1000 ease-out ${isLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>

                <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40 shadow-lg">
                    <div className="max-w-4xl mx-auto px-8 py-5">
                        <div className="flex items-center justify-center">
                            <img src="/assets/fabclean-logo.png" alt="Fab Clean - Dry Clean | Laundry" className="h-14 object-contain" />
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-8 py-12">
                    <Card className="border border-stone-200 shadow-2xl bg-gradient-to-b from-white via-orange-50/20 to-stone-50 backdrop-blur-sm">
                        <CardContent className="p-10 md:p-14">

                            {/* Document Title */}
                            <div className="text-center mb-14 pb-8 border-b-2 border-stone-300">
                                <div className="flex justify-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-emerald-600" />
                                        <div className="w-3 h-3 rotate-45 bg-emerald-600" />
                                        <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-emerald-600" />
                                    </div>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-bold text-stone-800 tracking-tight mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                    Terms and Conditions
                                </h1>
                                <p className="text-sm text-stone-500 tracking-widest uppercase mb-3" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    of Service
                                </p>
                                <p className="text-xs text-stone-400" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    Effective Date: 1st December {currentYear} | Version 2.1 | Jurisdiction: India
                                </p>
                            </div>

                            {/* Preamble */}
                            <div className="mb-12 p-8 bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-xl border border-stone-200" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                <p className="text-stone-700 leading-relaxed text-justify text-base">
                                    <strong className="text-stone-900">WHEREAS</strong>, Fab Clean (hereinafter referred to as the "<strong>Company</strong>",
                                    "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") operates a professional textile care,
                                    laundry, and dry cleaning service through its network of independently owned and operated franchise establishments;
                                    and <strong>WHEREAS</strong>, you (hereinafter referred to as the "<strong>Customer</strong>", "<strong>you</strong>",
                                    or "<strong>your</strong>") desire to avail yourself of the services offered by the Company;
                                </p>
                                <p className="text-stone-700 leading-relaxed text-justify text-base mt-4">
                                    <strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants and agreements herein contained, and for
                                    other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties
                                    agree to be bound by the following Terms and Conditions. By utilizing any services provided by the Company, the
                                    Customer acknowledges having read, understood, and unconditionally agrees to be legally bound by the entirety of
                                    this Agreement.
                                </p>
                            </div>

                            {/* Table of Contents */}
                            <div className="mb-14 p-8 bg-emerald-50/70 rounded-xl border border-emerald-200/70">
                                <h2 className="text-lg font-bold text-emerald-800 uppercase tracking-widest mb-6 text-center" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    Table of Contents
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <a href="#article-1" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article I.</span> Definitions and Interpretation
                                    </a>
                                    <a href="#article-2" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article II.</span> Scope of Services
                                    </a>
                                    <a href="#article-3" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article III.</span> Order Processing and Delivery
                                    </a>
                                    <a href="#article-4" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article IV.</span> Pricing and Payment Terms
                                    </a>
                                    <a href="#article-5" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article V.</span> Limitation of Liability
                                    </a>
                                    <a href="#article-6" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article VI.</span> Claims and Dispute Resolution
                                    </a>
                                    <a href="#article-7" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article VII.</span> Privacy and Data Protection
                                    </a>
                                    <a href="#article-8" className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors flex items-center gap-2">
                                        <span className="text-emerald-400">Article VIII.</span> General Provisions
                                    </a>
                                </div>
                            </div>

                            {/* Article I */}
                            <section id="article-1" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>I</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Definitions and Interpretation
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 1.01 — Definitions</h3>
                                        <p className="text-base leading-7 mb-4">For the purposes of this Agreement, the following terms shall have the meanings ascribed to them herein:</p>
                                        <ul className="list-none space-y-3 ml-4">
                                            <li className="flex gap-3"><span className="text-emerald-600 font-bold">(a)</span><span>"<strong>Agreement</strong>" shall mean these Terms and Conditions, together with any schedules, amendments, or addenda hereto.</span></li>
                                            <li className="flex gap-3"><span className="text-emerald-600 font-bold">(b)</span><span>"<strong>Articles</strong>" shall mean all garments, textiles, fabrics, linens, and other items submitted by the Customer for processing.</span></li>
                                            <li className="flex gap-3"><span className="text-emerald-600 font-bold">(c)</span><span>"<strong>Franchise</strong>" shall mean any independently owned and operated business entity authorized to provide services under the Fab Clean brand.</span></li>
                                            <li className="flex gap-3"><span className="text-emerald-600 font-bold">(d)</span><span>"<strong>Service Receipt</strong>" shall mean the official, itemized document issued upon acceptance of Articles for processing.</span></li>
                                            <li className="flex gap-3"><span className="text-emerald-600 font-bold">(e)</span><span>"<strong>Force Majeure</strong>" shall mean any event beyond the reasonable control of the parties, including but not limited to acts of God, natural disasters, war, terrorism, governmental actions, epidemics, or supply chain disruptions.</span></li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 1.02 — Rules of Interpretation</h3>
                                        <p className="text-base leading-7">
                                            In this Agreement, unless the context otherwise requires: (i) words importing the singular shall include the plural and vice versa;
                                            (ii) words importing any gender shall include all genders; (iii) references to "including" shall mean "including without limitation";
                                            (iv) headings are for convenience only and shall not affect interpretation; and (v) references to statutory provisions shall include
                                            any statutory modification or re-enactment thereof.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Article II */}
                            <section id="article-2" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>II</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Scope of Services
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 2.01 — Services Provided</h3>
                                        <p className="text-base leading-7 mb-4">Subject to the terms and conditions set forth herein, the Company shall provide the following professional textile care services:</p>
                                        <ul className="list-none space-y-4 ml-4">
                                            <li className="flex gap-3">
                                                <span className="text-emerald-600 font-bold">(a)</span>
                                                <span><strong>Standard Laundry Services:</strong> Machine washing, drying, and folding of everyday garments and linens using commercial-grade equipment and industry-standard processes. Articles processed under this category may be cleaned collectively with other customers' items to optimize operational efficiency.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="text-emerald-600 font-bold">(b)</span>
                                                <span><strong>Professional Dry Cleaning:</strong> Specialized cleaning of delicate, structured, or high-value garments using non-aqueous solvents and temperature-controlled equipment, suitable for silk, wool, cashmere, and formal attire.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="text-emerald-600 font-bold">(c)</span>
                                                <span><strong>Pressing and Finishing:</strong> Professional ironing, steaming, and finishing services to restore garments to a crisp, presentation-ready condition.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="text-emerald-600 font-bold">(d)</span>
                                                <span><strong>Specialized Treatments:</strong> Expert care for specialty materials including leather, suede, down-filled items, and antique textiles, subject to availability at individual Franchise locations.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="text-emerald-600 font-bold">(e)</span>
                                                <span><strong>Stain Treatment:</strong> Application of specialized techniques to remove or minimize stains. <em>The Company makes no warranty, express or implied, regarding complete stain removal, as success depends upon stain type, age, fabric composition, and prior treatments.</em></span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 2.02 — Formation of Contract</h3>
                                        <p className="text-base leading-7">
                                            A binding contract for services shall be deemed to have been formed upon: (i) the Customer's submission of Articles to any Franchise location
                                            or through authorized digital channels; (ii) the inspection and acceptance of said Articles by a Company representative; and (iii) the issuance
                                            of a Service Receipt documenting the items received and services requested. The Customer shall verify the accuracy of the Service Receipt at the
                                            time of issuance and shall be deemed to have accepted its contents if no objection is raised prior to commencement of processing.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 2.03 — Reservation of Rights</h3>
                                        <p className="text-base leading-7">
                                            The Company reserves the absolute right, exercisable at its sole discretion and without obligation to provide reasons, to decline acceptance
                                            of any Articles or refuse service to any Customer. Such refusal may be based upon, inter alia: potential risk to equipment or personnel;
                                            presence of hazardous materials; absence of care labels; previous payment defaults; or conduct inconsistent with the Company's policies.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Article III */}
                            <section id="article-3" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>III</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Order Processing and Delivery
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 3.01 — Processing Timeline</h3>
                                        <p className="text-base leading-7">
                                            All estimated completion dates provided at the time of order placement are approximate projections and shall not constitute a binding
                                            commitment. Actual processing time may vary based upon service complexity, current operational capacity, equipment availability, and
                                            external factors beyond the Company's reasonable control. The Company shall endeavor to notify the Customer of any delay exceeding
                                            twenty-four (24) hours from the originally estimated completion date.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 3.02 — Express Processing</h3>
                                        <p className="text-base leading-7">
                                            Expedited processing services ("<strong>Express Services</strong>") may be available for certain categories of Articles, subject to
                                            operational capacity and at an additional premium charge. Express Service fees are <strong>non-refundable</strong>. In the event the
                                            Company fails to meet an Express Service deadline due solely to its own operational failure (excluding Force Majeure events), the
                                            Customer shall be entitled to a refund of the Express Service premium only; all standard service charges shall remain payable.
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
                                        <h3 className="font-bold text-amber-900 text-lg mb-3">Section 3.03 — Abandonment of Property</h3>
                                        <p className="text-amber-900 text-base leading-7">
                                            <strong>NOTICE:</strong> The Customer shall collect processed Articles within <strong>thirty (30) calendar days</strong> of the
                                            notified completion date. Articles remaining unclaimed for a period exceeding <strong>sixty (60) calendar days</strong> from said
                                            date shall be deemed abandoned property pursuant to applicable law. Upon such abandonment, the Company shall be entitled, without
                                            further notice or liability, to dispose of, donate, or liquidate such Articles to recover storage costs and outstanding service
                                            charges. The Customer hereby waives any and all claims arising from such disposition.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Article IV */}
                            <section id="article-4" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IV</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Pricing and Payment Terms
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 4.01 — Pricing</h3>
                                        <p className="text-base leading-7">
                                            Service charges shall be calculated in accordance with the Company's prevailing rate schedule, considering factors including but not
                                            limited to: service type, article category, fabric composition, and special handling requirements. The price quoted on the Service
                                            Receipt at the time of order acceptance shall be the binding price for that transaction, notwithstanding any subsequent amendments
                                            to the general rate schedule.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 4.02 — Payment Obligations</h3>
                                        <p className="text-base leading-7">
                                            Full payment of all service charges is due and payable at the time of collection or delivery of processed Articles. The Company
                                            shall retain a possessory lien over all Articles until such time as payment is received in full. The Company accepts payment by
                                            cash, Unified Payments Interface (UPI), credit and debit cards, and such other methods as may be made available at individual
                                            Franchise locations.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 4.03 — Credit Terms</h3>
                                        <p className="text-base leading-7">
                                            Extended payment terms or credit facilities shall not be available to individual Customers except pursuant to a separate written
                                            agreement executed by an authorized representative of the Company. Corporate or commercial accounts may be eligible for credit
                                            arrangements at the sole discretion of Franchise management, subject to credit approval and execution of appropriate documentation.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Article V */}
                            <section id="article-5" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>V</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Limitation of Liability
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 5.01 — Exclusion of Liability for Inherent Characteristics</h3>
                                        <p className="text-base leading-7">
                                            The Company shall not be liable for any damage, deterioration, or change in condition arising from: (i) the inherent nature of
                                            the fabric or article; (ii) pre-existing defects, weaknesses, or wear not apparent upon visual inspection; (iii) color bleeding
                                            or fading consistent with the fabric's characteristics; (iv) shrinkage within industry-standard tolerances (typically 1-3%);
                                            (v) damage to beading, sequins, embellishments, or decorative elements; or (vi) the Company's good-faith compliance with
                                            manufacturer care label instructions that prove inadequate.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 5.02 — Customer's Duty of Inspection</h3>
                                        <p className="text-base leading-7">
                                            The Customer shall empty all pockets, remove all detachable items, and inspect all hidden compartments prior to submission of
                                            Articles. The Company accepts no responsibility whatsoever for loss of or damage to money, jewelry, electronics, documents,
                                            or any other items left in garments. Found items shall be retained for seven (7) calendar days, after which they may be
                                            disposed of without liability.
                                        </p>
                                    </div>

                                    <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl">
                                        <h3 className="font-bold text-red-900 text-lg mb-3">Section 5.03 — Limitation of Damages</h3>
                                        <p className="text-red-900 text-base leading-7">
                                            <strong>IMPORTANT:</strong> In no event shall the Company's total liability for any claim arising out of or relating to the
                                            services provided hereunder exceed <strong>ten times (10×) the service charge</strong> for the specific Article in question.
                                            This limitation applies regardless of the legal theory upon which the claim is based, whether in contract, tort (including
                                            negligence), strict liability, or otherwise. The Company shall not be liable for any indirect, incidental, consequential,
                                            special, or punitive damages, including but not limited to loss of use, loss of profits, or emotional distress, even if
                                            advised of the possibility of such damages.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Article VI */}
                            <section id="article-6" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VI</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Claims and Dispute Resolution
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl">
                                        <h3 className="font-bold text-red-900 text-lg mb-3">Section 6.01 — Mandatory Claims Procedure</h3>
                                        <p className="text-red-900 text-base leading-7">
                                            <strong>TIME IS OF THE ESSENCE.</strong> Any and all claims for loss, damage, or dissatisfaction with services rendered
                                            <strong> MUST</strong> be submitted in writing to the servicing Franchise within <strong>twenty-four (24) hours</strong> of
                                            collection or delivery of the affected Articles. Failure to submit a written claim within this mandatory period shall
                                            constitute an absolute bar to recovery, and the Customer shall be deemed to have accepted the Articles in their delivered
                                            condition and waived all claims related thereto.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 6.02 — Dispute Resolution Process</h3>
                                        <p className="text-base leading-7">
                                            Any dispute arising out of or relating to this Agreement or the services provided hereunder shall first be addressed
                                            through good-faith negotiation between the Customer and the servicing Franchise. If such dispute cannot be resolved
                                            within thirty (30) days of the initial written complaint, either party may escalate the matter to the Company's
                                            Corporate Support department for mediation. No legal proceedings may be commenced until this pre-action protocol
                                            has been completed in full.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 6.03 — Franchise Independence</h3>
                                        <p className="text-base leading-7">
                                            The Customer acknowledges and agrees that each Franchise operates as an independent business entity and is solely
                                            responsible for its own operations, employees, and service quality. The Company shall not be vicariously liable
                                            for the acts or omissions of any Franchise or its personnel, except to the extent mandated by applicable law.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Article VII */}
                            <section id="article-7" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VII</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Privacy and Data Protection
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 7.01 — Collection and Use of Personal Data</h3>
                                        <p className="text-base leading-7">
                                            The Company collects, processes, and retains personal information (including name, address, contact details, and
                                            transaction history) solely for purposes of: (i) service provision and order fulfillment; (ii) payment processing;
                                            (iii) customer relationship management; (iv) compliance with legal and regulatory obligations; and (v) legitimate
                                            business analytics. All data processing activities are conducted in accordance with applicable data protection
                                            legislation, including the Information Technology Act, 2000 and rules thereunder.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 7.02 — Data Sharing and Confidentiality</h3>
                                        <p className="text-base leading-7">
                                            Personal data shall not be sold, leased, or disclosed to third parties except: (i) to authorized service providers
                                            (including payment processors and logistics partners) as necessary for service delivery; (ii) as required by law,
                                            court order, or governmental authority; or (iii) with the Customer's explicit consent. The Company implements
                                            appropriate technical and organizational security measures to protect personal data against unauthorized access,
                                            alteration, disclosure, or destruction.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 7.03 — Marketing Communications</h3>
                                        <p className="text-base leading-7">
                                            By providing contact information, the Customer consents to receive service-related communications and promotional
                                            materials via SMS, email, WhatsApp, or other electronic channels. The Customer may withdraw consent for marketing
                                            communications at any time by following the unsubscribe instructions provided therein or by contacting the Company
                                            directly. Essential service notifications shall continue regardless of marketing preferences.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <Separator className="my-12 bg-stone-300" />

                            {/* Article VIII */}
                            <section id="article-8" className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VIII</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        General Provisions
                                    </h2>
                                </div>

                                <div className="space-y-6 text-stone-700 leading-relaxed text-justify" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 8.01 — Governing Law and Jurisdiction</h3>
                                        <p className="text-base leading-7">
                                            This Agreement shall be governed by and construed in accordance with the laws of India, without regard to principles of
                                            conflicts of law. The parties hereby submit to the exclusive jurisdiction of the courts located in the district where
                                            the servicing Franchise is situated for the resolution of any disputes arising hereunder.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 8.02 — Amendment and Modification</h3>
                                        <p className="text-base leading-7">
                                            The Company reserves the right to amend, modify, or supplement these Terms and Conditions at any time without prior
                                            individual notice. The current version shall be published on the Company's official website and shall supersede all
                                            prior versions. Continued use of the Company's services following publication of amended terms shall constitute
                                            acceptance of such amendments.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 8.03 — Severability</h3>
                                        <p className="text-base leading-7">
                                            If any provision of this Agreement is held by a court of competent jurisdiction to be invalid, illegal, or unenforceable,
                                            such provision shall be severed and the remaining provisions shall continue in full force and effect. The invalid
                                            provision shall be deemed modified to the minimum extent necessary to make it valid and enforceable while preserving
                                            the parties' original intent.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 8.04 — Entire Agreement</h3>
                                        <p className="text-base leading-7">
                                            This Agreement, together with the Service Receipt and any written amendments thereto, constitutes the entire agreement
                                            between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations,
                                            warranties, and agreements between the parties, whether written or oral.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-stone-900 text-lg mb-3">Section 8.05 — Waiver</h3>
                                        <p className="text-base leading-7">
                                            No failure or delay by the Company in exercising any right, power, or remedy hereunder shall operate as a waiver thereof,
                                            nor shall any single or partial exercise of any right, power, or remedy preclude any other or further exercise thereof
                                            or the exercise of any other right, power, or remedy.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Contact Section */}
                            <section className="mb-14 scroll-mt-24">
                                <div className="flex items-baseline gap-4 mb-8 pb-4 border-b-2 border-emerald-600">
                                    <span className="text-4xl font-bold text-emerald-600" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>§</span>
                                    <h2 className="text-2xl font-bold text-stone-800 uppercase tracking-wide" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        Contact Information
                                    </h2>
                                </div>

                                <div className="text-stone-700 leading-relaxed" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                    <p className="mb-6 text-justify text-base leading-7">
                                        For formal inquiries regarding this Agreement, submission of claims, or escalation of disputes pursuant to Article VI,
                                        please direct all correspondence to:
                                    </p>

                                    <div className="bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-xl p-8">
                                        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-stone-300">
                                            <img src="/assets/fabclean-logo.png" alt="Fab Clean" className="h-14 object-contain" />
                                            <div>
                                                <p className="font-bold text-stone-900 text-xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Fab Clean</p>
                                                <p className="text-sm text-stone-500">Legal and Customer Relations Department</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-stone-700 text-base">
                                            <p><span className="font-semibold text-stone-900">Electronic Mail:</span> <a href="mailto:legal@myfabclean.com" className="text-emerald-600 hover:underline">legal@myfabclean.com</a></p>
                                            <p><span className="font-semibold text-stone-900">Customer Support:</span> <a href="mailto:support@myfabclean.com" className="text-emerald-600 hover:underline">support@myfabclean.com</a></p>
                                            <p><span className="font-semibold text-stone-900">Website:</span> <a href="https://www.myfabclean.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">www.myfabclean.com</a></p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Acknowledgment */}
                            <div className="mt-14 p-10 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-xl" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                                <h3 className="text-xl font-bold text-emerald-900 uppercase tracking-wider mb-5 text-center" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                    Acknowledgment and Acceptance
                                </h3>
                                <p className="text-emerald-800 leading-relaxed text-center max-w-3xl mx-auto text-base">
                                    <strong>BY UTILIZING THE SERVICES OF FAB CLEAN OR ANY OF ITS FRANCHISES</strong>, the Customer hereby acknowledges
                                    that they have read this Agreement in its entirety, understand its terms and conditions, and agree to be legally
                                    bound thereby. This Agreement shall constitute a valid and enforceable contract between the parties.
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
                                        DOCUMENT REFERENCE: FC/LEGAL/TC/{currentYear}/2.1 | CLASSIFICATION: PUBLIC | EFFECTIVE: 1 DECEMBER {currentYear}
                                    </p>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </main>
            </div>

            <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        /* Hide scrollbar while maintaining scroll functionality */
        .min-h-screen::-webkit-scrollbar {
          display: none;
        }
        .min-h-screen {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Also hide for the entire document */
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
        }
        html, body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
