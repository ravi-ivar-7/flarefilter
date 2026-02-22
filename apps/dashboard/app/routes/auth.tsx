import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authClient } from '~/lib/auth-client';
import type { Route } from './+types/auth';

export const meta: Route.MetaFunction = () => [
    { title: "Sign In - FlareFilter" },
    { name: "description", content: "Sign in to your FlareFilter dashboard to manage Cloudflare zones, configure blocking rules, and monitor IP activity." },
];



export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "register");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const callback = {
            onSuccess: () => {
                navigate('/dashboard');
            },
            onError: (ctx: any) => {
                setError(ctx.error.message || 'Authentication failed');
                setLoading(false);
            }
        };

        if (isSignUp) {
            await authClient.signUp.email({ email, password, name: name || 'Admin' }, callback);
        } else {
            await authClient.signIn.email({ email, password }, callback);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 overflow-hidden relative selection:bg-indigo-500/30">
            <div className="absolute top-[-10%] inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-200/50 via-gray-50 to-gray-50 -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-[10%] left-[10%] w-[25rem] h-[25rem] bg-violet-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md relative">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500/20 to-white/5 rounded-2xl z-0" />
                <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-8 z-10">

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 space-y-1 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 ring-1 ring-gray-900/5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">FlareFilter</h1>
                        <p className="text-sm text-gray-600 mt-2">{isSignUp ? 'Create your admin account' : 'Sign in to manage your Edge defenses'}</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleAuth}>
                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl mb-4 text-center">
                                {error}
                            </div>
                        )}

                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Admin User"
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 ml-1">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@company.com"
                                required
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <a href="#" className="text-xs text-indigo-600 hover:text-indigo-500 transition-colors">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-full bg-gray-900 text-white font-semibold rounded-xl px-4 py-3 hover:bg-gray-800 transition-all duration-300 active:scale-[0.98] shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Authenticating...
                                </>
                            ) : (isSignUp ? "Create Account" : "Sign In to Dashboard")}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        {isSignUp ? "Already have an account?" : "Need an account?"} <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 hover:text-indigo-500 font-medium underline transition-colors">{isSignUp ? "Sign In" : "Sign Up"}</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
