// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { SunburstNode } from "@/types/charts";
import { EnhancedSunburstNode } from "@/services/portfolioSunburstService";
import { categoryColorForNodePath, generateDynamicLegend, CATEGORY_COLORS, PLATFORM_COLORS, PLATFORM_COLOR_MAP, hslToString } from "@/utils/sunburstColors";
import { computeTotal } from "@/utils/sunburstData";
import { FloatingDeviceCard } from "@/components/product/FloatingDeviceCard";

interface PortfolioSunburstProps {
  data: EnhancedSunburstNode;
  title?: string;
  totalLabel?: string;
  height?: number;
  onDeviceDoubleClick?: (productId: string, devicePath: string[]) => void;
}

export function PortfolioSunburst({ 
  data, 
  title = "Product Portfolio Breakdown", 
  totalLabel = "Total Portfolio", 
  height = 520,
  onDeviceDoubleClick
}: PortfolioSunburstProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const zoomToRef = useRef<((node: d3.HierarchyRectangularNode<SunburstNode>) => void) | null>(null);
  const focusNodeRef = useRef<d3.HierarchyRectangularNode<SunburstNode> | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [selectedInfo, setSelectedInfo] = useState<{
    path: string[];
    value: number;
    percentOfParent: number;
    percentOfTotal: number;
  } | null>(null);
  const [focusedLegendData, setFocusedLegendData] = useState<Array<{ label: string; color: string }>>([]);
  const [hoveredDevice, setHoveredDevice] = useState<{ productId: string; x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setWidth(Math.max(320, cr.width));
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const metrics = useMemo(() => {
    const r = Math.min(width, height) / 2 - 10;
    const io = Math.max(24, Math.min(72, r * 0.22));
    const br = Math.max(0, r - io);
    return { radius: r, innerOffset: io, baseRadius: br };
  }, [width, height]);

  const root = useMemo(() => {
    const h = d3
      .hierarchy<EnhancedSunburstNode>(data)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    return d3.partition<any>().size([2 * Math.PI, metrics.baseRadius])(h);
  }, [data, metrics.baseRadius]);

// Pre-compute grand total for UI summaries
const grandTotal = useMemo(() => computeTotal(data), [data]);

// Find a node by its breadcrumb path (including root at index 0)
function findNodeByPath(path: string[]) {
  let node: any = root as any;
  for (let i = 1; i < path.length; i++) {
    const name = path[i];
    const next = node.children?.find((c: any) => c.data.name === name);
    if (!next) return node;
    node = next;
  }
  return node;
}

// Keyboard shortcuts for zooming
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (!zoomToRef.current) return;
    if (e.key === "+" || e.key === "=") {
      const current = focusNodeRef.current || (root as any);
      const firstChild = current.children && current.children[0];
      if (firstChild) zoomToRef.current(firstChild);
    } else if (e.key === "-" || e.key === "_") {
      const current = focusNodeRef.current || (root as any);
      const parent = current.parent || (root as any);
      zoomToRef.current(parent);
    } else if (e.key === "Escape") {
      zoomToRef.current(root as any);
    }
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [root]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerOffset = metrics.innerOffset;
    const g = svg
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height)
      .append("g");

    const arc = d3
      .arc<d3.HierarchyRectangularNode<SunburstNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0 + innerOffset)
      .outerRadius((d) => d.y1 - 1 + innerOffset);

    // Function to get fill color based on current focus
    function getFillColor(d: any, currentFocus: any) {
      const pathFromRoot = d.ancestors().map((n: any) => n.data.name).reverse();
      
      // If we're at root level (depth 1 = categories), use category colors
      if (currentFocus === root && d.depth === 1) {
        return categoryColorForNodePath(pathFromRoot, d.depth);
      }
      // If we're zoomed into a category and this is a Basic UDI-DI (depth 2), use platform colors
      else if (currentFocus !== root && currentFocus.depth === 1 && d.depth === 2) {
        // Use Basic UDI-DI name for consistent coloring with predefined mapping
        const basicUdiDiName = d.data.name;
        
        // Check if we have a predefined mapping first
        let colorIndex = PLATFORM_COLOR_MAP[basicUdiDiName];
        
        if (colorIndex === undefined) {
          // Fall back to hash-based assignment for unknown Basic UDI-DI values
          let hash = 0;
          for (let i = 0; i < basicUdiDiName.length; i++) {
            hash = basicUdiDiName.charCodeAt(i) + ((hash << 5) - hash);
          }
          colorIndex = Math.abs(hash) % PLATFORM_COLORS.length;
        }
        
        return hslToString(PLATFORM_COLORS[colorIndex]);
      }
      // For deeper levels, use original logic
      else {
        return categoryColorForNodePath(pathFromRoot, d.depth);
      }
    }

    const path = g
      .append("g")
      .selectAll("path")
      .data(root.descendants().filter((d) => d.depth))
      .join("path")
      .attr("fill", (d) => getFillColor(d, focusNodeRef.current || root))
      .attr("d", arc as any)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("cursor", (d) => (d.children ? "pointer" : "default"))
      .on("mouseenter", function (event, d) {
        const productId = (d as any).data.productId;
        if (productId) {
          // Leaf node with productId - show device hover card
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect();
          hoverTimeoutRef.current = setTimeout(() => {
            setHoveredDevice({
              productId,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }, 400);
          // Hide simple tooltip
          const tooltip = tooltipRef.current;
          if (tooltip) tooltip.style.opacity = "0";
        } else {
          // Non-leaf: show simple tooltip
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          const pathLabels = d.ancestors().map((n) => n.data.name).reverse().slice(1).join(" > ");
          const count = d.value || 0;
          tooltip.style.opacity = "1";
          tooltip.textContent = `${pathLabels}: ${count}`;
        }
      })
      .on("mousemove", function (event, d) {
        const productId = (d as any).data.productId;
        const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect();
        if (productId) {
          // Update floating card position
          setHoveredDevice(prev => prev ? {
            ...prev,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          } : null);
        } else {
          const tooltip = tooltipRef.current;
          if (!tooltip) return;
          tooltip.style.left = `${event.clientX - rect.left + 10}px`;
          tooltip.style.top = `${event.clientY - rect.top + 10}px`;
        }
      })
      .on("mouseleave", function () {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        setHoveredDevice(null);
        const tooltip = tooltipRef.current;
        if (!tooltip) return;
        tooltip.style.opacity = "0";
      });

    // Ring separators to clearly divide rings
    const maxDepth = d3.max(root.descendants(), (d) => d.depth) || 0;
    const sepGroup = g.append("g").attr("pointer-events", "none").attr("aria-hidden", "true");
    for (let dep = 1; dep <= maxDepth; dep++) {
      const sample = root.descendants().find((nd) => nd.depth === dep);
      if (!sample) continue;
      sepGroup
        .append("circle")
        .attr("fill", "none")
        .attr("r", sample.y0 + innerOffset)
        .attr("stroke", "hsl(var(--border))")
        .attr("stroke-width", 1);
    }

    // Extremely aggressive label filtering to completely prevent overlaps
    function shouldShowLabel(dLike: { x0: number; x1: number; y0: number; y1: number }, depth: number) {
      const angle = dLike.x1 - dLike.x0;
      const rMid = (dLike.y0 + dLike.y1) / 2 + innerOffset;
      const ringThickness = dLike.y1 - dLike.y0;
      const arcLenPx = angle * rMid;
      
      // Extremely strict requirements - only show labels on very large segments
      if (depth === 1) {
        // Categories: only show if extremely large (almost half the chart)
        return arcLenPx > 300 && ringThickness > 40 && angle > 0.8;
      } else if (depth === 2) {
        // Basic UDI-DI: only show if very large
        return arcLenPx > 200 && ringThickness > 35 && angle > 0.5;
      } else {
        // Models and products: extremely restrictive - essentially never show
        return arcLenPx > 180 && ringThickness > 30 && angle > 0.4;
      }
    }

    // Center labels within their segments
    function getRadialPosition(d: any): number {
      const segmentInner = d.y0 + innerOffset;
      const segmentOuter = d.y1 + innerOffset;
      
      // Always center labels in the middle of their segment
      return (segmentInner + segmentOuter) / 2;
    }

    // More permissive label requirements since we're using depth-based positioning
    function canShowLabel(d: any): boolean {
      const angle = d.x1 - d.x0;
      const rMid = (d.y0 + d.y1) / 2 + innerOffset;
      const arcLenPx = angle * rMid;
      
      // More permissive since positioning prevents overlaps
      if (d.depth === 1) return arcLenPx > 40 && angle > 0.08; // Categories
      if (d.depth === 2) return arcLenPx > 35 && angle > 0.06; // Basic UDI-DI  
      return arcLenPx > 25 && angle > 0.04; // Models/Products
    }

    // Get nodes that should have labels - using depth-based positioning
    const labelableNodes = root.descendants().filter((d) => d.depth > 0 && canShowLabel(d));

    // Create label group for backgrounds and text
    const labelGroup = g.append("g").attr("pointer-events", "none");

    // Add background rectangles for text labels with depth-based positioning
    const labelBgs = labelGroup
      .selectAll(".label-bg")
      .data(labelableNodes)
      .join("rect")
      .attr("class", "label-bg")
      .attr("transform", function (d) {
        const angle = (d.x0 + d.x1) / 2;
        const radius = getRadialPosition(d);
        const x = angle * (180 / Math.PI);
        return `rotate(${x - 90}) translate(${radius},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("x", function(d) {
        // Calculate percentage text for sizing
        let percentage: number;
        if (d.parent) {
          percentage = ((d.value || 0) / (d.parent.value || 1)) * 100;
        } else {
          percentage = 100;
        }
        
        let text: string;
        if (percentage >= 10) {
          text = `${percentage.toFixed(0)}%`;
        } else {
          text = `${percentage.toFixed(1)}%`;
        }
        
        const fontSize = d.depth === 1 ? 14 : 12;
        const textWidth = text.length * fontSize * 0.6;
        return -textWidth / 2 - 2; // Center with small padding
      })
      .attr("y", -8) // Center vertically with padding
      .attr("width", function(d) {
        // Calculate percentage text for sizing
        let percentage: number;
        if (d.parent) {
          percentage = ((d.value || 0) / (d.parent.value || 1)) * 100;
        } else {
          percentage = 100;
        }
        
        let text: string;
        if (percentage >= 10) {
          text = `${percentage.toFixed(0)}%`;
        } else {
          text = `${percentage.toFixed(1)}%`;
        }
        
        const fontSize = d.depth === 1 ? 14 : 12;
        return text.length * fontSize * 0.6 + 4; // Text width plus padding
      })
      .attr("height", 16)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", "rgba(0,0,0,0.75)")
      .attr("stroke", "rgba(255,255,255,0.3)")
      .attr("stroke-width", 1);

    // Add text labels on top of backgrounds with depth-based positioning
    const label = labelGroup
      .selectAll(".label-text")
      .data(labelableNodes)
      .join("text")
      .attr("class", "label-text")
      .attr("text-anchor", "middle")
      .attr("transform", function (d) {
        const angle = (d.x0 + d.x1) / 2;
        const radius = getRadialPosition(d);
        const x = angle * (180 / Math.PI);
        return `rotate(${x - 90}) translate(${radius},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .style("font-size", function(d) {
        const angle = d.x1 - d.x0;
        const rMid = (d.y0 + d.y1) / 2 + innerOffset;
        const arcLenPx = angle * rMid;
        if (d.depth === 1) return "14px"; // Categories - larger
        return arcLenPx > 100 ? "12px" : "10px";
      })
      .style("font-weight", "600")
      .text((d) => {
        // Calculate percentage of parent or total
        let percentage: number;
        
        if (d.parent) {
          // Percentage of parent
          percentage = ((d.value || 0) / (d.parent.value || 1)) * 100;
        } else {
          // Root node - 100%
          percentage = 100;
        }
        
        // Format percentage based on size
        if (percentage >= 10) {
          return `${percentage.toFixed(0)}%`;
        } else if (percentage >= 1) {
          return `${percentage.toFixed(1)}%`;
        } else {
          return `${percentage.toFixed(1)}%`;
        }
      });

    // Generate legend data based on current focus
    function generateFocusedLegend(focusNode: d3.HierarchyRectangularNode<EnhancedSunburstNode>): Array<{ label: string; color: string }> {
      if (!focusNode.children) return [];
      
      return focusNode.children.map((child) => {
        const childName = child.data.name;
        
        // If we're at root level showing categories, use category colors
        if (focusNode === root) {
          return {
            label: childName,
            color: categoryColorForNodePath([root.data.name, childName], 1)
          };
        }
        // If we're showing Basic UDI-DI within a category, use platform-specific colors
        else if (focusNode.depth === 1) {
          // Check if we have a predefined mapping first
          let colorIndex = PLATFORM_COLOR_MAP[childName];
          
          if (colorIndex === undefined) {
            // Fall back to hash-based assignment for unknown Basic UDI-DI values
            let hash = 0;
            for (let i = 0; i < childName.length; i++) {
              hash = childName.charCodeAt(i) + ((hash << 5) - hash);
            }
            colorIndex = Math.abs(hash) % PLATFORM_COLORS.length;
          }
          
          return {
            label: childName,
            color: hslToString(PLATFORM_COLORS[colorIndex])
          };
        }
        // For deeper levels, use original logic
        else {
          const pathFromRoot = child.ancestors().map((n) => n.data.name).reverse();
          return {
            label: childName,
            color: categoryColorForNodePath(pathFromRoot, child.depth)
          };
        }
      });
    }

    // Center labels removed; using header summary above the chart
    function updateSelectionUI(node: d3.HierarchyRectangularNode<EnhancedSunburstNode>) {
      const pathNames = node.ancestors().map((n) => n.data.name).reverse();
      const val = node.value || 0;
      const parentVal = node.parent?.value || grandTotal || 1;
      setSelectedInfo({
        path: pathNames,
        value: val,
        percentOfParent: parentVal ? val / parentVal : 1,
        percentOfTotal: grandTotal ? val / grandTotal : 1,
      });
      
      // Update legend based on current focus
      setFocusedLegendData(generateFocusedLegend(node));
    }

    // Zoom helper (also used by keyboard and buttons)
    function zoomTo(p: d3.HierarchyRectangularNode<EnhancedSunburstNode>) {
      focusNodeRef.current = p;

      root.each((d) => {
        (d as any).target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.y0),
          y1: Math.max(0, d.y1 - p.y0),
        };
      });

      const t = g.transition().duration(650);

      path
        .transition(t as any)
        .tween("data", (d: any) => {
          const i = d3.interpolate(d.current || { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 }, d.target);
          return (tt: number) => (d.current = i(tt));
        })
        .attrTween("d", (d: any) => () => arc(d.current))
        .attr("fill", (d: any) => getFillColor(d, p)); // Update colors on zoom

      // Label and background transitions for smooth zoom with staggered positioning
      // Recalculate staggered positions for the new zoom state
      const transitionLabelableNodes = root.descendants().filter((d: any) => {
        const angle = d.target.x1 - d.target.x0;
        const rMid = (d.target.y0 + d.target.y1) / 2 + innerOffset;
        const arcLenPx = angle * rMid;
        
        if (d.depth === 1) return arcLenPx > 50 && angle > 0.12;
        if (d.depth === 2) return arcLenPx > 40 && angle > 0.08;
        return arcLenPx > 30 && angle > 0.06;
      });
      
      // Create nodes with target positions for staggering calculation
      const transitionNodes = transitionLabelableNodes.map((d: any) => ({
        ...d,
        x0: d.target.x0,
        x1: d.target.x1,
        y0: d.target.y0,
        y1: d.target.y1
      }));
      
      // Helper function for transition - center labels in segments
      function getTransitionRadialPosition(d: any): number {
        const segmentInner = d.target.y0 + innerOffset;
        const segmentOuter = d.target.y1 + innerOffset;
        
        // Always center labels in the middle of their segment
        return (segmentInner + segmentOuter) / 2;
      }

      labelBgs
        .transition(t as any)
        .attr("transform", function (d: any) {
          const angle = (d.target.x0 + d.target.x1) / 2;
          const radius = getTransitionRadialPosition(d);
          const x = angle * (180 / Math.PI);
          return `rotate(${x - 90}) translate(${radius},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .style("opacity", (d: any) => {
          // Check if this node should be visible in transition
          const isVisible = transitionLabelableNodes.some(tn => 
            tn.data.name === d.data.name && tn.depth === d.depth
          );
          return isVisible ? 1 : 0;
        });

      label
        .transition(t as any)
        .attr("transform", function (d: any) {
          const angle = (d.target.x0 + d.target.x1) / 2;
          const radius = getTransitionRadialPosition(d);
          const x = angle * (180 / Math.PI);
          return `rotate(${x - 90}) translate(${radius},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .style("opacity", (d: any) => {
          // Check if this node should be visible in transition
          const isVisible = transitionLabelableNodes.some(tn => 
            tn.data.name === d.data.name && tn.depth === d.depth
          );
          return isVisible ? 1 : 0;
        });

      updateSelectionUI(p);
    }

    // Expose zoomTo for external controls
    zoomToRef.current = zoomTo;

    // Click zoom + update selection panel
    path.on("click", function (event, d) {
      if ((d as any).children) {
        zoomTo(d as any);
      } else {
        // Leaf: still update selection UI
        updateSelectionUI(d as any);
      }
    });

    // Double-click handler - navigate to product page for devices, zoom for categories/platforms
    path.on("dblclick", function (event, d) {
      if (!(d as any).children) {
        // This is a device (leaf node) - navigate to product page
        const devicePath = (d as any).ancestors().map((n: any) => n.data.name).reverse();
        const productId = (d as any).data.productId;

        if (onDeviceDoubleClick && productId) {
          onDeviceDoubleClick(productId, devicePath);
        }
      } else {
        // This is a category/platform - zoom into it
        zoomTo(d as any);
      }
    });

    // Initialize selection to root
    updateSelectionUI(root as any);
  }, [root, width, height, grandTotal, totalLabel, metrics]);

  return (
    <div ref={containerRef} className="w-full">
      {title && (
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <span className="text-sm text-muted-foreground">{totalLabel}: {grandTotal}</span>
        </div>
      )}
      {selectedInfo && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="font-medium">Selected:</span>{" "}
            {selectedInfo.path.length > 1 ? (
              <>
                {selectedInfo.path.slice(1).map((name, idx) => {
                  const isLast = idx === selectedInfo.path.slice(1).length - 1;
                  return (
                    <span key={idx}>
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => {
                          const targetPath = [selectedInfo.path[0], ...selectedInfo.path.slice(1, idx + 2)];
                          const node = findNodeByPath(targetPath);
                          if (zoomToRef.current) zoomToRef.current(node as any);
                        }}
                        aria-label={`Zoom to ${name}`}
                      >
                        {name}
                      </button>
                      {!isLast && <span>{" > "}</span>}
                    </span>
                  );
                })}
              </>
            ) : (
              <span>{totalLabel}</span>
            )}
            <span className="ml-2 text-muted-foreground">
              {selectedInfo.value} • {(selectedInfo.percentOfParent * 100).toFixed(1)}% of parent • {(selectedInfo.percentOfTotal * 100).toFixed(1)}% of total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              onClick={() => {
                const current: any = focusNodeRef.current || (root as any);
                const firstChild = current.children && current.children[0];
                if (firstChild && zoomToRef.current) zoomToRef.current(firstChild);
              }}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              +
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              onClick={() => {
                const current: any = focusNodeRef.current || (root as any);
                const parent = current.parent || (root as any);
                if (zoomToRef.current) zoomToRef.current(parent);
              }}
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              −
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              onClick={() => {
                if (zoomToRef.current) zoomToRef.current(root as any);
              }}
              aria-label="Reset zoom"
              title="Reset zoom (Esc)"
            >
              Reset
            </button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <svg ref={svgRef} role="img" aria-label="Sunburst chart" />
        <div ref={tooltipRef} className="pointer-events-none absolute z-10 rounded-md bg-background/90 px-2 py-1 text-sm shadow" style={{ opacity: 0 }} />
        {hoveredDevice && (
          <div className="pointer-events-none">
            <FloatingDeviceCard
              productId={hoveredDevice.productId}
              x={hoveredDevice.x}
              y={hoveredDevice.y}
            />
          </div>
        )}
      </div>
      {/* Dynamic Legend based on current focus */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {focusedLegendData.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: item.color }} aria-hidden />
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
