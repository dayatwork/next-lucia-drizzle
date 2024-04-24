import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";
import { generateId } from "lucia";

import db from "@/lib/db";
import { userTable } from "@/lib/db/schema";
import { lucia, validateRequest } from "@/lib/auth";
import { FormInput, SignUpForm } from "./sign-up-form";
import { redirect } from "next/navigation";

export type SignUp = ({ email, password, name }: FormInput) => Promise<
  | {
      success: true;
      data: {
        userId: string;
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

      const session = await lucia.createSession(userId, {
        expiresIn: 60 * 60 * 24 * 7,
      });

      console.log({ session });

      const sessionCookie = lucia.createSessionCookie(session.id);

      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );

      return {
        success: true,
        data: { userId },
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
      <SignUpForm signUp={signUp} />
    </div>
  );
}
