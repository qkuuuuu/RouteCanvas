"use client";
import * as React from "react";
import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { Transition } from "@/types/schema";

function TransitionEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const transition = (data as { transition: Transition } | undefined)?.transition;
  const isScroll = transition?.mode === "scroll";
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = transition
    ? isScroll
      ? "↓ 滚动续页"
      : `${transition.source.event ?? "onClick"}${
          transition.guard?.requireAuth ? " · 需登录" : ""
        }`
    : "";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={selected ? "transition-edge selected" : "transition-edge"}
        style={{
          stroke: selected ? "#2563eb" : isScroll ? "#8b5cf6" : "#9ca3af",
          strokeWidth: selected ? 2.5 : 1.8,
          strokeDasharray: isScroll ? "6 3" : undefined,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`nodrag nopan rounded px-1.5 py-0.5 text-[10px] shadow-sm border ${
              isScroll
                ? "bg-violet-50 border-violet-200 text-violet-600 font-medium"
                : "bg-white border-gray-200 text-gray-500"
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const TransitionEdge = memo(TransitionEdgeInner);
