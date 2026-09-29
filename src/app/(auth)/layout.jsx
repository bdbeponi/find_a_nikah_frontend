import Logo from "@/components/shared/Logo";
import { info } from "@/config/info";

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <Logo />
          <p className="text-sm text-dark_gray">{info.panelName}</p>
        </div>
        <div className="card p-6 sm:p-8">{children}</div>
        <p className="text-center text-xs text-dark_gray">
          Locked out? {info.supportEmail}
        </p>
      </div>
    </div>
  );
}
