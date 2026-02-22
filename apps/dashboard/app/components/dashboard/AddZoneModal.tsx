import { Form, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { ModalShell, FormActions, inputCls, monoCls, labelCls, sectionLabelCls } from "./shared";

export function AddZoneModal({ onClose, isSubmitting, accounts }: {
    onClose: () => void;
    isSubmitting: boolean;
    accounts: any[];
}) {
    const fetcher = useFetcher();
    const [selectedAccount, setSelectedAccount] = useState("");
    const [discoveredZones, setDiscoveredZones] = useState<any[]>([]);

    useEffect(() => {
        if (selectedAccount) {
            const formData = new FormData();
            formData.append("accountRef", selectedAccount);
            formData.append("type", "zones");
            fetcher.submit(formData, { method: "post", action: "/api/cloudflare" });
        } else {
            setDiscoveredZones([]);
        }
    }, [selectedAccount]);

    useEffect(() => {
        if (fetcher.data && Array.isArray(fetcher.data)) {
            setDiscoveredZones(fetcher.data);
        }
    }, [fetcher.data]);

    return (
        <ModalShell
            onClose={onClose}
            iconBg="bg-indigo-100"
            title="Add Zone"
            subtitle="Which domain's traffic to monitor"
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
            }
        >
            <Form method="post" className="px-6 py-5 space-y-5">
                <input type="hidden" name="intent" value="add_zone" />

                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-5 transition-all hover:bg-white hover:shadow-sm">
                    <p className={sectionLabelCls}>Zone Identity</p>
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Website Name <span className="text-rose-500">*</span></label>
                            <input type="text" name="name" placeholder='e.g. "My Production Site"' required className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Cloudflare Account <span className="text-rose-500">*</span></label>
                            <select
                                name="cfAccountRef"
                                required
                                className={inputCls}
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                            >
                                <option value="">Select account…</option>
                                {accounts.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.label} ({a.cfAccountId.slice(0, 8)}…)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Select Domain (Zone ID) <span className="text-rose-500">*</span></label>
                            <select name="cfZoneId" required className={inputCls} disabled={!selectedAccount || fetcher.state === "submitting"}>
                                <option value="">{fetcher.state === "submitting" ? "Discovering zones..." : discoveredZones.length > 0 ? "Select domain..." : "Pick an account first"}</option>
                                {discoveredZones.map((z: any) => (
                                    <option key={z.id} value={z.id}>
                                        {z.name} ({z.id.slice(0, 8)}…)
                                    </option>
                                ))}
                            </select>
                            {discoveredZones.length === 0 && selectedAccount && fetcher.state !== "submitting" && (
                                <p className="mt-1 text-[10px] text-rose-500 font-bold italic select-none uppercase tracking-tight">No zones found. Check token permissions.</p>
                            )}
                        </div>
                        <div>
                            <label className={labelCls}>Poll interval (minutes)</label>
                            <input type="number" name="pollingIntervalMinutes" defaultValue={5} min={1} max={60} className={inputCls} />
                            <p className="mt-1.5 text-xs text-black font-medium opacity-80">How often the worker queries CF Analytics for this zone.</p>
                        </div>
                    </div>
                </div>

                <FormActions onClose={onClose} isSubmitting={isSubmitting} submitLabel="Add Zone" />
            </Form>
        </ModalShell>
    );
}
