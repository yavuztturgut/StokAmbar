import { z } from "zod";

const transactionTypes = ["IN", "OUT", "WASTE", "ADJUSTMENT"] as const;
const ingredientUnits = ["kg", "lt", "adet", "paket"] as const;

const nonEmptyTrimmedString = z.string().trim().min(1);
const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().trim().optional()
);

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const selectCompanySchema = z.object({
  selectionToken: z.string().min(1),
  accountId: z.coerce.number().int().positive(),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(128),
  accountName: nonEmptyTrimmedString.max(120),
  accountEmail: z.string().trim().email(),
  phone: optionalTrimmedString,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32),
  password: z.string().min(6).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6).max(128),
  newPassword: z.string().min(6).max(128),
});

export const ingredientCreateSchema = z.object({
  name: nonEmptyTrimmedString.max(120),
  category: optionalTrimmedString,
  sku: optionalTrimmedString,
  supplier: optionalTrimmedString,
  unit: z.enum(ingredientUnits),
  currentStock: z.coerce.number().min(0).max(1_000_000).default(0),
  minStockLevel: z.coerce.number().min(0).max(1_000_000).default(0),
});

export const ingredientUpdateSchema = z.object({
  name: nonEmptyTrimmedString.max(120),
  category: optionalTrimmedString,
  sku: optionalTrimmedString,
  supplier: optionalTrimmedString,
  unit: z.enum(ingredientUnits),
  minStockLevel: z.coerce.number().min(0).max(1_000_000),
});

export const transactionSchema = z.object({
  ingredientId: z.coerce.number().int().positive(),
  type: z.enum(transactionTypes),
  quantity: z.coerce.number().positive().max(1_000_000),
  note: optionalTrimmedString,
});

export const profileUpdateSchema = z
  .object({
    activeAccountId: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (data) => data.activeAccountId !== undefined,
    { message: "En az bir alan guncellenmelidir." }
  );

export const accountCreateSchema = z.object({
  name: nonEmptyTrimmedString.max(120),
  email: z.string().trim().email(),
  phone: optionalTrimmedString,
});

export const accountUpdateSchema = z.object({
  name: optionalTrimmedString,
  email: z.string().trim().email().optional(),
  phone: optionalTrimmedString,
}).refine(
  (data) => data.name !== undefined || data.email !== undefined || data.phone !== undefined,
  { message: "En az bir alan guncellenmelidir." }
);

export const logsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  search: z.string().trim().max(120).optional().default(""),
  action: z
    .enum(["ALL", "CREATE", "UPDATE", "DELETE", "IN", "OUT", "WASTE", "ADJUSTMENT"])
    .optional()
    .default("ALL"),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  amountDirection: z
    .enum(["ALL", "INCREASE", "DECREASE"])
    .optional()
    .default("ALL"),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export const stockCountCreateSchema = z.object({
  items: z.array(z.object({
    ingredientId: z.coerce.number().int().positive(),
    countedStock: z.coerce.number().min(0).max(1_000_000),
    note: optionalTrimmedString,
  })).min(1),
});

export const formatZodError = (error: z.ZodError) =>
  error.issues.map((issue) => issue.message).join(", ");
