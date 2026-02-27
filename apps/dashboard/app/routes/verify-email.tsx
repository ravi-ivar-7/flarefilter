import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { authClient } from '~/lib/auth-client';
import { Logo } from '~/components/Logo';

export const meta = () => [
    { title: "Verify Your Email - FlareFilter" },
    { name: "description", content: "Verify your email address to activate your FlareFilter account." },
];

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const hasError = searchParams.get('error') === 'invalid_token';
    const urlEmail = searchParams.get('email') || '';

    const { data: session } = authClient.useSession();
    // Session email is the single source of truth — it's what Better Auth validates
    // against on resend. URL param is only a fallback when there's no session yet
    // (e.g. page loaded before session hydrated, or direct link visit).
    const navigate = useNavigate();
    const email = session?.user?.email || urlEmail;

    // Sync the URL ?email= param with the session email once it resolves,
    // so the URL always reflects what's actually being used for the resend.
    useEffect(() => {
        if (session?.user?.email && session.user.email !== urlEmail) {
            const params = new URLSearchParams(searchParams);
            params.set('email', session.user.email);
            navigate(`/verify-email?${params.toString()}`, { replace: true });
        }
    }, [session?.user?.email]);

    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [resendError, setResendError] = useState('');

    // Auto-reset the sent/error state so the button reappears after 7s.
    useEffect(() => {
        if (resendStatus === 'sent' || resendStatus === 'error') {
            const t = setTimeout(() => setResendStatus('idle'), 7000);
            return () => clearTimeout(t);
        }
    }, [resendStatus]);

    const handleResend = async () => {
        if (!email) return;
        setResendStatus('sending');
        setResendError('');

        await authClient.sendVerificationEmail(
            { email, callbackURL: '/dashboard' },
            {
                onSuccess: () => setResendStatus('sent'),
                onError: (ctx: any) => {
                    if (ctx.error.status === 429) {
                        setResendError('Too many requests. Please wait a minute before trying again.');
                    } else {
                        setResendError(ctx.error.message || 'Failed to resend. Please try again.');
                    }
                    setResendStatus('error');
                },
            }
        );
    };

    return (
        <div className="flex flex-col items-center justify-center bg-slate-50 text-slate-900 font-sans w-full px-4 py-10">
            <div className="w-full max-w-[400px]">
                <div className="mb-6 flex justify-center">
                    <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        Back to Sign In
                    </Link>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 sm:p-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-5">
                            <Logo variant="icon" size={48} animate={false} />
                        </div>

                        {hasError ? (
                            <>
                                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 text-center">
                                    Link expired or invalid
                                </h1>
                                <p className="text-sm font-medium text-slate-500 mt-2 text-center text-balance">
                                    This verification link is no longer valid.{' '}
                                    {email ? 'Request a new one below.' : 'Please sign in and request a new link.'}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 text-center">
                                    Check your inbox
                                </h1>
                                <p className="text-sm font-medium text-slate-500 mt-2 text-center text-balance">
                                    We sent a verification link to <strong className="text-slate-700">{email || 'your email'}</strong>.
                                    Click it to activate your account.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Resend section */}
                    {email && (
                        <div className="border-t border-slate-100 pt-6 text-center">
                            {resendStatus === 'sent' ? (
                                <p className="text-sm font-semibold text-emerald-600">
                                    ✓ New verification email sent!
                                </p>
                            ) : (
                                <>
                                    <p className="text-xs text-slate-400 mb-3">Didn't receive it?</p>
                                    <button
                                        onClick={handleResend}
                                        disabled={resendStatus === 'sending'}
                                        className="text-sm font-bold text-slate-900 hover:underline disabled:opacity-50 transition-opacity"
                                    >
                                        {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
                                    </button>
                                    {resendStatus === 'error' && (
                                        <p className="text-xs text-rose-600 mt-2">{resendError}</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
