import { defineHandler } from "nitro/h3";

declare module "h3" {
  interface H3EventContext {
    cartSession?: string;
  }
}

export default defineHandler(() => {
  throw new Error("VortexNotImplemented");
});
