import { Zap } from 'lucide-react';

/**
 * MaintenanceView — shown to all non-admin users when maintenance_mode is active.
 * Intentionally renders without the standard Navbar / CartDrawer / Toaster so
 * there is no navigation surface to escape from.
 */
export default function MaintenanceView() {
  return (
    <div className="min-h-[100dvh] bg-gray-950 flex flex-col items-center px-6 py-6 sm:py-8 overflow-y-auto overflow-x-hidden relative">

      {/* ── Ambient background blobs ───────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-brand/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-violet-600/15 blur-[100px] animate-pulse [animation-delay:1.5s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-amber-500/10 blur-[80px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* ── Grid pattern overlay ────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Main card ──────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-lg text-center space-y-6 my-auto">

        {/* Logo badge */}
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-brand/40 blur-2xl scale-110 animate-pulse" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-brand to-violet-600 flex items-center justify-center shadow-2xl shadow-brand/30">
              <Zap className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Gear / wrench SVG illustration */}
        <div className="flex justify-center">
          <MaintenanceIllustration />
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            We'll be back{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-violet-400">
              shortly
            </span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto">
            SwiftCart is currently undergoing scheduled maintenance to improve
            your experience. We appreciate your patience and will be back online
            very soon.
          </p>
        </div>

        {/* Status pill */}
        <div className="inline-flex items-center gap-2.5 bg-gray-900/80 border border-gray-800 rounded-full px-5 py-2.5 backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-sm font-medium text-gray-300">
            Scheduled Maintenance In Progress
          </span>
        </div>

        {/* Footer text */}
        <p className="text-xs text-gray-600 mt-4">
          If you are an administrator,{' '}
          <a
            href="/admin/settings"
            className="text-gray-500 hover:text-gray-400 underline underline-offset-2 transition-colors"
          >
            sign in here
          </a>
          .
        </p>
      </div>
    </div>
  );
}

/* ─── Inline SVG illustration ─────────────────────────────────────────────── */
function MaintenanceIllustration() {
  return (
    <div className="relative w-56 h-48 mx-auto flex items-center justify-center mt-2">
      {/* Ambient glow behind box */}
      <div className="absolute inset-0 bg-brand/10 blur-[50px] rounded-full animate-pulse" />

      {/* Box bouncing */}
      <div className="relative z-10 animate-[bounce_4s_ease-in-out_infinite]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 120"
          className="w-40 h-auto drop-shadow-2xl"
          aria-hidden="true"
        >
          {/* Back flaps */}
          <path d="M20 40 L60 25 L90 40 L50 55 Z" fill="#9ca3af" />
          <path d="M80 30 L110 45 L90 55 L60 40 Z" fill="#d1d5db" />

          {/* Cube right face */}
          <path d="M60 65 L110 40 L110 90 L60 115 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
          {/* Cube left face */}
          <path d="M10 40 L60 65 L60 115 L10 90 Z" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />

          {/* Front flaps */}
          <path d="M10 40 L50 20 L75 35 L35 55 Z" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
          <path d="M60 65 L100 45 L115 65 L75 85 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />

          {/* Tape */}
          <path d="M55 55 L75 45 L70 95 L50 105 Z" fill="#fcd34d" opacity="0.8" />

          {/* Zap logo on left face */}
          <g transform="translate(25, 60) scale(0.6) skewY(26)">
            <circle cx="20" cy="20" r="16" fill="#0c831f" />
            <polygon points="21,11 13,22 20,22 18,30 27,19 20,19 22,11" fill="white" />
          </g>

          {/* Sparkles / Gears floating out of box */}
          <g className="animate-spin" style={{ transformOrigin: '50px 30px', animationDuration: '4s' }}>
            <circle cx="50" cy="30" r="8" fill="none" stroke="#0c831f" strokeWidth="2.5" strokeDasharray="4 2" />
          </g>
          <g className="animate-spin" style={{ transformOrigin: '70px 20px', animationDuration: '3s', animationDirection: 'reverse' }}>
            <circle cx="70" cy="20" r="5" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3 2" />
          </g>
        </svg>
      </div>

      {/* Shadow underneath */}
      <div className="absolute -bottom-2 w-32 h-6 bg-black/30 rounded-[100%] blur-md animate-[pulse_4s_ease-in-out_infinite]" />

      {/* Floating active elements */}
      <div className="absolute top-10 left-12 w-2.5 h-2.5 bg-brand rounded-full animate-ping" />
      <div className="absolute bottom-16 right-12 w-2 h-2 bg-violet-500 rounded-full animate-ping [animation-delay:1.5s]" />
      <div className="absolute top-20 right-8 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping [animation-delay:0.7s]" />
    </div>
  );
}
