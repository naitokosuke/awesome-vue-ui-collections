import "./style.css";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

// Components are copied from the registry, not versioned on npm.
export const version = "not on npm";

export function mount(context: MountContext) {
  mountLibrary(context, Demos);
}
