import { FaSearch } from "react-icons/fa";

const SectionHeader = ({ title, subtitle, actions, onSearch, searchPlaceholder }) => {
  return (
    <div className="page-header" style={{ flexWrap: "wrap" }}>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="section-controls">
          {onSearch && (
          <label
            className="search-field"
            style={{ margin: 0, width: 'min(100%, 320px)', minWidth: 0 }}
          >
            <FaSearch style={{ color: 'var(--muted)', marginLeft: '4px' }} />
            <input 
              placeholder={searchPlaceholder || "Buscar..."} 
              onChange={(e) => onSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </label>
        )}
        {actions ? <div>{actions}</div> : null}
      </div>
    </div>
  );
};

export default SectionHeader;
