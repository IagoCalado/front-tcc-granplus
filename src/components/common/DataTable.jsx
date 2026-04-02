const DataTable = ({ columns, rows, rowKey = "id" }) => {
  return (
    <div className="table-shell">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key || column.label}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row[rowKey] || index}>
              {columns.map((column) => (
                <td key={column.key || column.label}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
