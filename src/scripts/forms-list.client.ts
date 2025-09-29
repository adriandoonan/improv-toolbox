import { setupResourceListFiltering } from "../utils/resourceFilters";

const OPTIONS = {
  listSelector: "#formList",
  equalityFilters: [
    { field: "name" },
    { field: "type" },
  ],
};

let cleanup: (() => void) | undefined;

function init() {
  cleanup?.();
  cleanup = setupResourceListFiltering(OPTIONS);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  document.addEventListener("astro:page-load", init);
  document.addEventListener("astro:before-swap", () => {
    cleanup?.();
    cleanup = undefined;
  });
}
