"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

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
import { type SignUp } from "./page";
import { toast } from "@/components/ui/use-toast";
import { createGoogleAuthorizationURL } from "../../actions/auth.actions";
import { FaGoogle } from "react-icons/fa";

const signUpSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((arg) => arg.confirmPassword === arg.password, {
    message: "Password and confirm password should match",
    path: ["confirmPassword"],
  });

export type FormInput = z.infer<typeof signUpSchema>;

export function SignUpForm({
  signUp,
}: // redirectTo = "/app/home",
{
  signUp: SignUp;
  redirectTo?: string;
}) {
  const router = useRouter();

  const form = useForm<FormInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormInput) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    const res = await signUp(values);

    if (res.success) {
      toast({
        variant: "default",
        title: "Success",
        description: res.data.message,
        duration: 5000,
      });

      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create new account. ${res.error}`,
      });
    }
  }

  async function handleGoogleSignUp() {
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
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Your email" {...field} />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-semibold">
              Create an account
            </Button>
          </form>
        </Form>
        <div className="text-center text-muted-foreground t text-sm mt-2">
          or
        </div>
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={handleGoogleSignUp}
        >
          <FaGoogle className="w-4 h-4 mr-2" />
          Continue with google
        </Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
