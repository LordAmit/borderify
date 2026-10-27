export interface TagBarProps {
  value: string;
  onChange: (value: string) => void;
  tags: string[];
}

// [REQ-UI-08] EXIF tag chips are toggle buttons
const TagBar = ({ value, onChange, tags }: TagBarProps) => (
  <div className="chip-group chip-group-tags" role="group" aria-label="Caption EXIF tags">
    {tags.map((tagStr) => {
      const isActive = value.includes(tagStr);
      const tagName = tagStr.replace('{', '').replace('}', '');
      return (
        <button
          key={tagStr}
          type="button"
          className={`chip chip-sm ${isActive ? 'active' : ''}`}
          aria-pressed={isActive}
          aria-label={`${isActive ? 'Remove' : 'Add'} ${tagName} tag`}
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
