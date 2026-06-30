import { notFound } from "next/navigation";
import { getCityBySlug } from "@/data/cities";
import CitySectionContent from "@/components/CitySectionContent";

export default async function CityOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  return <CitySectionContent city={city} section="overview" />;
}
