import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHead } from "@/components/seo/page-head";
import { resetPassword } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const token =
    typeof router.query.token === "string" ? router.query.token : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    if (!token) {
      toast.error("Missing reset token");
      return;
    }
    try {
      await resetPassword(token, values.password);
      toast.success("Password updated");
      router.push("/login");
    } catch {
      toast.error("Reset failed");
    }
  }

  return (
    <>
      <PageHead title="Reset password" />
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
        <h1 className="font-display text-4xl text-neutral-900">Reset password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" {...register("confirm")} />
            {errors.confirm && (
              <p className="text-xs text-red-500">{errors.confirm.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full rounded-lg" disabled={isSubmitting}>
            Update password
          </Button>
        </form>
      </div>
    </>
  );
}
