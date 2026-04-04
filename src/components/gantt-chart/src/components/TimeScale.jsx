import { useContext } from 'react';
import storeContext from '../context';
import { useStore } from '@svar-ui/lib-react';
import { format as dateFnsFormat } from 'date-fns';
import './TimeScale.css';

/**
 * Fix: @svar-ui/gantt-store's internal date-fns format() gets tree-shaken in production.
 * The cell.value shows raw format tokens ("MMMM yyy", "D") instead of formatted dates.
 * This function detects broken values and re-formats using our own date-fns import.
 */
function fixCellValue(cell) {
  if (!cell || !cell.date) return cell?.value || '';

  const value = cell.value;
  // Detect broken format tokens — if value contains uppercase format chars, it's not formatted
  if (typeof value === 'string' && /^[MDYQHhWwams\s:/']+$/.test(value)) {
    // The library failed to format — do it ourselves
    try {
      const date = cell.date instanceof Date ? cell.date : new Date(cell.date);
      if (isNaN(date.getTime())) return value;

      // Determine format from unit
      switch (cell.unit) {
        case 'year': return dateFnsFormat(date, 'yyyy');
        case 'quarter': return 'Q' + Math.ceil((date.getMonth() + 1) / 3);
        case 'month': return dateFnsFormat(date, 'MMMM yyyy');
        case 'week': return 'week ' + dateFnsFormat(date, 'w');
        case 'day': return dateFnsFormat(date, 'MMM d');
        case 'hour': return dateFnsFormat(date, 'HH:mm');
        default: return dateFnsFormat(date, 'MMM d, yyyy');
      }
    } catch {
      return value;
    }
  }
  return value;
}

function TimeScale(props) {
  const { highlightTime } = props;

  const api = useContext(storeContext);
  const scales = useStore(api, "_scales");
  const scrollLeft = useStore(api, "scrollLeft");

  const containerStyle = {
    width: `${(scales && scales.width) != null ? scales.width : 0}px`,
    left: `${-(scrollLeft != null ? scrollLeft : 0)}px`,
  };

  return (
    <div className="wx-ZkvhDKir wx-scale" style={containerStyle}>
      {(scales?.rows || []).map((row, rowIdx) => (
        <div
          className="wx-ZkvhDKir wx-row"
          style={{ height: `${row.height}px` }}
          key={rowIdx}
        >
          {(row.cells || []).map((cell, cellIdx) => {
            const extraClass = highlightTime
              ? highlightTime(cell.date, cell.unit)
              : '';
            const className = ['wx-cell', cell.css, extraClass]
              .filter(Boolean)
              .join(' ');
            return (
              <div
                className={'wx-ZkvhDKir ' + className}
                style={{ width: `${cell.width}px` }}
                key={cellIdx}
              >
                {fixCellValue(cell)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default TimeScale;
