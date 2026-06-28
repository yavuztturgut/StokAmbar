import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, profileUpdateSchema } from "@/lib/validation";
import { buildAuthResponse, listAccounts, loadAuthUser, serializeAccount, serializeUser } from "@/lib/accountAuth";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const user = await loadAuthUser({ id: payload.userId });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
    }

    const activeAccount = user.ownedAccounts.find((item) => item.id === payload.accountId) ?? user.account;
    if (!activeAccount) {
      return NextResponse.json({ error: "Aktif sirket bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...serializeUser(user),
        accountId: activeAccount.id,
      },
      activeAccount: serializeAccount(activeAccount),
      accounts: listAccounts(user),
    });
  } catch (error) {
    console.error("Profil hatasi:", error);
    return NextResponse.json({ error: "Profil bilgileri alinamadi" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const parsedBody = profileUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: formatZodError(parsedBody.error) }, { status: 400 });
    }

    const user = await loadAuthUser({ id: payload.userId });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
    }

    const nextAccountId = parsedBody.data.activeAccountId;
    if (nextAccountId === undefined) {
      return NextResponse.json({ error: 'Gecerli bir sirket secin' }, { status: 400 });
    }

    if (!user.ownedAccounts.some((item) => item.id === nextAccountId)) {
      return NextResponse.json({ error: "Secilen sirket bu kullaniciya ait degil" }, { status: 403 });
    }

    return NextResponse.json(buildAuthResponse(user, nextAccountId));
  } catch (error) {
    console.error("Profil guncelleme hatasi:", error);
    return NextResponse.json({ error: "Profil guncellenemedi" }, { status: 500 });
  }
}
