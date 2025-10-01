import { setupResourceTable } from "./resource-table.client";
const options = {
  listSelector: "#warmupList",
  searchField: "query",
  favoritesField: "favoritesOnly",
  equalityFields: ["name", "focus", "minimumPeople"],
  columns: [
    { key: "name", filter: "equals", fallbackSelector: ".resource-card__title" },
    { key: "focus", filter: "equals" },
    { key: "minimumPeople", filter: "equals" },
    { key: "description", filter: "includes", fallbackSelector: ".resource-card__summary" },
    { key: "tags", filter: "includes" },
    { key: "content", filter: "includes", enableGlobalFilter: true }
  ],
  debugLabel: "warmupsTable"
};
let cleanup;
function init() {
  cleanup?.();
  cleanup = setupResourceTable(options);
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
    cleanup = void 0;
  });
}
