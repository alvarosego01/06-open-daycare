export default function AuthLayout({ children }: LayoutProps<"/(auth)">) {
  return (
    <div className="min-h-screen bg-[#FBF4EC]">
      {children}
    </div>
  );
}
