import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Argon2id } from "oslo/password";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

import db from "@/lib/db";
import { lucia, validateRequest } from "@/lib/auth";
import { emailVerificationTable } from "@/lib/db/schema";
import { FormInput, SignInForm } from "./sign-in-form";
import { resend } from "@/lib/email";

export type SignIn = ({ email, password }: FormInput) => Promise<
  | {
      success: true;
      data: {
        userId: string;
      };
    }
  | { success: false; error: string; errorKey?: string }
>;

export type ResendToken = (
  email: string
) => Promise<
  { success: true; message: string } | { success: false; error: string }
>;

export default async function SignIn() {
  const { user } = await validateRequest();

  const signIn: SignIn = async ({ email, password }) => {
    "use server";
    try {
      const foundUser = await db.query.userTable.findFirst({
        where: (table) => eq(table.email, email),
      });

      if (!foundUser) {
        return {
          success: false,
          data: null,
          error: `User not found`,
        };
      }

      if (!foundUser.hashedPassword) {
        return {
          success: false,
          data: null,
          error: `Invalid credentials`,
        };
      }

      if (!foundUser.isEmailVerified) {
        return {
          success: false,
          data: null,
          error: "Email not verified",
          errorKey: "email-not-verified",
        };
      }

      const isValidPassword = await new Argon2id().verify(
        foundUser.hashedPassword,
        password
      );

      if (!isValidPassword) {
        return {
          success: false,
          data: null,
          error: `Invalid credentials`,
        };
      }

      const session = await lucia.createSession(foundUser.id, {
        expiresIn: 60 * 60 * 24 * 7,
      });

      const sessionCookie = lucia.createSessionCookie(session.id);

      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );

      return {
        success: true,
        data: { userId: foundUser.id },
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: `${error.message}`,
      };
    }
  };

  const resendToken: ResendToken = async (email) => {
    "use server";
    try {
      const foundUser = await db.query.userTable.findFirst({
        where: (table) => eq(table.email, email),
      });

      if (!foundUser) {
        return {
          success: false,
          data: null,
          error: `User not found`,
        };
      }

      if (foundUser.isEmailVerified) {
        return {
          success: false,
          data: null,
          error: `Email already verified`,
        };
      }

      // Generate a random string 6 characters long
      const code = Math.random().toString(36).substring(2, 8);

      await db
        .update(emailVerificationTable)
        .set({ code, sentAt: new Date() })
        .where(eq(emailVerificationTable.userId, foundUser.id));

      const token = jwt.sign(
        { userId: foundUser.id, email, code },
        process.env.JWT_SECRET!,
        {
          expiresIn: "5m",
        }
      );

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}`;

      const { error } = await resend.emails.send({
        from: "INAHEF <onboarding@resend.dev>",
        to: [email],
        subject: "Account Verification",
        text: url,
      });

      if (error) {
        return {
          success: false,
          data: null,
          error: `${error.message}`,
        };
      }

      return {
        success: true,
        message: "A verification email has been sent to your email",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `${error.message}`,
      };
    }
  };

  if (user) {
    return redirect("/app/home");
  }

  return (
    // <div className="flex items-center justify-center">
    <SignInForm signIn={signIn} resendToken={resendToken} />
    // </div>
  );
}
