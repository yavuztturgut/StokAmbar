export async function clientRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  defaultError: string = "Islem basarisiz"
): Promise<T> {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
  });

  const rawBody = await response.text();
  let data: T | { error?: string } | null = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody) as T | { error?: string };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : defaultError;
    throw new Error(message);
  }

  return data as T;
}
