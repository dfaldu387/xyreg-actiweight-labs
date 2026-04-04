import { format, isValid } from 'date-fns';
import './MyTooltipContent.css';

function MyTooltipContent(props) {
  const { data } = props;

  // Always show task name even if data is minimal
  if (!data) {
    return null;
  }

  const mask = 'yyyy.MM.dd';

  // Safely format dates
  const formatDate = (date) => {
    try {
      if (!date) return null;
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isValid(dateObj)) {
        return format(dateObj, mask);
      }
    } catch (e) {
      // Ignore formatting errors
    }
    return null;
  };

  // Calculate duration in days
  const getDuration = () => {
    try {
      if (data.duration !== null && data.duration !== undefined) {
        return data.duration;
      }
      if (data.start && data.end) {
        const startDate = new Date(data.start);
        const endDate = new Date(data.end);
        if (isValid(startDate) && isValid(endDate)) {
          return Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  };

  // Format task type for display
  const getDisplayType = () => {
    const type = data.type;
    if (!type) return null;

    const typeMap = {
      'summary': 'Summary',
      'task': 'Task',
      'milestone': 'Milestone',
      'category': 'Category',
      'not-started': 'Not Started',
      'running': 'In Progress',
      'overdue': 'Overdue',
      'on-time': 'On Time',
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const startFormatted = formatDate(data.start);
  const endFormatted = formatDate(data.end);
  const duration = getDuration();
  const displayType = getDisplayType();

  return (
    <div className="wx-SfydHtKO data">
      {/* Task Name */}
      <div className="wx-SfydHtKO text">
        <span className="wx-SfydHtKO caption">Task: </span>
        {data.text || 'Untitled'}
      </div>

      {/* Status/Type */}
      {displayType && (
        <div className="wx-SfydHtKO text">
          <span className="wx-SfydHtKO caption">Status: </span>
          {displayType}
        </div>
      )}

      {/* Start Date */}
      {startFormatted && (
        <div className="wx-SfydHtKO text">
          <span className="wx-SfydHtKO caption">Start: </span>
          {startFormatted}
        </div>
      )}

      {/* End Date */}
      {endFormatted && (
        <div className="wx-SfydHtKO text">
          <span className="wx-SfydHtKO caption">End: </span>
          {endFormatted}
        </div>
      )}

      {/* Duration */}
      {duration !== null && duration >= 0 && (
        <div className="wx-SfydHtKO text">
          <span className="wx-SfydHtKO caption">Duration: </span>
          {duration} {duration === 1 ? 'day' : 'days'}
        </div>
      )}

      {/* Assigned User */}
      {data.assigned && data.assigned !== 'Unassigned' && String(data.assigned).trim() !== '' && (
        <div className="wx-SfydHtKO text">
          <span className="wx-SfydHtKO caption">Assigned: </span>
          {typeof data.assigned === 'string' ? data.assigned : String(data.assigned)}
        </div>
      )}

      {/* Due Date */}
      {data.dueDate && formatDate(data.dueDate) && (
        <div className="wx-SfydHtKO text">
          <span className="wx-SfydHtKO caption">Due Date: </span>
          {formatDate(data.dueDate)}
        </div>
      )}
    </div>
  );
}

export default MyTooltipContent;
