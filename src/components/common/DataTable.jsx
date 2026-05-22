import { useMemo, useState } from "react";

const DataTable = ({ columns, rows, rowKey = "id" }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return rows;

    const column = columns.find((col) => col.key === sortConfig.key);
    if (!column?.sortable) return rows;

    const getValue =
      column.sortAccessor || ((row) => row?.[column.key]);
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    return [...rows]
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const valueA = getValue(a.row);
        const valueB = getValue(b.row);

        if (valueA == null && valueB == null) return a.index - b.index;
        if (valueA == null) return 1;
        if (valueB == null) return -1;

        if (column.sortType === "number") {
          const numberA = Number(valueA);
          const numberB = Number(valueB);

          if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
            const diff = numberA - numberB;
            return diff === 0 ? a.index - b.index : diff * direction;
          }
        }

        const textA = String(valueA).toLowerCase();
        const textB = String(valueB).toLowerCase();
        const diff = textA.localeCompare(textB, "pt-BR", { sensitivity: "base" });
        return diff === 0 ? a.index - b.index : diff * direction;
      })
      .map((item) => item.row);
  }, [columns, rows, sortConfig]);

  const handleSort = (column) => {
    if (!column.sortable) return;

    setSortConfig((prev) => {
      if (prev.key === column.key) {
        return {
          key: column.key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key: column.key, direction: "asc" };
    });
  };
  return (
    <div className="table-shell">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => {
              const isActive = sortConfig.key === column.key;
              const direction = isActive ? sortConfig.direction : null;

              return (
                <th
                  key={column.key || column.label}
                  aria-sort={
                    isActive
                      ? direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "transparent",
                        border: "none",
                        color: "inherit",
                        font: "inherit",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <span>{column.label}</span>
                      <span
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          fontSize: 10,
                          lineHeight: 1,
                          opacity: 0.75,
                        }}
                      >
                        <span style={{ opacity: direction === "asc" ? 1 : 0.4 }}>
                          ▲
                        </span>
                        <span style={{ opacity: direction === "desc" ? 1 : 0.4 }}>
                          ▼
                        </span>
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => {
            const keyValue = row?.[rowKey];
            const rowUniqueKey =
              keyValue !== undefined && keyValue !== null && keyValue !== ""
                ? `${keyValue}-${index}`
                : `row-${index}`;

            return (
            <tr key={rowUniqueKey}>
              {columns.map((column) => (
                <td key={column.key || column.label}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
