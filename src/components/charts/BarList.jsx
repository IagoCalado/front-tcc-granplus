import { formatNumber } from "../../utils/format";

const BarList = ({ data }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className="bar-list">
      {data.map((item) => (
        <div className="bar-item" key={item.label}>
          <div className="bar-label">{item.label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${maxValue ? (item.value / maxValue) * 100 : 0}%`,
              }}
            />
          </div>
          <strong>{formatNumber(item.value)}</strong>
        </div>
      ))}
    </div>
  );
};

export default BarList;
