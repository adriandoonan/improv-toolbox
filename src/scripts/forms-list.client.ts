import { setupResourceListFiltering } from "../utils/resourceFilters";

const OPTIONS = {
  listSelector: "#formList",
  searchField: "query",
  fuzzyOptions: {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "type", weight: 0.25 },
      { name: "description", weight: 0.3 },
      { name: "tags", weight: 0.15 },
    ],
    threshold: 0.55,
    minMatchCharLength: 2,
  },
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
