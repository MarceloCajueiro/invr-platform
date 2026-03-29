import { BrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <BrandPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 bg-bg-light">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
