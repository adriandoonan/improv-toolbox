import {
  createColumnHelper,
  createTable,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel
} from "@tanstack/table-core";
import {
  loadFavorites,
  subscribeToFavorites
} from "../utils/favorites";
const DEFAULT_FORM_SELECTOR = ".filter-form";
const DEFAULT_FAVORITES_FIELD = "favoritesOnly";
function toDatasetRecord(dataset) {
  return Object.fromEntries(
    Object.entries(dataset).map(([key, value]) => [key, value ?? ""])
  );
}
function normalize(value) {
  if (value == null) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalize(entry)).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value).map((entry) => normalize(entry)).join(" ");
  }
  return String(value);
}
function extractText(card, selector) {
  return card.querySelector(selector)?.textContent?.trim() ?? "";
}
function setupResourceTable(options) {
  const {
    listSelector,
    formSelector = DEFAULT_FORM_SELECTOR,
    searchField,
    favoritesField = DEFAULT_FAVORITES_FIELD,
    equalityFields = [],
    columns: columnConfig,
    debugLabel = "resourceTable"
  } = options;
  const debugPrefix = `[${debugLabel}]`;
  const logDebug = (message, detail) => {
    if (typeof window === "undefined") return;
    if (detail === void 0) {
      console.info(`${debugPrefix} ${message}`);
    } else {
      console.info(`${debugPrefix} ${message}`, detail);
    }
  };
  const list = document.querySelector(listSelector);
  if (!list) {
    logDebug("List selector did not resolve", { listSelector });
    return () => {
    };
  }
  const cards = Array.from(list.querySelectorAll(".resource-card"));
  if (!cards.length) {
    logDebug("No resource cards found", { listSelector });
    return () => {
    };
  }
  const columns = [
    ...columnConfig,
    {
      key: "favorite",
      filter: "equals",
      enableGlobalFilter: false
    }
  ];
  const columnHelper = createColumnHelper();
  const columnDefs = columns.map(
    ({ key, filter, enableGlobalFilter = true }) => columnHelper.accessor((row) => row[key] ?? "", {
      id: key,
      filterFn: filter === "equals" ? "equalsString" : "includesString",
      enableSorting: false,
      enableGlobalFilter
    })
  );
  const resourceRows = cards.map((card, index) => {
    const dataset = toDatasetRecord(card.dataset);
    const favoriteRoot = card.querySelector("[data-favorite-root]") ?? null;
    const favoriteButton = favoriteRoot?.querySelector(
      "[data-favorite-button]"
    ) ?? null;
    const favoriteKey = favoriteRoot?.dataset.favoriteKey ?? "";
    const fallbackId = dataset.resourceId || card.id || `resource-${index}`;
    const row = {
      id: fallbackId,
      favorite: dataset.favorite ?? card.dataset.favorite ?? "false",
      cardElement: card,
      favoriteRoot,
      favoriteButton,
      favoriteKey
    };
    columns.forEach((config) => {
      if (config.key in row) {
        return;
      }
      const datasetValue = dataset[config.key];
      if (datasetValue) {
        row[config.key] = datasetValue;
        return;
      }
      if (config.fallback) {
        row[config.key] = normalize(config.fallback(card));
        return;
      }
      if (config.fallbackSelector) {
        row[config.key] = extractText(card, config.fallbackSelector);
        return;
      }
      if (config.key === "content") {
        row.content = card.textContent?.trim() ?? "";
      } else {
        row[config.key] = "";
      }
    });
    if (!row.name) {
      row.name = extractText(card, ".resource-card__title");
    }
    if (!row.description) {
      row.description = extractText(card, ".resource-card__summary");
    }
    if (!row.content) {
      row.content = card.textContent?.trim() ?? "";
    }
    return row;
  });
  const emptyMessage = list.parentElement?.querySelector(
    "[data-resource-empty]"
  ) ?? (() => {
    const message = document.createElement("p");
    message.dataset.resourceEmpty = "";
    message.textContent = "No results match the current filters.";
    message.className = "resource-empty";
    message.hidden = true;
    list.after(message);
    return message;
  })();
  const form = document.querySelector(formSelector);
  let columnFilters = [];
  let globalFilter = "";
  let tableState = {
    columnFilters,
    globalFilter
  };
  const table = createTable({
    data: resourceRows,
    columns: columnDefs,
    state: tableState,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: (updater) => {
      columnFilters = functionalUpdate(updater, columnFilters);
      logDebug("Column filters updated", columnFilters);
      updateStateAndRender();
    },
    onGlobalFilterChange: (updater) => {
      globalFilter = functionalUpdate(updater, globalFilter);
      logDebug("Global filter updated", { globalFilter });
      updateStateAndRender();
    }
  });
  function updateState() {
    tableState = {
      ...tableState,
      columnFilters,
      globalFilter
    };
    table.setOptions((prev) => ({
      ...prev,
      state: tableState
    }));
  }
  function render() {
    const rows = table.getRowModel().rows;
    const nodes = rows.map((row) => {
      const card = row.original.cardElement;
      card.hidden = false;
      return card;
    });
    list.replaceChildren(...nodes);
    emptyMessage.hidden = nodes.length > 0;
    logDebug("Render complete", {
      visibleRows: nodes.length,
      totalRows: resourceRows.length
    });
  }
  function updateStateAndRender() {
    updateState();
    render();
  }
  function updateDataAndRender() {
    table.setOptions((prev) => ({
      ...prev,
      data: resourceRows
    }));
    render();
  }
  function applyFavorites(payload) {
    resourceRows.forEach((row) => {
      const stored = row.favoriteKey ? payload[row.favoriteKey] : void 0;
      const isFavorite = Boolean(stored) || row.cardElement.dataset.favorite === "true";
      row.favorite = isFavorite ? "true" : "false";
      row.cardElement.dataset.favorite = row.favorite;
      if (row.favoriteRoot) {
        row.favoriteRoot.dataset.favorite = row.favorite;
      }
      row.favoriteButton?.setAttribute("aria-pressed", String(isFavorite));
    });
    logDebug("Favorites applied", {
      favorites: Object.keys(payload ?? {}).length
    });
    updateDataAndRender();
  }
  function syncFiltersFromForm() {
    if (!form) {
      updateStateAndRender();
      return;
    }
    const formData = new FormData(form);
    const query = searchField ? (formData.get(searchField) ?? "").toString().trim() : "";
    if (searchField) {
      table.setGlobalFilter(query);
    }
    equalityFields.forEach((field) => {
      const value = (formData.get(field) ?? "").toString().trim();
      table.getColumn(field)?.setFilterValue(value || void 0);
    });
    if (favoritesField) {
      const favoritesOnly = formData.get(favoritesField) != null;
      table.getColumn("favorite")?.setFilterValue(favoritesOnly ? "true" : void 0);
    }
  }
  function handleInput(event) {
    if (!searchField) return;
    const target = event.target;
    if (!target || target.name !== searchField) {
      return;
    }
    logDebug("Search input", { value: target.value });
    table.setGlobalFilter(target.value);
  }
  function handleChange(event) {
    const target = event.target;
    if (!target) {
      return;
    }
    if (favoritesField && target.name === favoritesField && target instanceof HTMLInputElement) {
      logDebug("Favorites toggle", { active: target.checked });
      table.getColumn("favorite")?.setFilterValue(target.checked ? "true" : void 0);
      return;
    }
    if (equalityFields.includes(target.name)) {
      logDebug("Equality filter", { field: target.name, value: target.value });
      table.getColumn(target.name)?.setFilterValue(target.value || void 0);
    }
  }
  function handleReset() {
    window.setTimeout(() => {
      logDebug("Form reset requested");
      table.resetGlobalFilter();
      table.resetColumnFilters();
      render();
    }, 0);
  }
  const handleSubmit = (event) => event.preventDefault();
  form?.addEventListener("submit", handleSubmit);
  form?.addEventListener("input", handleInput);
  form?.addEventListener("change", handleChange);
  form?.addEventListener("reset", handleReset);
  const favoritesPayload = loadFavorites();
  applyFavorites(favoritesPayload.items);
  const cleanupFavorites = subscribeToFavorites((detail) => {
    if (!detail?.payload) {
      return;
    }
    applyFavorites(detail.payload.items);
  });
  if (typeof window !== "undefined" && window.location.search) {
    const params = new URL(window.location.href).searchParams;
    const applyQueue = [];
    if (form) {
      if (searchField) {
        const queryValue = params.get(searchField);
        if (queryValue != null) {
          const input = form.elements.namedItem(searchField);
          if (input && "value" in input) {
            input.value = queryValue;
            applyQueue.push(() => table.setGlobalFilter(queryValue));
          }
        }
      }
      equalityFields.forEach((field) => {
        const value = params.get(field);
        if (value != null) {
          const element = form.elements.namedItem(field);
          if (element && "value" in element) {
            element.value = value;
            applyQueue.push(() => table.getColumn(field)?.setFilterValue(value));
          }
        }
      });
      if (favoritesField && params.has(favoritesField)) {
        const favoritesInput = form.elements.namedItem(favoritesField);
        if (favoritesInput instanceof HTMLInputElement) {
          favoritesInput.checked = true;
          applyQueue.push(() => table.getColumn("favorite")?.setFilterValue("true"));
        }
      }
    }
    applyQueue.forEach((fn) => fn());
    if (params.toString()) {
      const nextUrl = `${window.location.pathname}${window.location.hash ?? ""}`;
      window.history.replaceState({}, document.title, nextUrl);
    }
  }
  syncFiltersFromForm();
  updateStateAndRender();
  logDebug("Table initialised", {
    rows: resourceRows.length,
    equalityFields,
    searchField,
    favoritesField
  });
  return () => {
    form?.removeEventListener("submit", handleSubmit);
    form?.removeEventListener("input", handleInput);
    form?.removeEventListener("change", handleChange);
    form?.removeEventListener("reset", handleReset);
    cleanupFavorites?.();
  };
}
export {
  setupResourceTable
};
