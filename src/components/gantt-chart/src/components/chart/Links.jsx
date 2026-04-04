import { useContext, useState, useEffect } from 'react';
import storeContext from '../../context';
import { useStore } from '@svar-ui/lib-react';
import './Links.css';

// Get position for delete icon (middle of the link path)
function getLinkIconPosition(points) {
  if (!points) return null;

  try {
    const coords = points.split(' ').filter(p => p.trim()).map(p => {
      const parts = p.split(',');
      return { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
    });

    if (coords.length === 0) return null;
    if (coords.length === 1) return coords[0];

    // Use the middle segment of the path
    const midIndex = Math.floor(coords.length / 2);
    const p1 = coords[Math.max(0, midIndex - 1)];
    const p2 = coords[Math.min(coords.length - 1, midIndex)];

    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  } catch (e) {
    return null;
  }
}

export default function Links({ readonly = false }) {
  const api = useContext(storeContext);
  const links = useStore(api, "_links");
  const [selectedLink, setSelectedLink] = useState(null);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.wx-link-delete-icon') && !e.target.closest('.wx-line')) {
        setSelectedLink(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleClick = (e, link) => {
    if (readonly) return;
    e.stopPropagation();
    setSelectedLink(link.id === selectedLink ? null : link.id);
  };

  const handleDelete = (e, linkId) => {
    if (readonly) return;
    e.stopPropagation();
    api.exec('delete-link', { id: linkId });
    setSelectedLink(null);
  };

  return (
    <svg className="wx-dkx3NwEn wx-links">
      {(links || []).map((link) => {
        const isSelected = selectedLink === link.id;
        const iconPos = getLinkIconPosition(link.$p);

        return (
          <g key={link.id}>
            <polyline
              className={`wx-dkx3NwEn wx-line ${isSelected ? 'wx-selected' : ''}`}
              points={link.$p}
              onClick={(e) => handleClick(e, link)}
            />
            {isSelected && iconPos && (
              <g
                className="wx-link-delete-icon"
                transform={`translate(${iconPos.x - 12}, ${iconPos.y - 12})`}
                onClick={(e) => handleDelete(e, link.id)}
              >
                <rect
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                  rx="3"
                  className="wx-delete-box"
                />
                <path
                  d="M8 8 L16 16 M16 8 L8 16"
                  className="wx-delete-x"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
