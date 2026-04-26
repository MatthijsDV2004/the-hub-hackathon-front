'use client'

import type React from 'react'

const DEFAULT_CUT = 22
const PANEL_BORDER_WIDTH = 4

function hexClip(cut: number) {
  return `polygon(${cut}px 0, calc(100% - ${cut}px) 0, 100% ${cut}px, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, ${cut}px 100%, 0 calc(100% - ${cut}px), 0 ${cut}px)`
}

export interface HexPanelProps {
  children: React.ReactNode
  fill?: string
  borderColor?: string
  cut?: number
  className?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export default function HexPanel({
  children,
  fill = 'var(--fp-surface-primary)',
  borderColor = 'var(--fp-panel-border)',
  cut = DEFAULT_CUT,
  className,
  style,
  contentStyle,
}: HexPanelProps) {
  const innerCut = Math.max(0, cut - PANEL_BORDER_WIDTH)

  return (
    <div className={className} style={{ position: 'relative', overflow: 'visible', display: 'flex', flexDirection: 'column', ...style }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: hexClip(cut),
          background: borderColor,
          boxShadow: '0 0 0 1px var(--fp-panel-border), 0 0 20px var(--fp-panel-glow-1), 0 0 44px var(--fp-panel-glow-2), 0 0 76px var(--fp-panel-glow-3)',
          filter: 'drop-shadow(0 0 10px var(--fp-panel-drop-1)) drop-shadow(0 0 24px var(--fp-panel-drop-2)) drop-shadow(0 0 40px var(--fp-panel-drop-3)) drop-shadow(0 10px 18px rgba(0,0,0,0.55))',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          flex: 1,
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
