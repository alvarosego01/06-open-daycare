import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import StaffSidebar from "@/components/staff/StaffSidebar";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || (userData.role !== "staff" && userData.role !== "admin")) {
    redirect("/family/feed");
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <StaffSidebar />
      {children}
    </div>
  );
}
