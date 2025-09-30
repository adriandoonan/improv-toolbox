import { setupResourceListFiltering } from "../utils/resourceFilters";

const OPTIONS = {
  listSelector: "#exerciseList",
  searchField: "query",
  fuzzyOptions: {
    keys: [
      { name: "name", weight: 0.45 },
      { name: "focus", weight: 0.2 },
      { name: "source", weight: 0.15 },
      { name: "credit", weight: 0.1 },
      { name: "description", weight: 0.3 },
      { name: "tags", weight: 0.15 },
    ],
    threshold: 0.55,
    minMatchCharLength: 2,
  },
  equalityFilters: [
    { field: "name" },
    { field: "focus" },
    { field: "source" },
    { field: "credit" },
    { field: "minimumPeople" },
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
