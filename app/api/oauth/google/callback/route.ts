import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { generateId } from "lucia";

import { lucia } from "@/lib/auth";
import db from "@/lib/db";
import { oauthAccountTable, userTable } from "@/lib/db/schema";
import { google } from "@/lib/oauth";

interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export const GET = async (req: NextRequest) => {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const codeVerifier = cookies().get("codeVerifier")?.value;
  const savedState = cookies().get("state")?.value;

  // console.log("codeVerifier", codeVerifier);
  // console.log("savedState", savedState);

  if (!codeVerifier || !savedState) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (savedState !== state) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { accessToken, refreshToken, accessTokenExpiresAt } =
    await google.validateAuthorizationCode(code, codeVerifier);

  const googleRes = await fetch(
    "https://www.googleapis.com/oauth2/v1/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` }, method: "GET" }
  );

  const googleData = (await googleRes.json()) as GoogleUser;

  const res = await db.transaction(async (tx) => {
    const user = await tx.query.userTable.findFirst({
      where: eq(userTable.email, googleData.email),
    });

    if (!user) {
      const userId = generateId(15);
      const createdUser = await tx
        .insert(userTable)
        .values({
          name: googleData.name,
          email: googleData.email,
          id: userId,
          isEmailVerified: true,
        })
        .returning();

      console.log("createdUser", createdUser);

      if (!createdUser || createdUser.length === 0) {
        console.log("======== ROLLBACK 1 =========");
        tx.rollback();
        return {
          success: false,
          error: "Failed to create user",
          userId: null,
        };
      }

      const oauthAccount = await tx
        .insert(oauthAccountTable)
        .values({
          id: generateId(15),
          provider: "google",
          providerUserId: googleData.id,
          userId,
          accessToken,
          refreshToken,
          expirestAt: accessTokenExpiresAt,
        })
        .returning();

      console.log("oauthAccount", oauthAccount);

      if (!oauthAccount || oauthAccount.length === 0) {
        console.log("======== ROLLBACK 2 =========");
        tx.rollback();
        return {
          success: false,
          error: "Failed to create oauth account",
          userId: null,
        };
      }

      return { success: true, error: null, userId };
    } else {
      const updatedUser = await tx
        .update(userTable)
        .set({ isEmailVerified: true })
        .where(eq(userTable.id, user.id))
        .returning();

      if (!updatedUser || updatedUser.length === 0) {
        tx.rollback();
        return {
          success: false,
          error: "Failed to update user",
        };
      }

      const updatedOauthAccount = await tx
        .update(oauthAccountTable)
        .set({ accessToken, expirestAt: accessTokenExpiresAt, refreshToken })
        .where(eq(oauthAccountTable.providerUserId, googleData.id))
        .returning();

      if (!updatedOauthAccount || updatedOauthAccount.length === 0) {
        tx.rollback();
        return {
          success: false,
          error: "Failed to update oauth account",
        };
      }

      return {
        success: true,
        error: null,
        userId: user.id,
      };
    }
  });

  if (!res.success || res.error || !res.userId) {
    return Response.json({ error: res.error }, { status: 400 });
  }

  const session = await lucia.createSession(res.userId, {
    expiresIn: 60 * 60 * 24 * 7,
  });

  const sessionCookie = lucia.createSessionCookie(session.id);

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  const redirectTo = new URL(`${process.env.NEXT_PUBLIC_BASE_URL!}/app/home`);

  return Response.redirect(redirectTo);
};
