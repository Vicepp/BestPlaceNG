import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Login</h1>
      <p className="mt-2 text-sm text-zinc-500">Log in to your BestPlaceNG account.</p>
      <LoginForm />
      <p className="mt-6 text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-brand">
          Create one
        </Link>
      </p>
    </div>
  );
}
