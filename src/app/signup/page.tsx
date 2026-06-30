import SignupForm from "@/components/SignupForm";
import type { UserRole } from "@/context/AuthContext";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const initialRole: UserRole = role === "landlord" ? "landlord" : role === "business" ? "business" : "tenant";

  const heading =
    initialRole === "landlord" ? "List Your Property" : initialRole === "business" ? "Add Your Business" : "Create Account";
  const sub =
    initialRole === "landlord"
      ? "Create a landlord/agent account to post apartments and connect directly with tenants."
      : initialRole === "business"
      ? "Create a business account to add your listing to a city's directory."
      : "Tenant accounts let you save searches and leave reviews.";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
      <p className="mt-2 text-sm text-zinc-500">{sub}</p>
      <SignupForm initialRole={initialRole} />
    </div>
  );
}
