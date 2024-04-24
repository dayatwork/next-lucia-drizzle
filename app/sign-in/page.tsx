import { Argon2id } from "oslo/password";

import db from "@/lib/db";
import { FormInput, SignInForm } from "./sign-in-form";
import { eq } from "drizzle-orm";
import { lucia, validateRequest } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SignIn = ({ email, password }: FormInput) => Promise<
  | {
      success: true;
      data: {
        userId: string;
      };
    }
  | { success: false; error: string }
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

  if (user) {
    return redirect("/app/home");
  }

  return (
    <div className="flex items-center justify-center">
      <SignInForm signIn={signIn} />
    </div>
  );
}
