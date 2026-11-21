import { onBeforeUnmount, onMounted, ref, type ShallowRef, watch, type WatchSource } from "vue";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useSelectionRect(
  group: Readonly<ShallowRef<HTMLElement | null>>,
  selector: string,
  selected: WatchSource,
) {
  const rect = ref<SelectionRect | null>(null);

  function measure() {
    const el = group.value?.querySelector<HTMLElement>(selector);
    rect.value =
      el && el.offsetWidth > 0
        ? { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight }
        : null;
  }

  watch(selected, measure, { flush: "post" });
  let observer: ResizeObserver | undefined;
  onMounted(() => {
    measure();
    observer = new ResizeObserver(measure);
    for (const el of [group.value!, ...group.value!.children]) observer.observe(el);
  });
  onBeforeUnmount(() => observer?.disconnect());

  return rect;
}
