import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import * as argon2 from "argon2";

import db from "@/lib/db";
import { emailVerificationTable, userTable } from "@/lib/db/schema";
import { lucia, validateRequest } from "@/lib/auth";
import { FormInput, SignUpForm } from "./sign-up-form";
import { resend } from "@/lib/email";

export type SignUp = ({ email, password, name }: FormInput) => Promise<
  | {
      success: true;
      data: {
        userId: string;
        message: string;
      };
    }
  | { success: false; error: string }
>;

export default async function SignUp() {
  const { user } = await validateRequest();

  const signUp: SignUp = async ({ email, password, name }) => {
    "use server";

    const hashedPassword = await new Argon2id().hash(password);
    const userId = generateId(15);

    try {
      await db
        .insert(userTable)
        .values({
          id: userId,
          name,
          email,
          hashedPassword,
        })
        .returning({
          id: userTable.id,
          name: userTable.name,
        });

      // Generate a random string 6 characters long
      const code = Math.random().toString(36).substring(2, 8);

      await db
        .insert(emailVerificationTable)
        .values({ id: generateId(15), userId, code, sentAt: new Date() });

      const token = jwt.sign({ userId, email, code }, process.env.JWT_SECRET!, {
        expiresIn: "5m",
      });

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
        data: { userId, message: `Check your email for verification!` },
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

  if (user) {
    return redirect("/app/home");
  }

  return (
    // <div className="flex items-center justify-center">
    <SignUpForm signUp={signUp} />
    // </div>
  );
}
