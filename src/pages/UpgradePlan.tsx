import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, Clock3, Crown, CreditCard, Loader2, Mail, Rocket, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4000";

type PaidPlan = "pro" | "enterprise";

const planContent: Record<PaidPlan, {
    title: string;
    subtitle: string;
    benefits: { icon: typeof Rocket; title: string; detail: string }[];
}> = {
    pro: {
        title: "Upgrade To Pro",
        subtitle: "For teams that need more headroom, faster support, and premium deployment capabilities.",
        benefits: [
            { icon: Rocket, title: "Higher Limits", detail: "Unlock more projects, more premium features, and room to grow without friction." },
            { icon: ShieldCheck, title: "Priority Features", detail: "Get access to premium capabilities as we roll them out, including runtime-heavy workloads." },
            { icon: BadgeCheck, title: "Operational Support", detail: "We review your requirements and help make sure the plan matches your workload." },
        ],
    },
    enterprise: {
        title: "Talk To Us About Enterprise",
        subtitle: "For larger teams that need tailored pricing, higher limits, and hands-on deployment support.",
        benefits: [
            { icon: Building2, title: "Custom Commercials", detail: "We can scope pricing around your traffic, build volume, and support expectations." },
            { icon: Users, title: "Team-Centric Rollout", detail: "We can plan around how many developers, projects, and environments you need." },
            { icon: Clock3, title: "Planned Follow-Up", detail: "Share your preferred timeline and we’ll reach back out when it works for you." },
        ],
    },
};

export default function UpgradePlan() {
    const { user, token, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedPlan = searchParams.get("plan");
    const plan: PaidPlan = requestedPlan === "enterprise" ? "enterprise" : "pro";
    const content = useMemo(() => planContent[plan], [plan]);
    const [companyName, setCompanyName] = useState("");
    const [role, setRole] = useState("");
    const [teamSize, setTeamSize] = useState("");
    const [useCase, setUseCase] = useState("");
    const [preferredContact, setPreferredContact] = useState<"email" | "phone" | "either">("email");
    const [timeline, setTimeline] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const loadRazorpayCheckout = async (): Promise<any> => {
        const win = window as Window & { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } };
        if (win.Razorpay) {
            return win.Razorpay;
        }

        await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-razorpay-checkout="true"]') as HTMLScriptElement | null;
            if (existing) {
                existing.addEventListener("load", () => resolve(), { once: true });
                existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay Checkout")), { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.dataset.razorpayCheckout = "true";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
            document.body.appendChild(script);
        });

        if (!win.Razorpay) {
            throw new Error("Razorpay Checkout is unavailable");
        }

        return win.Razorpay;
    };

    const handleProCheckout = async () => {
        if (!token) {
            toast.error("Please sign in again and retry.");
            return;
        }

        setCheckoutLoading(true);
        try {
            const [{ data }, RazorpayCtor] = await Promise.all([
                axios.post(`${AUTH_URL}/auth/billing/create-subscription`, { plan: "pro" }, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                loadRazorpayCheckout(),
            ]);

            const razorpay = new RazorpayCtor({
                key: data.keyId,
                subscription_id: data.checkout.subscriptionId,
                name: "Nexus Pro",
                description: "Recurring billing for the Nexus Pro plan",
                image: "/favicon.ico",
                prefill: data.checkout.prefill,
                notes: {
                    plan: "pro",
                },
                theme: {
                    color: "#6366f1",
                },
                modal: {
                    ondismiss: () => {
                        toast("Checkout closed. You can resume from this page anytime.");
                    },
                },
                handler: async (response: { razorpay_subscription_id?: string }) => {
                    try {
                        await axios.post(`${AUTH_URL}/auth/billing/sync`, {
                            subscriptionId: response.razorpay_subscription_id || data.checkout.subscriptionId,
                        }, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        await refreshUser();
                        toast.success("Payment authorized. Your billing status has been refreshed.");
                        navigate("/settings");
                    } catch (err: any) {
                        toast.error(err.response?.data?.error || "Payment captured, but billing sync is still pending confirmation.");
                    }
                },
            });

            razorpay.open();
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || "Failed to start checkout");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!token) {
            toast.error("Please sign in again and retry.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post(`${AUTH_URL}/auth/billing/contact-interest`, {
                targetPlan: plan,
                companyName,
                role,
                teamSize,
                useCase,
                preferredContact,
                timeline,
                notes,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSubmitted(true);
            toast.success(res.data.message || "Upgrade request submitted.");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to submit upgrade request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#06060c] text-white">
            <nav className="border-b border-white/5 bg-[#06060c]/80 backdrop-blur-2xl sticky top-0 z-50">
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link to="/settings" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium text-sm">Back to Settings</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
                    <section className="bg-[#0a0a16]/80 border border-white/10 rounded-3xl p-8 shadow-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.2em] text-slate-300 mb-5">
                            <Crown className="w-4 h-4 text-indigo-300" />
                            {plan}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
                        <p className="text-slate-400 text-lg mt-4 max-w-2xl">{content.subtitle}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            {content.benefits.map((benefit) => {
                                const Icon = benefit.icon;
                                return (
                                    <div key={benefit.title} className="bg-[#05050f] border border-white/10 rounded-2xl p-5">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                            <Icon className="w-5 h-5 text-indigo-300" />
                                        </div>
                                        <h2 className="text-white font-semibold mb-2">{benefit.title}</h2>
                                        <p className="text-sm text-slate-400 leading-relaxed">{benefit.detail}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent border border-indigo-500/20 rounded-2xl p-6">
                            <p className="text-sm text-indigo-100 leading-relaxed">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>For the enterprise plan, we will follow up with you to understand your needs and timeline, and make sure you get the right level of support.</li>
                                    <li>For the pro plan, you can continue directly to checkout and get access to higher limits and premium features immediately after payment authorization.</li>
                                </ul>
                            </p>
                        </div>
                    </section>

                    <section className="bg-[#0a0a16]/80 border border-white/10 rounded-3xl p-8 shadow-xl">
                        {plan === "pro" ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-slate-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Proceed To Pro Checkout</h2>
                                        <p className="text-sm text-slate-400">You can review the benefits here, then continue directly to secure payment.</p>
                                    </div>
                                </div>

                                <div className="bg-[#05050f] border border-white/10 rounded-2xl p-5 space-y-3">
                                    <p className="text-sm text-slate-300">Signed in as</p>
                                    <div className="text-white font-medium">{user?.name}</div>
                                    <div className="text-sm text-slate-400">{user?.email}</div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6">
                                    <p className="text-sm text-slate-200 leading-relaxed">
                                        Pro is meant for users who want higher limits and access to premium platform capabilities without a manual sales step.
                                    </p>
                                </div>

                                <button
                                    onClick={handleProCheckout}
                                    disabled={checkoutLoading}
                                    className="w-full bg-white text-black hover:bg-slate-200 px-5 py-3 rounded-xl text-sm font-bold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                    Continue To Secure Payment
                                </button>
                            </div>
                        ) : submitted ? (
                            <div className="space-y-5">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <BadgeCheck className="w-7 h-7 text-emerald-300" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">Request Received</h2>
                                    <p className="text-slate-400 mt-2">
                                        We have your upgrade request for the {plan} plan. One of us will get back to you at a time that works for you. Leave us a note at <a href="mailto:madhav@madhavkumar.dev" className="text-blue-400 hover:underline">madhav@madhavkumar.dev</a> if you have any questions.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate("/settings")}
                                        className="bg-white text-black hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Return To Settings
                                    </button>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                    >
                                        Submit Another Request
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-slate-200" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Tell Us About Your Team</h2>
                                        <p className="text-sm text-slate-400">We’ll use this to follow up with the right context.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-[#05050f] border border-white/10 rounded-2xl p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Name</p>
                                            <p className="text-sm text-white">{user?.name || "Signed-in user"}</p>
                                        </div>
                                        <div className="bg-[#05050f] border border-white/10 rounded-2xl p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Email</p>
                                            <p className="text-sm text-white">{user?.email || "No email available"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="text-sm text-slate-300 mb-2 block">Company name</span>
                                            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-[#05050f] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50" placeholder="Acme Inc." />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-slate-300 mb-2 block">Your role</span>
                                            <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-[#05050f] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50" placeholder="Founder, engineering lead, platform owner..." />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="block">
                                            <span className="text-sm text-slate-300 mb-2 block">Team size</span>
                                            <input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="w-full bg-[#05050f] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50" placeholder="1-5, 6-20, 20+" />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-slate-300 mb-2 block">Preferred timeline</span>
                                            <input value={timeline} onChange={(e) => setTimeline(e.target.value)} className="w-full bg-[#05050f] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50" placeholder="This week, next month, just exploring..." />
                                        </label>
                                    </div>

                                    <label className="block">
                                        <span className="text-sm text-slate-300 mb-2 block">Preferred contact</span>
                                        <select value={preferredContact} onChange={(e) => setPreferredContact(e.target.value as "email" | "phone" | "either")} className="w-full bg-[#05050f] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50">
                                            <option value="email">Email</option>
                                            <option value="phone">Phone</option>
                                            <option value="either">Either</option>
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="text-sm text-slate-300 mb-2 block">What do you need from this plan?</span>
                                        <textarea value={useCase} onChange={(e) => setUseCase(e.target.value)} rows={5} className="w-full bg-[#05050f] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-y" placeholder="Tell us about your expected workload, must-have features, or support requirements." />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm text-slate-300 mb-2 block">Anything else we should know?</span>
                                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full bg-[#05050f] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-y" placeholder="Budget range, preferred callback window, migration plans, or constraints." />
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-white text-black hover:bg-slate-200 px-5 py-3 rounded-xl text-sm font-bold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                        Send Upgrade Request
                                    </button>
                                </form>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
