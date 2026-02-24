import { useState } from "react";
import { inputCls, labelCls } from "../ui/shared";

export function InviteMemberModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-black">Invite Member</h2>
                            <p className="text-xs text-black font-medium opacity-80">Add someone to your organization</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {submitted ? (
                        <div className="py-8 flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Invitation queued</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    <span className="font-medium text-gray-700">{email}</span> will be invited as{" "}
                                    <span className="font-medium text-gray-700 capitalize">{role}</span> once email delivery is enabled.
                                </p>
                            </div>
                            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 w-full text-left">
                                ⚠️ Backend invitation not yet implemented — will be wired in a future update.
                            </div>
                            <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors">
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                            <div>
                                <label className={labelCls}>Email address <span className="text-rose-500">*</span></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    required
                                    autoFocus
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Role</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: "member", label: "Member", desc: "View & configure" },
                                        { value: "admin", label: "Admin", desc: "Manage members" },
                                        { value: "owner", label: "Owner", desc: "Full access" },
                                    ].map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            onClick={() => setRole(r.value)}
                                            className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${role === r.value
                                                ? "border-violet-400 bg-violet-50 ring-2 ring-violet-500/20"
                                                : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                                }`}
                                        >
                                            <span className={`text-sm font-bold ${role === r.value ? "text-violet-700" : "text-black"}`}>
                                                {r.label}
                                            </span>
                                            <span className="text-xs text-black font-medium opacity-70 mt-0.5 leading-tight">{r.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={!email} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                    Send Invite
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
