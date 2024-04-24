"use server";

import { lucia, validateRequest } from "@/lib/auth";
import { google } from "@/lib/oauth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function signOut() {
  try {
    const { session } = await validateRequest();

    if (!session) {
      return {
        error: "Unauthorized",
      };
    }

    await lucia.invalidateSession(session.id);

    const sessionCookie = lucia.createBlankSessionCookie();

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  } catch (error: any) {
    return {
      error: `${error.message}`,
    };
  }
}

export async function createGoogleAuthorizationURL() {
  try {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    cookies().set("codeVerifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    cookies().set("state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    const authorizationURL = await google.createAuthorizationURL(
      state,
      codeVerifier,
      { scopes: ["email", "profile"] }
    );

    return {
      success: true,
      data: authorizationURL.toString(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
