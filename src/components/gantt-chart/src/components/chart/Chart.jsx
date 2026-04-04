import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useContext,
  useCallback,
} from 'react';
import CellGrid from './CellGrid.jsx';
import Bars from './Bars.jsx';
import Links from './Links.jsx';
import { hotkeys } from '@svar-ui/grid-store';
import storeContext from '../../context';
import { useStore, useStoreWithCounter } from '@svar-ui/lib-react';
import { useSafeStore } from '../../helpers/safeUseStore';
import './Chart.css';

function Chart(props) {
  const {
    readonly,
    fullWidth,
    fullHeight,
    taskTemplate,
    cellBorders,
    highlightTime,
  } = props;

  const api = useContext(storeContext);

  const [selected, selectedCounter] = useStoreWithCounter(api, "_selected");
  const rScrollLeft = useStore(api, "scrollLeft");
  const rScrollTop = useStore(api, "scrollTop");
  const cellHeight = useStore(api, "cellHeight");
  const cellWidth = useStore(api, "cellWidth");
  const scales = useStore(api, "_scales");
  const markers = useStore(api, "_markers");
  const rScrollTask = useSafeStore(api, "_scrollTask");
  const zoom = useStore(api, "zoom");

  const [chartHeight, setChartHeight] = useState();
  const [scrollLeft, setScrollLeft] = useState();
  const [scrollTop, setScrollTop] = useState();
  const chartRef = useRef(null);
  const isScrollingProgrammatically = useRef(false);
  const lastScrollPos = useRef({ top: 0, left: 0 });
  const scrollTimeout = useRef(null);

  const extraRows = 1;
  useEffect(() => {
    // Only update local state if the store value is different from what we last sent
    if (rScrollLeft !== lastScrollPos.current.left && rScrollLeft !== scrollLeft) {
      setScrollLeft(rScrollLeft);
    }
    if (rScrollTop !== lastScrollPos.current.top && rScrollTop !== scrollTop) {
      setScrollTop(rScrollTop);
    }
  }, [rScrollLeft, rScrollTop]);


  const selectStyle = useMemo(() => {
    const t = [];
    if (selected && selected.length && cellHeight) {
      selected.forEach((obj) => {
        t.push({ height: `${cellHeight}px`, top: `${obj.$y - 3}px` });
      });
    }
    return t;
  }, [selectedCounter, cellHeight]);

  useEffect(() => {
    dataRequest();
  }, [chartHeight]);

  const chartGridHeight = useMemo(
    () => Math.max(chartHeight || 0, fullHeight),
    [chartHeight, fullHeight],
  );

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const tolerance = 2;

    let shouldUpdate = false;

    // Only update if this is NOT an echo of our own scroll
    // (i.e., the value is different from both what we last sent AND current DOM position)
    if (typeof scrollTop === 'number') {
      const isDifferentFromLastSent = Math.abs(scrollTop - lastScrollPos.current.top) > tolerance;
      const isDifferentFromDOM = Math.abs(scrollTop - el.scrollTop) > tolerance;
      if (isDifferentFromLastSent && isDifferentFromDOM) {
        isScrollingProgrammatically.current = true;
        el.scrollTop = scrollTop;
        shouldUpdate = true;
      }
    }

    if (typeof scrollLeft === 'number') {
      const isDifferentFromLastSent = Math.abs(scrollLeft - lastScrollPos.current.left) > tolerance;
      const isDifferentFromDOM = Math.abs(scrollLeft - el.scrollLeft) > tolerance;
      if (isDifferentFromLastSent && isDifferentFromDOM) {
        isScrollingProgrammatically.current = true;
        el.scrollLeft = scrollLeft;
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      // Use requestAnimationFrame to reset the flag after scroll events have fired
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isScrollingProgrammatically.current = false;
        });
      });
    }
  }, [scrollTop, scrollLeft]);

  const onScroll = () => {
    // Ignore scroll events triggered by programmatic changes
    if (isScrollingProgrammatically.current) return;

    // Call dataRequest immediately for smooth rendering
    dataRequest();

    // Debounce store updates to prevent feedback loops
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      const scroll = { left: true, top: true };
      setScroll(scroll);
      scrollTimeout.current = null;
    }, 15);
  };

  function setScroll(scroll) {
    const el = chartRef.current;
    if (!el) return;
    const pos = {};
    if (scroll.top) {
      pos.top = el.scrollTop;
      lastScrollPos.current.top = el.scrollTop;
    }
    if (scroll.left) {
      pos.left = el.scrollLeft;
      lastScrollPos.current.left = el.scrollLeft;
    }
    api.exec('scroll-chart', pos);
  }

  function dataRequest() {
    const el = chartRef.current;
    const clientHeightLocal = chartHeight || 0;
    const num = Math.ceil(clientHeightLocal / (cellHeight || 1)) + 1;
    const pos = Math.floor(((el && el.scrollTop) || 0) / (cellHeight || 1));
    const start = Math.max(0, pos - extraRows);
    const end = pos + num + extraRows;
    const from = start * (cellHeight || 0);
    api.exec('render-data', {
      start,
      end,
      from,
    });
  }

  const showTask = useCallback(
    (value) => {
      if (!value) return;

      const { id, mode } = value;

      if (mode.toString().indexOf('x') < 0) return;
      const el = chartRef.current;
      if (!el) return;
      const { clientWidth } = el;
      const task = api.getTask(id);
      if (task.$x + task.$w < (scrollLeft || 0)) {
        setScrollLeft(task.$x - (cellWidth || 0));
      } else if (task.$x >= clientWidth + (scrollLeft || 0)) {
        const width = clientWidth < task.$w ? cellWidth || 0 : task.$w;
        setScrollLeft(task.$x - clientWidth + width);
      }
    },
    [api, scrollLeft, cellWidth],
  );

  useEffect(() => {
    showTask(rScrollTask);
  }, [rScrollTask]);


  function onWheel(e) {
    if (zoom && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const el = chartRef.current;
      const dir = -Math.sign(e.deltaY);
      const offset = e.clientX - (el ? el.getBoundingClientRect().left : 0);
      api.exec('zoom-scale', {
        dir,
        offset,
      });
    }
  }

  function getHoliday(cell) {
    const style = highlightTime(cell.date, cell.unit);
    if (style)
      return {
        css: style,
        width: cell.width,
      };
    return null;
  }

  // Recalculate marker positions for exact date placement within cells
  const adjustedMarkers = useMemo(() => {
    try {
      if (!markers || !markers.length || !scales || !scales.rows || !scales.rows.length) {
        return markers;
      }

      const finestRow = scales.rows[scales.rows.length - 1];
      const cells = finestRow && finestRow.cells;
      if (!cells || cells.length === 0) return markers;

      return markers.map((marker) => {
        try {
          if (!marker || !marker.start) return marker;

          const markerDate = marker.start instanceof Date ? marker.start : new Date(marker.start);
          const markerTime = markerDate.getTime();
          if (isNaN(markerTime)) return marker;

          let cumulativeLeft = 0;
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (!cell || cell.date == null) {
              cumulativeLeft += (cell && cell.width) || 0;
              continue;
            }

            const cellDate = cell.date instanceof Date ? cell.date : new Date(cell.date);
            const cellStart = cellDate.getTime();
            if (isNaN(cellStart)) {
              cumulativeLeft += cell.width || 0;
              continue;
            }

            // Cell end = next cell's start date
            let cellEnd;
            const nextCell = cells[i + 1];
            if (nextCell && nextCell.date != null) {
              const nd = nextCell.date instanceof Date ? nextCell.date : new Date(nextCell.date);
              cellEnd = nd.getTime();
            } else if (typeof finestRow.add === 'function') {
              // row.add is the store's date-advance function
              try {
                cellEnd = finestRow.add(cellDate, 1).getTime();
              } catch (_) {
                cumulativeLeft += cell.width || 0;
                continue;
              }
            } else {
              cumulativeLeft += cell.width || 0;
              continue;
            }

            if (isNaN(cellEnd) || cellEnd <= cellStart) {
              cumulativeLeft += cell.width || 0;
              continue;
            }

            if (markerTime >= cellStart && markerTime < cellEnd) {
              const ratio = (markerTime - cellStart) / (cellEnd - cellStart);
              return { ...marker, left: cumulativeLeft + ratio * (cell.width || 0) };
            }

            cumulativeLeft += cell.width || 0;
          }

          return marker;
        } catch (_) {
          return marker;
        }
      });
    } catch (_) {
      return markers;
    }
  }, [markers, scales]);

  const holidays = useMemo(() => {
    return scales &&
      (scales.minUnit === 'hour' || scales.minUnit === 'day') &&
      highlightTime
      ? scales.rows[scales.rows.length - 1].cells.map(getHoliday)
      : null;
  }, [scales, highlightTime]);

  function handleHotkey(ev) {
    ev.eventSource = 'chart';
    api.exec('hotkey', ev);
  }

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const update = () => setChartHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [chartRef.current]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const cleanup = hotkeys(el, {
      keys: {
        arrowup: true,
        arrowdown: true,
      },
      exec: (v) => handleHotkey(v),
    });
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [chartRef.current]);
  
  useEffect(() => {
    const node = chartRef.current;
    if (!node) return;

    const handler = onWheel;
    node.addEventListener('wheel', handler);
    return () => {
      node.removeEventListener('wheel', handler);
    };
  }, [onWheel])

  return (
    <div
      className="wx-mR7v2Xag wx-chart"
      tabIndex={-1}
      ref={chartRef}
      onScroll={onScroll}
    >
      {adjustedMarkers && adjustedMarkers.length ? (
        <div
          className="wx-mR7v2Xag wx-markers"
          style={{ height: `${chartGridHeight}px` }}
        >
          {adjustedMarkers.map((marker, i) => (
            <div
              key={i}
              className={`wx-mR7v2Xag wx-marker ${marker.css || ''}`}
              style={{ left: `${marker.left}px` }}
            >
              <div className="wx-mR7v2Xag wx-content">{marker.text}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div
        className="wx-mR7v2Xag wx-area"
        style={{ width: `${fullWidth}px`, height: `${chartGridHeight}px` }}
      >
        {holidays ? (
          <div
            className="wx-mR7v2Xag wx-gantt-holidays"
            style={{ height: '100%' }}
          >
            {holidays.map((holiday, i) =>
              holiday ? (
                <div
                  key={i}
                  className={'wx-mR7v2Xag ' + holiday.css}
                  style={{
                    width: `${holiday.width}px`,
                    left: `${i * holiday.width}px`,
                  }}
                />
              ) : null,
            )}
          </div>
        ) : null}

        <CellGrid borders={cellBorders} />

        {selected && selected.length
          ? selected.map((obj, index) =>
              obj.$y ? (
                <div
                  key={obj.id}
                  className="wx-mR7v2Xag wx-selected"
                  data-id={obj.id}
                  style={selectStyle[index]}
                ></div>
              ) : null,
            )
          : null}

        <Links readonly={readonly} />
        <Bars readonly={readonly} taskTemplate={taskTemplate} />
      </div>
    </div>
  );
}

export default Chart;
