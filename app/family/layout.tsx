import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import FamilySidebar from "@/components/family/FamilySidebar";

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
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

  if (!userData || userData.role !== "parent") {
    redirect("/staff/feed");
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <FamilySidebar />
      {children}
    </div>
  );
}
