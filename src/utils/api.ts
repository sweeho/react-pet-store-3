/**
 * The one client for every form/API call (design.md C4). Sends and receives
 * JSON with credentials: "same-origin", and turns a non-2xx response into an
 * ApiError built from the error body shape lib/errors.ts's toHttpError
 * produces: { message, data: { code, fieldErrors } }.
 */
export interface ApiErrorInit {
  status: number;
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor({ status, message, code, fieldErrors }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface ApiFetchInit extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface ErrorBody {
  message?: string;
  data?: {
    code?: string;
    fieldErrors?: Record<string, string>;
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: ErrorBody = await response.json().catch(() => ({}));

  return new ApiError({
    status: response.status,
    message: body.message || response.statusText || "Request failed",
    code: body.data?.code,
    fieldErrors: body.data?.fieldErrors,
  });
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { body, headers, ...rest } = init;

  const response = await fetch(path, {
    ...rest,
    credentials: "same-origin",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
