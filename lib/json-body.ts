import type { H3Event } from "nitro/h3";

export async function readJsonBody(event: H3Event): Promise<unknown> {
  void event;
  throw new Error("VortexNotImplemented");
}
