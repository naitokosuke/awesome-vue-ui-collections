import "./style.css";
import { mountLibrary } from "../mount";
import type { MountContext } from "../types";
import Demos from "./Demos.vue";

export function mount(context: MountContext) {
  mountLibrary(context, Demos);
}
