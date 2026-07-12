import { listEvents, listCountries } from "@/lib/repos";
import { OverviewView } from "@/components/OverviewView";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);
  return <OverviewView events={events} countries={countries} />;
}
