import React from "react";

export default function TagSelector({ tags, selected, onChange }) {
  const toggle = (tag) => {
    onChange(
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    );
  };

  return (
    <div className="tag-selector">
      {tags.map(tag => (
        <button
          key={tag}
          type="button"
          className={selected.includes(tag) ? "active" : ""}
          onClick={() => toggle(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
