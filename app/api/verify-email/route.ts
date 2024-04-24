import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";
import { eq } from "drizzle-orm";
import { emailVerificationTable, userTable } from "@/lib/db/schema";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return Response.json({ error: "Token is not exists" }, { status: 400 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      code: string;
    };

    const emailVerfication = await db.query.emailVerificationTable.findFirst({
      where:
        eq(emailVerificationTable.userId, decoded.userId) &&
        eq(emailVerificationTable.code, decoded.code),
    });

    if (!emailVerfication) {
      return Response.json({ error: "Invalid token" }, { status: 400 });
    }

    await db
      .delete(emailVerificationTable)
      .where(eq(emailVerificationTable.userId, decoded.userId));

    await db
      .update(userTable)
      .set({ isEmailVerified: true })
      .where(eq(userTable.id, decoded.userId));

    const session = await lucia.createSession(decoded.userId, {
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
  } catch (error: any) {
    console.log("error", error.message);
    return Response.json(
      { error: "Invalid token or expired token" },
      { status: 400 }
    );
  }
};
