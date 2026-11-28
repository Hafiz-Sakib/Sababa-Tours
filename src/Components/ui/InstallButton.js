import { FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";
import { useInstall } from "../../pwa";

/* "Install app" button. Shows only where it can work:
   - Chrome / Edge / Android: real install prompt
   - iPhone / iPad Safari: short "Add to Home Screen" hint
   - already installed / unsupported browser: renders nothing */
export default function InstallButton({ compact = false, small = false, className = "" }) {
  const { canPrompt, iosHint, prompt } = useInstall();
  if (!canPrompt && !iosHint) return null;

  const click = async () => {
    if (canPrompt) {
      const ok = await prompt();
      if (ok) toast.success("Sababa Tours installed!");
    } else {
      toast("Tap the Share icon, then “Add to Home Screen”.", { duration: 6000 });
    }
  };

  return (
    <button
      type="button"
      onClick={click}
      aria-label="Install Sababa Tours app"
      title="Install app"
      className={
        compact
          ? `flex ${small ? "h-9 w-9 rounded-xl" : "h-10 w-10 rounded-[14px]"} shrink-0 items-center justify-center border border-line bg-sandy text-brand-ink transition hover:bg-line/60 ${className}`
          : `flex w-full items-center justify-center gap-3 rounded-3xl border border-line bg-sandy py-4 font-semibold text-ink transition hover:bg-line/60 ${className}`
      }
    >
      <FiDownload size={compact ? 18 : 18} />
      {!compact && "Install app"}
    </button>
  );
}
