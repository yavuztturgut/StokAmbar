import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, generateToken, getAuthCookieOptions, verifyToken } from "@/lib/auth";

export const authUserInclude = {
  account: true,
  ownedAccounts: {
    orderBy: { id: "asc" as const },
  },
};

export const serializeAccount = (account: {
  id: number;
  ownerId: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: account.id,
  ownerId: account.ownerId,
  name: account.name,
  email: account.email,
  phone: account.phone,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});

export const serializeUser = (user: {
  id: number;
  email: string;
  username: string;
  accountId: number | null;
  createdAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  accountId: user.accountId,
  createdAt: user.createdAt,
});

export const listAccounts = (user: {
  account: null | {
    id: number;
    ownerId: number;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  ownedAccounts: Array<{
    id: number;
    ownerId: number;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}) => {
  const pool = user.ownedAccounts.length ? user.ownedAccounts : user.account ? [user.account] : [];
  return pool.map(serializeAccount);
};

export const loadAuthUser = (where: { id?: number; email?: string }) =>
  prisma.user.findFirst({
    where,
    include: authUserInclude,
  });

export const buildAuthResponse = (user: {
  id: number;
  email: string;
  username: string;
  accountId: number | null;
  createdAt: Date;
  account: null | {
    id: number;
    ownerId: number;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  ownedAccounts: Array<{
    id: number;
    ownerId: number;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}, activeAccountId: number, expiresIn: "1d" | "7d" | "30d" = "1d") => {
  const activeAccount = user.ownedAccounts.find((item) => item.id === activeAccountId) ?? user.account;
  if (!activeAccount) {
    throw new Error("Active account not found");
  }

  return {
    success: true,
    token: generateToken(
      {
        userId: user.id,
        accountId: activeAccount.id,
        email: user.email,
      },
      expiresIn
    ),
    user: serializeUser({
      id: user.id,
      email: user.email,
      username: user.username,
      accountId: activeAccount.id,
      createdAt: user.createdAt,
    }),
    activeAccount: serializeAccount(activeAccount),
    accounts: listAccounts(user),
  };
};

export const createAuthSuccessResponse = (
  user: {
    id: number;
    email: string;
    username: string;
    accountId: number | null;
    createdAt: Date;
    account: null | {
      id: number;
      ownerId: number;
      name: string;
      email: string;
      phone: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    ownedAccounts: Array<{
      id: number;
      ownerId: number;
      name: string;
      email: string;
      phone: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  },
  activeAccountId: number,
  expiresIn: "1d" | "7d" | "30d" = "1d"
) => {
  const result = buildAuthResponse(user, activeAccountId, expiresIn);
  const maxAge =
    expiresIn === "30d"
      ? 60 * 60 * 24 * 30
      : expiresIn === "7d"
        ? 60 * 60 * 24 * 7
        : 60 * 60 * 24;
  const response = NextResponse.json(result);

  response.cookies.set(
    AUTH_COOKIE_NAME,
    result.token!,
    getAuthCookieOptions(maxAge)
  );

  return response;
};

export const signSelectionToken = (userId: number, accountIds: number[], rememberMe: boolean) =>
  generateToken(
    {
      userId,
      accountId: 0,
      email: `selection:${accountIds.join(",")}:${rememberMe ? "1" : "0"}`,
    },
    "1d"
  );

export const parseSelectionToken = (token: string) => {
  const payload = generateSelectionPayload(token);
  const [, accountList, rememberFlag] = payload.email.split(":");
  return {
    userId: payload.userId,
    accountIds: (accountList || "")
      .split(",")
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0),
    rememberMe: rememberFlag === "1",
  };
};

const generateSelectionPayload = (token: string) => {
  const payload = verifyToken(token);
  if (!payload || !payload.email.startsWith("selection:")) {
    throw new Error("Invalid selection token");
  }
  return payload;
};
