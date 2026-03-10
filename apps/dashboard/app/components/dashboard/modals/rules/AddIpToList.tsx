import { Form, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { ModalShell, FormActions, inputCls, labelCls, sectionLabelCls } from "../../ui/shared";

export function AddIpToList({ zoneId, onClose, isSubmitting, zones, accounts, config }: {
    zoneId: string;
    onClose: () => void;
    isSubmitting: boolean;
    zones: any[];
    accounts: any[];
    config: any;
}) {
    const fetcher = useFetcher();
    const [discoveredLists, setDiscoveredLists] = useState<any[]>([]);

    const [selectedListId, setSelectedListId] = useState("");

    useEffect(() => {
        const zone = zones.find(z => z.id === zoneId);
        if (zone) {
            const formData = new FormData();
            formData.append("accountRef", zone.cfAccountRef);
            formData.append("type", "lists");
            fetcher.submit(formData, { method: "post", action: "/api/cloudflare" });
        }
    }, [zoneId]);

    useEffect(() => {
        if (fetcher.data && Array.isArray(fetcher.data)) {
            setDiscoveredLists(fetcher.data);
        }
    }, [fetcher.data]);

    const selectedListName = discoveredLists.find(l => l.id === selectedListId)?.name || "";

    return (
        <ModalShell
            onClose={onClose}
            iconBg="bg-emerald-100"
            title={`Add Rule: ${config.name}`}
            subtitle={config.description}
            icon={config.icon}
        >
            <Form method="post" className="px-6 py-5 space-y-5">
                <input type="hidden" name="intent" value="add_rule" />
                <input type="hidden" name="ruleType" value={config.type} />
                <input type="hidden" name="zoneConfigId" value={zoneId} />
                <input type="hidden" name="cfListName" value={selectedListName} />

                <div className="bg-gray-50/50 border border-gray-100 rounded-md p-4 transition-all hover:bg-white hover:shadow-sm">
                    <p className={sectionLabelCls}>Identity</p>
                    <div>
                        <label className={labelCls}>Rule Name <span className="text-rose-500">*</span></label>
                        <input type="text" name="name" placeholder='e.g. "API Rate Limiting"' required className={inputCls} />
                        <p className="mt-1 text-[10px] text-slate-500 font-medium">Internal name for this rule in FlareStack.</p>
                    </div>
                </div>

                <div className="bg-gray-50/50 border border-gray-100 rounded-md p-4 transition-all hover:bg-white hover:shadow-sm">
                    <p className={sectionLabelCls}>Target list</p>
                    <div className="space-y-3">
                        <div>
                            <label className={labelCls}>Select CF IP List <span className="text-rose-500">*</span></label>
                            <select
                                name="cfListId"
                                required
                                className={inputCls}
                                disabled={fetcher.state === "submitting"}
                                value={selectedListId}
                                onChange={(e) => setSelectedListId(e.target.value)}
                            >
                                <option value="">{fetcher.state === "submitting" ? "Discovering lists..." : discoveredLists.length > 0 ? "Select list..." : "No lists found"}</option>
                                {discoveredLists.map((l: any) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} ({l.kind}: {l.id.slice(0, 8)}…)
                                    </option>
                                ))}
                            </select>
                            {discoveredLists.length === 0 && fetcher.state !== "submitting" && (
                                <p className="mt-1 text-[10px] text-rose-500 font-medium italic select-none">No IP lists found. Go to CF → Manage Account → Lists to create one.</p>
                            )}
                            <p className="mt-1.5 text-xs text-black font-medium opacity-80">
                                Flagged IPs will be added here. Your WAF rule must reference this list to enforce blocking.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50/50 border border-gray-100 rounded-md p-4 transition-all hover:bg-white hover:shadow-sm">
                    <p className={sectionLabelCls}>Detection thresholds</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Threshold (requests)</label>
                            <input type="number" name="rateLimitThreshold" defaultValue={10000} min={100} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Window (seconds)</label>
                            <input type="number" name="windowSeconds" defaultValue={300} min={60} className={inputCls} />
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-black font-medium opacity-80 pb-1">
                        IPs exceeding the threshold within the window get added to the list. <br />
                        <span className="italic">Note:</span> This window also determines how often this rule checks for abuse (e.g., a 300s window means it runs every 5 minutes).
                    </p>
                </div>

                <FormActions onClose={onClose} isSubmitting={isSubmitting} submitLabel="Add Rule" />
            </Form>
        </ModalShell>
    );
}
