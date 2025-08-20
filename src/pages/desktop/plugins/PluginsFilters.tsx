import { useDebounce } from "@ouestware/hooks";
import { countBy, flatten, keys, omit, reverse, sortBy, sum, toPairs, values } from "lodash-es";
import { useEffect, useMemo, useState, type FC } from "react";
import { CheckboxInputGroup } from "./CheckboxInput";
import type { Plugin } from "./type";
import { pluginElementId } from "./utils";

interface FilterStateType {
  query?: string;
  versions: string[];
  categories: string[];
}

function searchToState(urlSearchParam: URLSearchParams): FilterStateType {
  return {
    query: urlSearchParam.get("query") || undefined,
    versions:
      urlSearchParam
        .get("versions")
        ?.split("|")
        .map((v) => decodeURIComponent(v)) || [],
    categories:
      urlSearchParam
        .get("categories")
        ?.split("|")
        .map((v) => decodeURIComponent(v)) || [],
  };
}
function stateToSearch(state: FilterStateType): string {
  const urlSearchParam = new URLSearchParams();
  if (state.query) urlSearchParam.append("query", state.query);
  if (state.versions.length > 0)
    urlSearchParam.append("versions", sortBy(state.versions).map(encodeURIComponent).join("|"));
  if (state.categories.length > 0)
    urlSearchParam.append("categories", sortBy(state.categories).map(encodeURIComponent).join("|"));

  return urlSearchParam.toString();
}

function filterPlugins(plugins: Plugin[], state: Partial<FilterStateType>) {
  const textRE = state.query ? new RegExp(`.*${state.query}.*`, "i") : null;
  return textRE !== null ||
    (state.versions && state.versions.length > 0) ||
    (state.categories && state.categories.length > 0)
    ? plugins.filter(
        (p) =>
          (textRE === null ||
            textRE.test(p.name) ||
            textRE.test(p.short_description) ||
            textRE.test(p.long_description)) &&
          (state.versions === undefined ||
            state.versions.length === 0 ||
            keys(p.versions).some((v) => state.versions?.includes(v))) &&
          (state.categories === undefined ||
            state.categories.length === 0 ||
            state.categories.some((c) => c === p.category)),
      )
    : plugins;
}
function aggregatePlugins(field: "versions" | "categories", filteredPlugins: Plugin[]) {
  const valuesCount = countBy(
    flatten(
      filteredPlugins.map((p) => {
        switch (field) {
          case "categories":
            return p.category;
          case "versions":
            return keys(p.versions);
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
    () => aggregatePlugins("versions", filterPlugins(plugins, omit(state, ["versions"]))),
    [state, plugins],
  );
  const categoriesOptions = useMemo(
    () => aggregatePlugins("categories", filterPlugins(plugins, omit(state, ["categories"]))),
    [state, plugins],
  );

  // TODO: hide/show cards
  useEffect(() => {
    if (filteredPlugins) {
      const visibleIds = new Set(filteredPlugins.map((fp) => fp.id));
      const totalSpan = document.getElementById("plugins-list-total");
      if (totalSpan) totalSpan.textContent = visibleIds.size + "";
      plugins.forEach((p) => {
        const element = document.getElementById(pluginElementId(p.id));
        if (element) element.style.display = !visibleIds.has(p.id) ? "none" : "block";
      });
    }
  }, [plugins, filteredPlugins]);
  console.log(versionsOptions);
  return (
    <div className="plugins-filters">
      <fieldset className={`facets-container`}>
        <div>
          <legend>Search</legend>
          <input
            type="search"
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
  );
};
