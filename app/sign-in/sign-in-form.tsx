"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { SignIn } from "./page";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Required"),
});

export type FormInput = z.infer<typeof signInSchema>;

export function SignInForm({
  signIn,
  redirectTo = "/app/home",
}: {
  signIn: SignIn;
  redirectTo?: string;
}) {
  const router = useRouter();

  const form = useForm<FormInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: FormInput) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    const res = await signIn(values);

    if (res.success) {
      toast({
        variant: "default",
        title: "Success",
        description: `you are logged in!`,
      });

      router.push(redirectTo);
    } else {
      form.setError("email", { message: res.error });
      form.setError("password", { message: res.error });
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to login. ${res.error}`,
      });
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Your email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              Login
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {"Don't have an account? "}
          <Link href="/sign-up" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
