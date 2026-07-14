import { listEvents, listCountries } from "@/lib/repos";
import { HomeView } from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePageRoute() {
  const [events, countries] = await Promise.all([
    listEvents({ publicOnly: true }),
    listCountries(),
  ]);
  return <HomeView events={events} countries={countries} />;
}
