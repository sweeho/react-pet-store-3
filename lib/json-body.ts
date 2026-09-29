/**
 * Reads a request body only when it is declared as JSON (bugfix SWHR3-T-0100,
 * D1, D2, D4, C2). h3's readBody picks a parser from the body, so a
 * form-encoded or text/plain request would be accepted; here the declared
 * media type decides, and anything but application/json (including no header)
 * is refused with 415 before the body is read.
 */
import { type H3Event, getRequestHeader, readBody } from "nitro/h3";

import { UnsupportedMediaTypeError } from "./errors";

export async function readJsonBody(event: H3Event): Promise<unknown> {
  const mediaType = (getRequestHeader(event, "content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    throw new UnsupportedMediaTypeError();
  }
  return readBody(event);
}
