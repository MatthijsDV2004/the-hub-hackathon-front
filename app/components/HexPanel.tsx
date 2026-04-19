'use client'

import type React from 'react'

const CUT_CORNER_SIZE = 22
const PANEL_BORDER_WIDTH = 4

function hexClip(cut: number) {
  return `polygon(${cut}px 0, calc(100% - ${cut}px) 0, 100% ${cut}px, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, ${cut}px 100%, 0 calc(100% - ${cut}px), 0 ${cut}px)`
}

export interface HexPanelProps {
  children: React.ReactNode
  fill?: string
  borderColor?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export default function HexPanel({
  children,
  fill = 'var(--fp-surface-primary)',
  borderColor = 'var(--fp-panel-border)',
  style,
  contentStyle,
}: HexPanelProps) {
  const innerCut = Math.max(0, CUT_CORNER_SIZE - PANEL_BORDER_WIDTH)

  return (
    <div style={{ position: 'relative', overflow: 'visible', ...style }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: hexClip(CUT_CORNER_SIZE),
          background: borderColor,
          boxShadow: '0 0 0 1px var(--fp-panel-border), 0 0 20px var(--fp-panel-glow-1), 0 0 44px var(--fp-panel-glow-2), 0 0 76px var(--fp-panel-glow-3)',
          filter: 'drop-shadow(0 0 10px var(--fp-panel-drop-1)) drop-shadow(0 0 24px var(--fp-panel-drop-2)) drop-shadow(0 0 40px var(--fp-panel-drop-3)) drop-shadow(0 10px 18px rgba(0,0,0,0.55))',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          margin: PANEL_BORDER_WIDTH,
          clipPath: hexClip(innerCut),
          background: fill,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
