import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
} from "@/lib/auth";
import { formatZodError, loginSchema } from "@/lib/validation";
import {
  createAuthSuccessResponse,
  listAccounts,
  loadAuthUser,
  serializeUser,
  signSelectionToken,
} from "@/lib/accountAuth";

export async function POST(request: NextRequest) {
  try {
    const parsedBody = loginSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsedBody.data;

    const user = await loadAuthUser({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    const accounts = listAccounts(user);
    if (!accounts.length) {
      return NextResponse.json(
        { error: "Bu kullaniciya ait hesap bulunamadi" },
        { status: 403 }
      );
    }

    if (accounts.length > 1) {
      return NextResponse.json({
        success: true,
        requiresCompanySelection: true,
        user: serializeUser(user),
        accounts,
        selectionToken: signSelectionToken(user.id, accounts.map((item) => item.id), rememberMe),
      });
    }

    return createAuthSuccessResponse(user, accounts[0].id, rememberMe ? "30d" : "1d");
  } catch (error) {
    console.error("Giriş hatası:", error);
    return NextResponse.json(
      { error: "Giriş sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
