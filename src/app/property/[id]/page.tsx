import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Building2, Home, Play } from "lucide-react";
import { getPropertyById, extractYouTubeId, type Property } from "@/data/properties";
import { getApartmentsByPropertyLive, formatNaira } from "@/data/apartments";
import RentThisButton from "@/components/RentThisButton";
import MessageLandlordButton from "@/components/MessageLandlordButton";

export default async function PublicPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const units = await getApartmentsByPropertyLive(id);
  const activeUnits = units.filter((u) => !u.status || u.status === "active");
  const ytId = extractYouTubeId(property.youtubeUrl ?? "");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/apartments" className="mb-2 block text-xs font-semibold text-brand">← Apartments & Properties</Link>
        <h1 className="text-3xl font-extrabold text-foreground">{property.name}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-zinc-500">
          <MapPin className="h-4 w-4" /> {property.area}, {property.city} · {property.stateName} State
        </p>
        {property.businessName && (
          <p className="mt-1 text-sm font-semibold text-brand">{property.businessName}</p>
        )}
      </div>

      {/* Media — images grid + optional YouTube */}
      {(property.images?.length || ytId) && (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {property.images?.slice(0, 3).map((url, i) => (
            <div key={i} className={`overflow-hidden rounded-2xl bg-zinc-100 ${i === 0 ? "sm:col-span-2 row-span-2" : ""}`}>
              <img src={url} alt="" className="h-full w-full object-cover" style={{ maxHeight: i === 0 ? 360 : 180 }} />
            </div>
          ))}
          {ytId && (
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
              <img
                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                alt="Video tour"
                className="h-full w-full object-cover opacity-80"
                style={{ maxHeight: 180 }}
              />
              <a
                href={property.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center gap-2 text-white"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg">
                  <Play className="h-6 w-6 fill-white" />
                </div>
              </a>
              {/* Embedded iframe on click would require JS — link to YouTube for SSR simplicity */}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className="mb-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-foreground">About this property</h2>
          <p className="text-sm leading-relaxed text-zinc-600">{property.description}</p>
        </div>
      )}

      {/* Available units */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          Available Units ({activeUnits.length})
        </h2>
        {activeUnits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
            <Home className="mx-auto mb-2 h-8 w-8 text-zinc-200" />
            <p className="text-sm font-medium text-foreground">No units currently available</p>
            <p className="mt-1 text-xs text-zinc-400">All units in this property are currently occupied.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeUnits.map((unit) => (
              <div key={unit.id} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
                {unit.images?.[0] && (
                  <img src={unit.images[0]} alt={unit.title} className="h-40 w-full object-cover" />
                )}
                <div className="flex flex-col gap-2 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                      {unit.type} · For {unit.purpose}
                    </p>
                    <h3 className="mt-0.5 text-base font-bold text-foreground">{unit.title}</h3>
                    <p className="text-xs text-zinc-500">
                      {unit.bedrooms > 0 && `${unit.bedrooms} bed · `}
                      {unit.bathrooms > 0 && `${unit.bathrooms} bath`}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-brand-dark">
                    {formatNaira(unit.priceNaira)}
                    {unit.pricePeriod === "year" && <span className="text-xs font-normal text-zinc-400">/year</span>}
                    {unit.pricePeriod === "month" && <span className="text-xs font-normal text-zinc-400">/month</span>}
                  </p>
                  {/* Nigerian fee breakdown for first year */}
                  {(unit.cautionFee || unit.agencyFee || unit.agreementFee || unit.legalFee) && (
                    <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500 space-y-0.5">
                      <p className="font-semibold text-zinc-600 mb-1">First-year breakdown</p>
                      {unit.cautionFee ? <p>Caution: {formatNaira(unit.cautionFee)}</p> : null}
                      {unit.agencyFee  ? <p>Agency:  {formatNaira(unit.agencyFee)}</p> : null}
                      {unit.agreementFee ? <p>Agreement: {formatNaira(unit.agreementFee)}</p> : null}
                      {unit.legalFee  ? <p>Legal:   {formatNaira(unit.legalFee)}</p> : null}
                      <p className="mt-1 font-semibold text-foreground border-t border-zinc-200 pt-1">
                        Total year 1: {formatNaira(
                          unit.priceNaira + (unit.cautionFee ?? 0) + (unit.agencyFee ?? 0) + (unit.agreementFee ?? 0) + (unit.legalFee ?? 0)
                        )}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <RentThisButton listing={unit} />
                    <MessageLandlordButton listing={unit} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
