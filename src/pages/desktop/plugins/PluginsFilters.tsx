import { useDebounce } from "@ouestware/hooks";
import { countBy, flatten, keys, omit, sortBy, sum, toPairs, values } from "lodash-es";
import { useEffect, useMemo, useState, type FC } from "react";
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
    values: sortBy(
      toPairs(valuesCount).map(([value, count]) => ({ value, count })),
      (o) => (field === "categories" ? -1 * o.count : o.value),
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
    const visibleIds = new Set(filteredPlugins.map((fp) => fp.id));
    plugins.forEach((p) => {
      const element = document.getElementById(pluginElementId(p.id));
      if (element) element.style.display = !visibleIds.has(p.id) ? "none" : "block";
    });
  }, [plugins, filteredPlugins]);

  return (
    <div>
      <fieldset className={`facets-container`}>
        <div>
          <label>Search</label>
          <input
            type="search"
            value={query || ""}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </div>

        <div>
          <label>Gephi version</label>
          {versionsOptions.values.map((o) => (
            <div key={o.value}>
              <label htmlFor={`version-checkbox-${o.value}`}>{o.value}</label>
              <input
                type="checkbox"
                id={`version-checkbox-${o.value}`}
                checked={state.versions.includes(o.value)}
                onChange={(e) => {
                  setState((state) => ({
                    ...state,
                    versions: e.target.checked
                      ? [...state.versions, o.value]
                      : state.versions.filter((v) => v !== o.value),
                  }));
                }}
              />
              <div
                style={{ backgroundColor: "pink", width: `${(o.count / versionsOptions.total) * 100}%`, height: "5px" }}
              />
            </div>
          ))}
        </div>

        <div>
          <label>Plugin category</label>
          {categoriesOptions.values.map((o) => (
            <div key={o.value}>
              <label htmlFor={`category-checkbox-${o.value}`}>{o.value}</label>
              <input
                type="checkbox"
                id={`category-checkbox-${o.value}`}
                checked={state.categories.includes(o.value)}
                onChange={(e) => {
                  setState((state) => ({
                    ...state,
                    categories: e.target.checked
                      ? [...state.categories, o.value]
                      : state.categories.filter((v) => v !== o.value),
                  }));
                }}
              />
              <div
                style={{
                  backgroundColor: "pink",
                  width: `${(o.count / categoriesOptions.total) * 100}%`,
                  height: "5px",
                }}
              />
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};
