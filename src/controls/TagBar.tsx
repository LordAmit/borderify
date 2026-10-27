export interface TagBarProps {
  value: string;
  onChange: (value: string) => void;
  tags: string[];
}

// [REQ-UI-08] EXIF tag chips are toggle buttons
const TagBar = ({ value, onChange, tags }: TagBarProps) => (
  <div className="chip-group" role="group" aria-label="Caption EXIF tags" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
    {tags.map((tagStr) => {
      const isActive = value.includes(tagStr);
      const tagName = tagStr.replace('{', '').replace('}', '');
      return (
        <button
          key={tagStr}
          type="button"
          className="chip"
          aria-pressed={isActive}
          aria-label={`${isActive ? 'Remove' : 'Add'} ${tagName} tag`}
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            cursor: 'pointer',
            border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: isActive ? '#38bdf8' : '#94a3b8',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            if (isActive) {
              onChange(value.replace(tagStr, '').replace(/\s+/g, ' ').trim());
            } else {
              onChange(`${value} ${tagStr}`.trim());
            }
          }}
        >
          {isActive ? '−' : '+'}{tagName}
        </button>
      );
    })}
  </div>
);

export default TagBar;
