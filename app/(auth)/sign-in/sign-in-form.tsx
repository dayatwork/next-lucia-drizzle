"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCountdown } from "usehooks-ts";

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
import { ResendToken, SignIn } from "./page";
import { createGoogleAuthorizationURL } from "../../actions/auth.actions";
import { FaGoogle } from "react-icons/fa";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Required"),
});

export type FormInput = z.infer<typeof signInSchema>;

export function SignInForm({
  signIn,
  resendToken,
  redirectTo = "/app/home",
}: {
  signIn: SignIn;
  resendToken: ResendToken;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [showResendEmail, setShowResendEmail] = useState(false);

  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 60,
      intervalMs: 1000,
    });

  useEffect(() => {
    if (count === 0) {
      stopCountdown();
      resetCountdown();
    }
  }, [count, stopCountdown, resetCountdown]);

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
      if (res.errorKey === "email-not-verified") {
        setShowResendEmail(true);
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
  }

  async function handleResendVerificationEmail() {
    const res = await resendToken(form.getValues("email"));
    if (res.success) {
      startCountdown();

      toast({
        variant: "default",
        title: "Email sent",
        description: res.message,
      });
      // setShowResendEmail(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: res.error });
    }
  }

  async function handleGoogleSignIn() {
    const res = await createGoogleAuthorizationURL();
    if (!res.success) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else if (res.success && res.data) {
      window.location.href = res.data.toString();
    }
  }

  return (
    <Card className="mx-auto max-w-sm w-full rounded-2xl">
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
              className="w-full font-semibold"
              disabled={form.formState.isSubmitting}
            >
              Login
            </Button>
          </form>
        </Form>
        {showResendEmail && (
          <div className="flex flex-col items-center gap-1  mt-4">
            <p
              role="alert"
              className="text-red-600 text-sm font-semibold bg-red-200 w-full text-center rounded py-1"
            >
              Email not verified!
            </p>
            <Button
              variant="link"
              className="w-full"
              onClick={handleResendVerificationEmail}
              disabled={count > 0 && count < 60}
            >
              Resend verfication email {count !== 60 && count}
            </Button>
          </div>
        )}
        <div className="text-center text-muted-foreground t text-sm mt-2">
          or
        </div>
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={handleGoogleSignIn}
        >
          <FaGoogle className="w-4 h-4 mr-2" />
          Continue with google
        </Button>
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
