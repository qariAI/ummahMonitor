import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { listEvents, listCountries } from "@/lib/repos";
import { MapView } from "@/components/MapView";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user?.onboarded) {
    const store = await cookies();
    if (store.get("um_onboard_seen")?.value !== "1") redirect("/onboarding");
  }

  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);
  return (
    <Suspense fallback={null}>
      <MapView initialEvents={events} countries={countries} />
    </Suspense>
  );
}
