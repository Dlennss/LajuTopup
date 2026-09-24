export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[#612f27] text-slate-950">
      {children}
    </div>
  );
}
