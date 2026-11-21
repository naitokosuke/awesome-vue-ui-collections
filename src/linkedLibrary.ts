const KEY = "awesome-vue-ui-collections:linked-library";

/**
 * The compare page tells the libraries page which library's logo and name to receive from it (the
 * pages' view transition, see index.html). The other way, the link's `?lib=` says it.
 */
export function passLinkedLibrary(id: string | undefined) {
  try {
    if (id) sessionStorage.setItem(KEY, id);
    else sessionStorage.removeItem(KEY);
  } catch {}
}

export function takeLinkedLibrary() {
  try {
    const id = sessionStorage.getItem(KEY) ?? undefined;
    sessionStorage.removeItem(KEY);
    return id;
  } catch {
    return undefined;
  }
}
