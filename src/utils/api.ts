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
  /** Request field names the server found missing, in field order (checkout 422). */
  missingFields?: string[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;
  readonly missingFields?: string[];

  constructor({ status, message, code, fieldErrors, missingFields }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.missingFields = missingFields;
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
    missingFields?: string[];
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: ErrorBody = await response.json().catch(() => ({}));

  return new ApiError({
    status: response.status,
    message: body.message || response.statusText || "Request failed",
    code: body.data?.code,
    fieldErrors: body.data?.fieldErrors,
    missingFields: body.data?.missingFields,
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
