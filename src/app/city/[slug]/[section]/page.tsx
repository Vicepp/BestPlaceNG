import { notFound } from "next/navigation";
import { getCityBySlug } from "@/data/cities";
import { citySections } from "@/data/citySections";
import CitySectionContent from "@/components/CitySectionContent";

export default async function CitySectionPage({
  params,
}: {
  params: Promise<{ slug: string; section: string }>;
}) {
  const { slug, section } = await params;
  const city = getCityBySlug(slug);
  const validSection = citySections.some((s) => s.slug === section);
  if (!city || !validSection) notFound();

  return <CitySectionContent city={city} section={section} />;
}
