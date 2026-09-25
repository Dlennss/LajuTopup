import { getAppServerSession } from "@/lib/server-auth";
import { getUserProfile } from "@/lib/api.auth";
import type { UserSession } from "@/components/user/types";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import { LajuTopupHomeScreen } from "@/components/user/LajuTopupHomeScreen";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function UserAppHomePage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  const profile = session?.backendToken ? await getUserProfile(session.backendToken) : null;

  return (
    <>
      {session?.backendToken ? <UserAuthClientSync backendToken={session.backendToken} /> : null}
      <LajuTopupHomeScreen user={session?.user || null} profile={profile} />
      <UserBottomNav />
    </>
  );
}
