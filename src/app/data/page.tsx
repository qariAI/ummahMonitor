import { listEvents, listCountries } from "@/lib/repos";
import { DataIntelligenceView } from "@/components/DataIntelligenceView";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);
  return <DataIntelligenceView initialEvents={events} countries={countries} />;
}
