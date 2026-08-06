import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { forgotPassword } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    try {
      const res = await forgotPassword(values.email);
      toast.success(res.data?.message || "Check your email");
      if (res.data && "resetUrl" in (res.data as object)) {
        console.log("Reset URL:", (res.data as { resetUrl?: string }).resetUrl);
      }
    } catch {
      toast.error("Request failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-4xl text-neutral-900">Forgot password</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Enter your email and we will send a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full rounded-lg" disabled={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}
