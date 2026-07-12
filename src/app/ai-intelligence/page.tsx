import { listEvents, listCountries } from "@/lib/repos";
import { AiIntelligenceView } from "@/components/AiIntelligenceView";

export const dynamic = "force-dynamic";

export default async function AiIntelligencePage() {
  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);
  return <AiIntelligenceView events={events} countries={countries} />;
}
