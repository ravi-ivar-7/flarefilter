export function Footer() {
    return (
        <footer className="px-6 py-6 border-t border-slate-200 bg-white mt-auto w-full relative z-10">
            <div className="max-w-[1280px] mx-auto flex flex-col items-center justify-center gap-4 text-xs font-medium text-slate-500 sm:flex-row sm:justify-between">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                    <a href="/support" className="hover:text-slate-900 hover:underline underline-offset-4 transition-all">Support</a>
                    <a href="https://status.flarefilter.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 hover:underline underline-offset-4 transition-all">System Status</a>
                    <a href="mailto:security@flarefilter.com" className="hover:text-slate-900 hover:underline underline-offset-4 transition-all">Report Issues</a>
                    <a href="/privacy" className="hover:text-slate-900 hover:underline underline-offset-4 transition-all">Privacy Policy</a>
                </div>
                <span className="text-center sm:text-right">© {new Date().getFullYear()} FlareFilter, Inc.</span>
            </div>
        </footer>
    );
}
