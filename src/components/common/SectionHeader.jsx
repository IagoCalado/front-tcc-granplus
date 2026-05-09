import { FaSearch } from "react-icons/fa";

const SectionHeader = ({ title, subtitle, actions, onSearch, searchPlaceholder }) => {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onSearch && (
          <label className="search-field" style={{ margin: 0, minWidth: '320px' }}>
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
