import { listEvents, listCountries } from "@/lib/repos";
import { BroadcastView } from "@/components/BroadcastView";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);
  return <BroadcastView initialEvents={events} countries={countries} />;
}
