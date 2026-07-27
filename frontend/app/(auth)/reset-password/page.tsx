import { AuthForm } from "@/components/auth-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ update?: string }> }) {
  const { update } = await searchParams;
  return <AuthForm mode={update === "true" ? "update" : "reset"} />;
}
