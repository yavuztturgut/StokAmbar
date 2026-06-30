import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { accountCreateSchema, formatZodError } from "@/lib/validation";
import { serializeAccount } from "@/lib/accountAuth";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforcePostAuthRateLimit({ scope: "accounts:write", request });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const parsedBody = accountCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return withRateLimitHeaders(NextResponse.json({ error: formatZodError(parsedBody.error) }, { status: 400 }), rateLimit);
    }

    const account = await prisma.account.create({
      data: {
        ownerId: payload.userId,
        name: parsedBody.data.name,
        email: parsedBody.data.email,
        phone: parsedBody.data.phone || null,
      },
    });

    return withRateLimitHeaders(NextResponse.json({ success: true, account: serializeAccount(account) }, { status: 201 }), rateLimit);
  } catch (error) {
    console.error("Sirket olusturma hatasi:", error);
    return NextResponse.json({ error: "Sirket olusturulamadi" }, { status: 500 });
  }
}
