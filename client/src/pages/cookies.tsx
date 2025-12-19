import { useEffect } from 'react';

// SEO Meta Tags
const useCookiesSEO = () => {
    useEffect(() => {
        document.title = "Cookie Policy | Fab Clean - Premium Laundry Services";
        const metaTags = [
            { name: "description", content: "Fab Clean's Cookie Policy explains how we use cookies and similar technologies on our website." },
            { name: "keywords", content: "fab clean cookies, website cookies, tracking technologies, cookie consent" },
            { property: "og:title", content: "Cookie Policy | Fab Clean" },
            { property: "og:description", content: "Learn how Fab Clean uses cookies and tracking technologies." },
        ];
        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            Object.entries(tag).forEach(([key, value]) => meta.setAttribute(key, value));
            document.head.appendChild(meta);
        });
        return () => { document.title = "Fab Clean - Premium Laundry & Dry Cleaning"; };
    }, []);
};

const cookieData = {
    effectiveDate: "January 1, 2025",
    lastUpdated: "December 19, 2024",
    sections: [
        {
            id: 1,
            title: "What Are Cookies?",
            content: `Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently and provide useful information to website owners.

Cookies serve various purposes including remembering your preferences, understanding how you use our website, improving your browsing experience, and providing relevant content and advertisements.

When you first visit our website, we ask for your consent to use certain cookies. You can manage your cookie preferences at any time through your browser settings or our cookie consent tool.

Similar technologies such as web beacons, pixels, and local storage may also be used for similar purposes. References to "cookies" in this policy include these similar technologies.`
        },
        {
            id: 2,
            title: "Types of Cookies We Use",
            content: `STRICTLY NECESSARY COOKIES: These cookies are essential for the website to function properly. They enable basic functions like page navigation, access to secure areas, and shopping cart functionality. Without these cookies, the website cannot function properly. These cookies do not require consent.

PERFORMANCE COOKIES: These cookies collect information about how visitors use our website, such as which pages are visited most often and if visitors get error messages. This data helps us improve how our website works. All information collected is aggregated and anonymous.

FUNCTIONALITY COOKIES: These cookies allow our website to remember choices you make (such as your username, language, or region) and provide enhanced, more personalized features. They may also be used to provide services you have asked for.

TARGETING/ADVERTISING COOKIES: These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.

SOCIAL MEDIA COOKIES: These cookies are set by social media services (like Facebook, Instagram, and WhatsApp) that we have added to our site to enable you to share our content with your friends and networks.`
        },
        {
            id: 3,
            title: "Specific Cookies We Use",
            content: `ESSENTIAL COOKIES:
- Session ID: Maintains your session while browsing (expires when browser closes)
- CSRF Token: Protects against cross-site request forgery attacks (expires after each session)
- Authentication: Keeps you logged in to your account (expires after 30 days or logout)
- Cart: Remembers items in your shopping cart (expires after 7 days)

ANALYTICS COOKIES:
- Google Analytics (_ga, _gid, _gat): Tracks website usage, page views, and user behavior (expires after 2 years)
- Hotjar: Records user sessions to understand user experience (expires after 1 year)

FUNCTIONALITY COOKIES:
- Language Preference: Remembers your preferred language (expires after 1 year)
- Location: Stores your preferred pickup/delivery area (expires after 30 days)
- User Preferences: Stores display settings and preferences (expires after 1 year)

MARKETING COOKIES:
- Facebook Pixel: Tracks conversions from Facebook ads (expires after 3 months)
- Google Ads: Measures ad campaign effectiveness (expires after 90 days)
- WhatsApp: Enables WhatsApp integration features (session only)`
        },
        {
            id: 4,
            title: "Third-Party Cookies",
            content: `Some cookies on our website are set by third parties. We do not control these cookies:

GOOGLE: We use Google Analytics to understand how visitors use our website. Google may also use cookies for advertising purposes.

FACEBOOK: If you interact with our Facebook content or use Facebook login, Facebook may set cookies.

PAYMENT PROCESSORS: Our payment partners (Razorpay, Paytm, etc.) may set cookies to process payments securely and prevent fraud.

CUSTOMER SUPPORT: Our chat and support tools (if any) may set cookies to provide personalized support.

CDN PROVIDERS: Content delivery network providers may set cookies to optimize content delivery.

Please refer to these third parties' privacy policies for more information about their cookies:
- Google: policies.google.com/privacy
- Facebook: www.facebook.com/policy/cookies
- Razorpay: razorpay.com/privacy`
        },
        {
            id: 5,
            title: "How to Manage Cookies",
            content: `BROWSER SETTINGS: You can control and delete cookies through your browser settings. Most browsers allow you to:
- View what cookies are stored and delete them individually
- Block third-party cookies
- Block all cookies from specific sites
- Block all cookies from all sites
- Delete all cookies when you close the browser

BROWSER-SPECIFIC INSTRUCTIONS:
- Chrome: Settings → Privacy and Security → Cookies
- Firefox: Options → Privacy & Security → Cookies
- Safari: Preferences → Privacy → Cookies
- Edge: Settings → Privacy, Search and Services → Cookies

OUR COOKIE CONSENT TOOL: When you first visit our website, you can customize your cookie preferences using our consent banner. You can update these preferences at any time by clicking the "Cookie Settings" link in our website footer.

MOBILE DEVICES: On mobile devices, you can typically manage cookie settings through your device settings or browser app settings.

OPTING OUT OF ANALYTICS: You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.`
        },
        {
            id: 6,
            title: "Impact of Disabling Cookies",
            content: `If you choose to disable cookies, please note:

ESSENTIAL FUNCTIONS: Disabling essential cookies will prevent our website from functioning properly. You may not be able to log in, place orders, or use certain features.

USER EXPERIENCE: Without functionality cookies, we cannot remember your preferences, and you may need to re-enter information each time you visit.

PERSONALIZATION: Blocking targeting cookies means you will still see advertisements, but they may not be relevant to your interests.

ANALYTICS: If you block analytics cookies, we cannot include your visit in our usage statistics, which helps us improve our services.

SOCIAL FEATURES: Blocking social media cookies may prevent sharing features and social login from working.

We recommend keeping essential and functionality cookies enabled for the best experience on our website.`
        },
        {
            id: 7,
            title: "Web Beacons & Pixels",
            content: `In addition to cookies, we use web beacons (also known as "pixels" or "clear GIFs"):

WHAT THEY ARE: Web beacons are tiny transparent images embedded in web pages or emails. They work with cookies to collect information.

HOW WE USE THEM:
- Track email opens and clicks to measure campaign effectiveness
- Understand which pages you visit and how you interact with content
- Count visitors to specific pages
- Detect your device type and screen resolution

EMAIL TRACKING: Our marketing emails may contain web beacons to track opens and clicks. You can disable image loading in your email client to prevent this tracking.

MANAGING WEB BEACONS: Since web beacons work alongside cookies, managing your cookie settings will also affect web beacon functionality.`
        },
        {
            id: 8,
            title: "Local Storage & Session Storage",
            content: `Besides cookies, we use browser storage technologies:

LOCAL STORAGE: Similar to cookies but with larger storage capacity. Used to store:
- User preferences and settings
- Cached data for faster page loads
- Draft orders or unsaved form data
- Application state

SESSION STORAGE: Temporary storage that is cleared when you close your browser. Used for:
- Temporary session data
- Page-specific information
- Multi-step form progress

HOW TO CLEAR: You can clear local and session storage through your browser's developer tools or privacy settings, similar to clearing cookies.

IMPACT: Clearing this data may log you out and reset your preferences.`
        },
        {
            id: 9,
            title: "Do Not Track",
            content: `Some browsers have a "Do Not Track" (DNT) feature that signals to websites that you prefer not to be tracked.

CURRENT STATUS: There is currently no universal standard for how websites should respond to DNT signals.

OUR APPROACH: We respect your privacy preferences. If you have DNT enabled:
- We minimize non-essential tracking
- We still use essential cookies necessary for website functionality
- Third-party services may have their own DNT policies

ALTERNATIVE CONTROLS: Regardless of DNT settings, you can use our cookie consent tool and browser privacy settings to control tracking.`
        },
        {
            id: 10,
            title: "Children's Privacy",
            content: `Our website is not intended for children under 18 years of age.

NO TARGETED ADVERTISING: We do not knowingly use cookies to target advertising to children.

PARENTAL CONTROLS: Parents and guardians can use browser privacy controls and parental filtering software to limit cookie usage on devices used by children.

If you believe we have inadvertently collected information from a child, please contact us immediately at privacy@myfabclean.com.`
        },
        {
            id: 11,
            title: "Updates to This Policy",
            content: `We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices.

NOTIFICATION: Significant changes will be communicated through a prominent notice on our website and/or via email.

REVIEW: We encourage you to periodically review this policy to stay informed about how we use cookies.

VERSION HISTORY: Previous versions of this policy are available upon request.

LAST UPDATED: This policy was last updated on December 19, 2024.`
        },
        {
            id: 12,
            title: "Contact Us",
            content: `If you have questions about this Cookie Policy or our use of cookies:

EMAIL: privacy@myfabclean.com

PHONE: +91 93630 59595

MAIL:
Fab Clean - Privacy Team
#16, Venkatramana Round Road
Opp Naturals/HDFC Bank, Mahalingapuram
Pollachi - 642002
Tamil Nadu, India

RESPONSE TIME: We aim to respond to all cookie-related inquiries within 48 hours.

For general privacy concerns, please refer to our Privacy Policy.`
        }
    ]
};

export default function CookiesPage() {
    useCookiesSEO();
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
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
                    <p className="text-purple-100 text-lg max-w-2xl mx-auto">
                        Learn how we use cookies and similar technologies to enhance your browsing experience.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm text-purple-200">
                        <span>Effective: {cookieData.effectiveDate}</span>
                        <span className="w-1 h-1 rounded-full bg-purple-300"></span>
                        <span>Last Updated: {cookieData.lastUpdated}</span>
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
                        <a href="/refund" className="px-4 py-2 text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors">Refund Policy</a>
                        <span className="text-slate-300">|</span>
                        <span className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-full font-medium">Cookie Policy</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                {/* Table of Contents */}
                <div className="bg-slate-50 rounded-xl p-8 mb-12">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Table of Contents</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {cookieData.sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow text-left group"
                            >
                                <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 font-semibold rounded-lg text-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    {section.id}
                                </span>
                                <span className="text-slate-700 group-hover:text-purple-700 transition-colors">{section.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-12">
                    {cookieData.sections.map((section) => (
                        <section key={section.id} id={`section-${section.id}`} className="scroll-mt-32">
                            <div className="flex items-start gap-4 mb-6">
                                <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-purple-600 text-white font-bold rounded-xl text-lg">
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
