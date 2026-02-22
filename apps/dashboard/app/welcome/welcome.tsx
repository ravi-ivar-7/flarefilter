import { Logo } from "~/components/Logo";

/**
 * Generic welcome/landing component.
 * Not the main landing page (that's routes/home.tsx) —
 * this is used internally if ever needed as a standalone embed.
 */
export function Welcome() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <Logo variant="full" bg="none" size={72} animate />
        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
          Automated Cloudflare IP protection — real-time threat detection and blocking at the edge.
        </p>
      </div>
    </main>
  );
}
