import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { UnsupportedMediaTypeError, toHttpError } from "./errors";
import { readJsonBody } from "./json-body";

/**
 * UNIT TEST (server project). The bugfix design's D1, D2, D4, C2: the declared
 * media type, not the body, decides; anything but application/json is refused.
 */
const BODY = { itemId: "EST-1" };

function makeEvent(contentType: string | null, body: string = JSON.stringify(BODY)): H3Event {
  return new H3Event(
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: contentType === null ? {} : { "content-type": contentType },
      body,
    }),
  );
}

describe("readJsonBody", () => {
  it.each(["application/json", "application/json; charset=utf-8", "Application/JSON"])(
    "[SWHR3-C-0151] accepts %s and returns the parsed body",
    async (contentType) => {
      await expect(readJsonBody(makeEvent(contentType))).resolves.toEqual(BODY);
    },
  );

  it.each([
    ["no content-type header", null],
    ["text/plain", "text/plain"],
    ["multipart/form-data", "multipart/form-data; boundary=x"],
    ["application/jsonp", "application/jsonp"],
  ])("[SWHR3-C-0151] refuses %s with UnsupportedMediaTypeError", async (_name, contentType) => {
    await expect(readJsonBody(makeEvent(contentType))).rejects.toBeInstanceOf(
      UnsupportedMediaTypeError,
    );
  });

  it("[SWHR3-C-0147] refuses application/x-www-form-urlencoded, which maps to a 415", async () => {
    const event = makeEvent("application/x-www-form-urlencoded", "a=1");

    const error = await readJsonBody(event).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UnsupportedMediaTypeError);
    expect(toHttpError(error)).toMatchObject({
      status: 415,
      message: "Request body must be JSON",
      data: { code: "UNSUPPORTED_MEDIA_TYPE" },
    });
  });
});
