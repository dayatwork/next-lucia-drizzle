import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "../actions/auth.actions";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div>
      <header>
        <form action={signOut}>
          <Button type="submit">Sign Out</Button>
        </form>
      </header>
      {children}
    </div>
  );
}
