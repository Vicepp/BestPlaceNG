"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cities } from "@/data/cities";
import type { ApartmentListing } from "@/data/apartments";
import { addFirestoreDocWithId, setFirestoreDoc } from "@/lib/firestoreWrite";
import { useAuth } from "@/context/AuthContext";
import { getPropertyById, type Property } from "@/data/properties";
import { getFirestoreDoc } from "@/lib/firestoreData";
import ImageUploader from "@/components/ImageUploader";
import { Info } from "lucide-react";

const TYPES: ApartmentListing["type"][] = ["Apartment", "House", "Duplex", "Land", "Self-Contain", "Shop/Office"];
const PERIODS: NonNullable<ApartmentListing["pricePeriod"]>[] = ["year", "month", "one-time"];

const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));

export default function AddApartmentForm() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyIdParam = searchParams.get("propertyId");
  const editId = searchParams.get("edit"); // editing an existing listing

  const [parentProperty, setParentProperty] = useState<Property | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [citySlug, setCitySlug] = useState(sortedCities[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ApartmentListing["type"]>("Apartment");
  const [purpose, setPurpose] = useState<ApartmentListing["purpose"]>("Rent");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [priceNaira, setPriceNaira] = useState("");
  const [pricePeriod, setPricePeriod] = useState<NonNullable<ApartmentListing["pricePeriod"]>>("year");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  // Nigerian fee structure
  const [cautionFee, setCautionFee] = useState("");
  const [agencyFee, setAgencyFee] = useState("");
  const [agreementFee, setAgreementFee] = useState("");
  const [legalFee, setLegalFee] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load parent property if propertyId is in URL
  useEffect(() => {
    if (!propertyIdParam) return;
    getPropertyById(propertyIdParam).then((p) => {
      if (p) {
        setParentProperty(p);
        setCitySlug(p.citySlug || citySlug);
        setArea(p.area);
        setFullAddress(p.fullAddress ?? "");
        if (p.images?.length) setImages(p.images);
        if (p.youtubeUrl) setYoutubeUrl(p.youtubeUrl);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyIdParam]);

  // Pre-fill form when editing an existing listing
  useEffect(() => {
    if (!editId) return;
    getFirestoreDoc<import("@/data/apartments").ApartmentListing>("apartments", editId).then((listing) => {
      if (!listing) return;
      setIsEditing(true);
      setTitle(listing.title);
      setCitySlug(listing.citySlug);
      setArea(listing.area);
      setFullAddress(listing.fullAddress ?? "");
      setType(listing.type);
      setPurpose(listing.purpose);
      setBedrooms(listing.bedrooms);
      setBathrooms(listing.bathrooms);
      setPriceNaira(String(listing.priceNaira));
      setPricePeriod(listing.pricePeriod ?? "year");
      setDescription(listing.description);
      setAmenities(listing.amenities?.join(", ") ?? "");
      setImages(listing.images ?? []);
      setYoutubeUrl(listing.youtubeUrl ?? "");
      setCautionFee(listing.cautionFee ? String(listing.cautionFee) : "");
      setAgencyFee(listing.agencyFee ? String(listing.agencyFee) : "");
      setAgreementFee(listing.agreementFee ? String(listing.agreementFee) : "");
      setLegalFee(listing.legalFee ? String(listing.legalFee) : "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const totalFirstYear =
    Number(priceNaira || 0) +
    Number(cautionFee || 0) +
    Number(agencyFee || 0) +
    Number(agreementFee || 0) +
    Number(legalFee || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = Number(priceNaira);
    if (!title.trim() || !area.trim() || !description.trim() || !price || price <= 0) {
      setError("Please fill in all required fields with a valid price.");
      return;
    }
    if (!user) { setError("You need to be logged in."); return; }
    setSubmitting(true);

    const cityData = cities.find((c) => c.slug === citySlug);

    const payload: Record<string, unknown> = {
      citySlug,
      title: title.trim(),
      type,
      purpose,
      bedrooms,
      bathrooms,
      priceNaira: price,
      pricePeriod,
      area: area.trim(),
      fullAddress: fullAddress.trim() || undefined,
      stateName: cityData?.stateName,
      description: description.trim(),
      amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
      images,
      youtubeUrl: youtubeUrl.trim() || undefined,
      cautionFee: cautionFee ? Number(cautionFee) : undefined,
      agencyFee: agencyFee ? Number(agencyFee) : undefined,
      agreementFee: agreementFee ? Number(agreementFee) : undefined,
      legalFee: legalFee ? Number(legalFee) : undefined,
    };

    let result;
    if (editId) {
      // Editing — patch only the editable fields (keep ownerId, createdAt, status unchanged)
      result = await setFirestoreDoc("apartments", editId, payload);
    } else {
      // New listing
      result = await addFirestoreDocWithId("apartments", {
        ...payload,
        ownerId: user.uid,
        ownerName: profile?.displayName ?? user.email ?? "",
        businessName: profile?.businessName,
        ownerContact: user.email ?? "",
        propertyId: propertyIdParam || undefined,
        propertyName: parentProperty?.name,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }
    setSubmitting(false);
    if (!result.ok) { setError(result.error); return; }
    setSuccess(true);
    setTimeout(() => {
      if (editId) router.push("/dashboard/properties");
      else if (propertyIdParam) router.push(`/dashboard/buildings/${propertyIdParam}`);
      else router.push(`/city/${citySlug}/apartments`);
    }, 1200);
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-green-700">Listing published!</p>
        <p className="mt-1 text-xs text-green-600">It may take a few minutes to appear publicly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      {/* Parent property banner */}
      {parentProperty && (
        <div className="flex items-center gap-3 rounded-xl bg-brand-light px-4 py-2.5 text-sm text-brand-dark">
          <Info className="h-4 w-4 shrink-0" />
          <span>Adding a unit to <strong>{parentProperty.name}</strong></span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">City *</label>
          <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} disabled={!!parentProperty}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand disabled:bg-zinc-50">
            {sortedCities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.stateName}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Area / Neighbourhood *</label>
          <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lekki Phase 1"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Unit title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 3 Bedroom Flat — Unit 5A"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Full address (private — revealed after payment)</label>
        <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)}
          placeholder="e.g. 14B Palm Avenue, Lekki Phase 1"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as ApartmentListing["type"])}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Purpose</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value as ApartmentListing["purpose"])}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="Rent">Rent</option>
            <option value="Sale">Sale</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Bedrooms</label>
          <input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Bathrooms</label>
          <input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Rent / Price (₦) *</label>
          <input type="number" min={0} value={priceNaira} onChange={(e) => setPriceNaira(e.target.value)}
            placeholder="e.g. 4500000"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Period</label>
          <select value={pricePeriod} onChange={(e) => setPricePeriod(e.target.value as NonNullable<ApartmentListing["pricePeriod"]>)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand">
            {PERIODS.map((p) => <option key={p} value={p}>{p === "one-time" ? "One-time (sale)" : `Per ${p}`}</option>)}
          </select>
        </div>
      </div>

      {/* Nigerian fee structure */}
      <div className="rounded-xl bg-zinc-50 p-4 space-y-3">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
          First-year fees (optional) — year 2+ charges actual rent only
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Caution Fee (₦)</label>
            <input type="number" value={cautionFee} onChange={(e) => setCautionFee(e.target.value)}
              placeholder="Refundable deposit" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Agency Fee (₦)</label>
            <input type="number" value={agencyFee} onChange={(e) => setAgencyFee(e.target.value)}
              placeholder="Agent commission" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Agreement Fee (₦)</label>
            <input type="number" value={agreementFee} onChange={(e) => setAgreementFee(e.target.value)}
              placeholder="Documentation fee" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold text-zinc-400">Legal Fee (₦)</label>
            <input type="number" value={legalFee} onChange={(e) => setLegalFee(e.target.value)}
              placeholder="Lawyer / notary" className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        </div>
        {totalFirstYear > 0 && (
          <p className="text-xs font-semibold text-brand-dark">
            First-year total: ₦{totalFirstYear.toLocaleString()} · Subsequent years: ₦{Number(priceNaira || 0).toLocaleString()}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Description *</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
          placeholder="Describe the unit, facilities, surroundings..."
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">Amenities (comma-separated)</label>
        <input value={amenities} onChange={(e) => setAmenities(e.target.value)}
          placeholder="e.g. 24/7 Security, Backup Generator, Parking"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      <ImageUploader
        existingUrls={images}
        onChange={setImages}
        storagePath={`apartments/${user?.uid ?? "anon"}/${Date.now()}`}
        label="Property photos (shown on listing)"
        maxImages={10}
      />

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-500">YouTube video link (optional)</label>
        <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
        {submitting ? (isEditing ? "Saving…" : "Publishing…") : (isEditing ? "Save Changes" : "Publish Listing")}
      </button>
    </form>
  );
}
