import { useEventListener } from "@vueuse/core";

interface Traveler {
  id: string;
  logo: HTMLElement | null;
  name: HTMLElement | null;
}

/**
 * Between the two pages (a view transition, see index.html), each library's logo and name travel
 * between its row on the libraries page and its column on the compare page: both pages give them
 * the same `view-transition-name`s.
 *
 * Only those in view get one, decided as the page is left and as it is shown. A transition draws
 * named elements unclipped, so one that is hidden (under a sticky header, outside its scroller)
 * would appear out of nowhere.
 */
export function useLibraryTravel(travelers: () => Traveler[], isInView: (el: HTMLElement) => boolean) {
  function name() {
    for (const { id, logo, name } of travelers()) {
      const travels = !!logo && !!name && isInView(logo) && isInView(name);
      if (logo) logo.style.viewTransitionName = travels ? `lib-logo-${id}` : "";
      if (name) name.style.viewTransitionName = travels ? `lib-name-${id}` : "";
    }
  }

  useEventListener(window, "pageswap", name);
  useEventListener(window, "pagereveal", name);
}
