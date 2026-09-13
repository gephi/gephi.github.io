import { useDebounce } from "@ouestware/hooks";
import { countBy, flatten, omit, reverse, sortBy, sum, toPairs, uniq, values } from "lodash-es";
import { useEffect, useMemo, useState, type FC } from "react";
import { CheckboxInputGroup } from "./CheckboxInput";
import type { Plugin } from "../../type";
import { isLegacyGephiVersion, normalizeGephiVersion, pluginElementId, pluginHasModernVersion } from "./utils";

interface FilterStateType {
  query?: string;
  versions: string[];
  categories: string[];
  showLegacy: boolean;
}

function searchToState(urlSearchParam: URLSearchParams): FilterStateType {
  const showLegacy = urlSearchParam.get("legacy") === "1";
  const versions =
    urlSearchParam
      .get("versions")
      ?.split("|")
      .map((v) => decodeURIComponent(v)) || [];
  return {
    query: urlSearchParam.get("query") || undefined,
    // Drop any legacy version stuck in a bookmarked/old URL when legacy versions aren't shown,
    // otherwise it can never match a visible tag and silently zeroes the results.
    versions: showLegacy ? versions : versions.filter((v) => !isLegacyGephiVersion(v)),
    categories:
      urlSearchParam
        .get("categories")
        ?.split("|")
        .map((v) => decodeURIComponent(v)) || [],
    showLegacy,
  };
}
function stateToSearch(state: FilterStateType): string {
  const urlSearchParam = new URLSearchParams();
  if (state.query) urlSearchParam.append("query", state.query);
  if (state.versions.length > 0)
    urlSearchParam.append("versions", sortBy(state.versions).map(encodeURIComponent).join("|"));
  if (state.categories.length > 0)
    urlSearchParam.append("categories", sortBy(state.categories).map(encodeURIComponent).join("|"));
  if (state.showLegacy) urlSearchParam.append("legacy", "1");

  return urlSearchParam.toString();
}

// Gephi version tags visible for filtering/faceting: normalized (major.minor
// for 0.10+, full patch for legacy), and excluding legacy tags entirely unless
// showLegacy is set.
function getVisibleVersionTags(p: Plugin, showLegacy: boolean): string[] {
  const raw = Object.keys(p.versions);
  const visible = showLegacy ? raw : raw.filter((v) => !isLegacyGephiVersion(v));
  return uniq(visible.map(normalizeGephiVersion));
}

function filterPlugins(plugins: Plugin[], state: Partial<FilterStateType>) {
  const textRE = state.query ? new RegExp(`.*${state.query}.*`, "i") : null;
  const showLegacy = !!state.showLegacy;
  return plugins.filter(
    (p) =>
      (showLegacy || pluginHasModernVersion(p)) &&
      (textRE === null || textRE.test(p.name) || textRE.test(p.short_description) || textRE.test(p.long_description)) &&
      (state.versions === undefined ||
        state.versions.length === 0 ||
        getVisibleVersionTags(p, showLegacy).some((v) => state.versions?.includes(v))) &&
      (state.categories === undefined ||
        state.categories.length === 0 ||
        state.categories.some((c) => c === p.category)),
  );
}
function aggregatePlugins(field: "versions" | "categories", filteredPlugins: Plugin[], showLegacy: boolean) {
  const valuesCount = countBy(
    flatten(
      filteredPlugins.map((p) => {
        switch (field) {
          case "categories":
            return p.category;
          case "versions":
            return getVisibleVersionTags(p, showLegacy);
        }
      }),
    ),
  );
  const total = sum(values(valuesCount));
  return {
    values: reverse(
      sortBy(
        toPairs(valuesCount).map(([value, count]) => ({ value, count })),
        (o) =>
          field === "categories"
            ? o.count
            : o.value
                .split(".")
                .map((vPart) => vPart.padStart(3, "0"))
                .join(""),
      ),
    ),
    total,
  };
}

export const PluginsFilters: FC<{ plugins: Plugin[] }> = ({ plugins }) => {
  const [query, setQuery] = useState<string>(searchToState(new URL(document.URL).searchParams).query || "");
  const [state, setState] = useState<FilterStateType>(searchToState(new URL(document.URL).searchParams));

  const [debouncedQuery] = useDebounce(query);
  useEffect(() => {
    setState((prev) => ({ ...prev, query: debouncedQuery }));
  }, [debouncedQuery]);
  useEffect(() => {
    const newSearch = stateToSearch(state);
    history.pushState({}, "", `?${newSearch}`);
  }, [state]);

  const filteredPlugins = useMemo(() => filterPlugins(plugins, state), [state, plugins]);
  const versionsOptions = useMemo(
    () => aggregatePlugins("versions", filterPlugins(plugins, omit(state, ["versions"])), state.showLegacy),
    [state, plugins],
  );
  const categoriesOptions = useMemo(
    () => aggregatePlugins("categories", filterPlugins(plugins, omit(state, ["categories"])), state.showLegacy),
    [state, plugins],
  );

  useEffect(() => {
    if (filteredPlugins) {
      const visibleIds = new Set(filteredPlugins.map((fp) => fp.id));
      const totalSpan = document.getElementById("plugins-list-total");
      if (totalSpan) totalSpan.textContent = `${visibleIds.size || "No"} ${visibleIds.size > 1 ? "plugins" : "plugin"}`;
      plugins.forEach((p) => {
        const element = document.getElementById(pluginElementId(p.id));
        if (element) element.style.display = !visibleIds.has(p.id) ? "none" : "block";
      });
    }
  }, [plugins, filteredPlugins]);

  return (
    <div className="left-scrollbar plugins-filters">
      <div className="">
        <fieldset className="facets-container">
          <div>
            <legend>Search</legend>
            <input
              type="search"
              className="form-control"
              value={query || ""}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </div>

          <div>
            <legend>Gephi version</legend>
            <CheckboxInputGroup
              options={versionsOptions}
              selected={state.versions}
              onChange={(value, checked) => {
                setState((state) => ({
                  ...state,
                  versions: checked ? [...state.versions, value] : state.versions.filter((v) => v !== value),
                }));
              }}
            />
            <div className="checkbox d-flex align-items-center gap-2 mt-3">
              <input
                type="checkbox"
                id="show-legacy-checkbox"
                checked={state.showLegacy}
                onChange={(e) => {
                  const showLegacy = e.target.checked;
                  setState((state) => ({
                    ...state,
                    showLegacy,
                    // Drop any checked legacy versions so they don't keep filtering to nothing
                    // once their checkboxes disappear from the facet list.
                    versions: showLegacy ? state.versions : state.versions.filter((v) => !isLegacyGephiVersion(v)),
                  }));
                }}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor="show-legacy-checkbox">
                Show older Gephi versions
              </label>
            </div>
          </div>

          <div>
            <legend>Plugin category</legend>
            <CheckboxInputGroup
              options={categoriesOptions}
              selected={state.categories}
              onChange={(value, checked) => {
                setState((state) => ({
                  ...state,
                  categories: checked ? [...state.categories, value] : state.categories.filter((v) => v !== value),
                }));
              }}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
};
