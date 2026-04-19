'use client'

import { useEffect, useMemo, useState } from 'react'
import { QueryFetchPolicy } from 'firebase/data-connect'
import FloorPlanCanvas, { CATEGORIES, FLOORPLAN_CANVAS_SIZE, MARKER_CONFIGS, MarkerIcon, type CategoryId, type FloorPlanZone } from '../components/FloorPlanCanvas'
import HexPanel from '../components/HexPanel'
import LoadingAnimation from '@/components/LoadingAnimation'
import { dataConnect } from '../../src/lib/firebase'
import { getAllFloorPlans } from '../../src/dataconnect-generated'

// ── Types ─────────────────────────────────────────────────────────────────────

type MarkerType = 'entrance' | 'exit' | 'help_desk'

interface ShelfRow {
  shelf_uid?: string
  cat_id: string
  limit_per_student: number
  orientation: string
  rotation: number
  map_x: number
  map_y: number
  map_w: number
  map_h: number
}

interface MarkerPayload {
  type: MarkerType
  map_x: number
  map_y: number
  map_w: number
  map_h: number
}

interface WallPayload {
  orientation: string
  rotation: number
  map_x: number
  map_y: number
  map_w: number
  map_h: number
}

interface FloorPlanRecord {
  id: string
  name?: string | null
  isDeployed?: boolean | null
  shelves?: unknown | null
  walls?: unknown | null
  markers?: unknown | null
  updatedAt?: string | null
}

interface ShelfSummary {
  id: string
  name: string | null
  locationDescription: string | null
  shelfTag?: string | null
}

interface StudentInventoryItem {
  id: string
  shelfId: string | null
  shelf: ShelfSummary | null
  name: string
  brand: string
  quantity: number
  category: string | null
  type: string | null
  updatedAt: string | null
  size: string | null
}

function normalizeText(value: string | null | undefined) {
  return (value || '').toLowerCase().trim()
}

function extractShelfUidFromShelfTag(shelfTag: string | null | undefined): string | null {
  const normalized = (shelfTag || '').trim()
  if (!normalized) return null
  const match = normalized.match(/:shelf:([a-z0-9_-]+)/i)
  return match?.[1]?.trim() || null
}

function extractShelfUidFromShelfName(shelfName: string | null | undefined): string | null {
  const normalized = (shelfName || '').trim()
  if (!normalized) return null
  const match = normalized.match(/([a-z0-9]{8})(?!.*[a-z0-9])/i)
  return match?.[1]?.trim() || null
}

function resolveShelfUidForItem(item: StudentInventoryItem): string | null {
  return (
    extractShelfUidFromShelfTag(item.shelf?.shelfTag) ||
    extractShelfUidFromShelfName(item.shelf?.name)
  )
}

async function readApiPayload(response: Response): Promise<{
  json: Record<string, unknown> | null
  text: string
}> {
  const rawText = await response.text()
  if (!rawText) {
    return { json: null, text: '' }
  }

  try {
    return { json: JSON.parse(rawText) as Record<string, unknown>, text: rawText }
  } catch {
    return { json: null, text: rawText }
  }
}

function buildItemTitle(item: StudentInventoryItem) {
  const brand = (item.brand || '').trim()
  const name = (item.name || '').trim()
  return [brand, name].filter(Boolean).join(' ').trim() || 'Unknown item'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [shelves,              setShelves]              = useState<ShelfRow[]>([])
  const [walls,                setWalls]                = useState<WallPayload[]>([])
  const [markers,              setMarkers]              = useState<MarkerPayload[]>([])
  const [items,                setItems]                = useState<StudentInventoryItem[]>([])
  const [loading,              setLoading]              = useState(true)
  const [loadingItems,         setLoadingItems]         = useState(true)
  const [error,                setError]                = useState<string | null>(null)
  const [itemsError,           setItemsError]           = useState<string | null>(null)
  const [selectedZone,         setSelectedZone]         = useState<FloorPlanZone | null>(null)
  const canvasSize = FLOORPLAN_CANVAS_SIZE

  // Fetch deployed plan
  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await getAllFloorPlans(
          dataConnect,
          { fetchPolicy: QueryFetchPolicy.SERVER_ONLY }
        )
        if (!active) return

        const deployedPlans = (res.data.floorPlans as FloorPlanRecord[])
          .filter(plan => plan.isDeployed)
          .sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
            return bTime - aTime
          })

        const plan = deployedPlans[0]
        if (plan) {
          const nextShelves = (plan.shelves as ShelfRow[]) ?? []
          const nextWalls = (plan.walls as WallPayload[]) ?? []
          const nextMarkers = (plan.markers as MarkerPayload[]) ?? []

          setShelves(nextShelves)
          setWalls(nextWalls)
          setMarkers(nextMarkers)
          setError(null)
        } else {
          setShelves([])
          setWalls([])
          setMarkers([])
        }
      } catch (e) {
        if (!active) return
        setError('Could not load the floor plan. Please try again later.')
        console.error(e)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const intervalId = window.setInterval(load, 3000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  // Fetch current inventory list for area-level viewing
  useEffect(() => {
    let active = true

    async function loadItems() {
      setLoadingItems(true)

      try {
        const response = await fetch('/api/dataconnect/inventory-items?limit=1000', {
          method: 'GET',
          cache: 'no-store',
        })
        if (!active) return

        const { json, text } = await readApiPayload(response)
        if (!active) return

        if (!response.ok || !json) {
          const detail = text.trim().startsWith('<!DOCTYPE')
            ? 'Received HTML instead of JSON while loading inventory.'
            : text.slice(0, 160)
          throw new Error(`Could not load inventory items (${response.status}). ${detail}`)
        }

        const nextItems = Array.isArray(json.items)
          ? (json.items as StudentInventoryItem[])
          : []

        setItems(nextItems)
        setItemsError(null)
      } catch (e) {
        if (!active) return
        setItems([])
        setItemsError('Could not load item data for shelf areas right now.')
        console.error(e)
      } finally {
        if (active) setLoadingItems(false)
      }
    }

    void loadItems()
    const onFocus = () => { void loadItems() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      active = false
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  const s = canvasSize || 1
  const renderedZones = shelves.map((shelf, index) => ({
    id: (typeof shelf.shelf_uid === 'string' && shelf.shelf_uid.trim()) ? shelf.shelf_uid.trim() : `zone-${index}`,
    catId: shelf.cat_id as CategoryId,
    limit: shelf.limit_per_student,
    rotation: shelf.rotation,
    x: shelf.map_x * s,
    y: shelf.map_y * s,
    w: shelf.map_w * s,
    h: shelf.map_h * s,
  }))
  const renderedWalls = walls.map((wall, index) => ({
    id: `wall-${index}`,
    rotation: wall.rotation,
    x: wall.map_x * s,
    y: wall.map_y * s,
    w: wall.map_w * s,
    h: wall.map_h * s,
  }))
  const renderedMarkers = markers.map((marker, index) => ({
    id: `marker-${index}`,
    type: marker.type,
    x: marker.map_x * s,
    y: marker.map_y * s,
    w: marker.map_w * s,
    h: marker.map_h * s,
  }))

  useEffect(() => {
    if (!selectedZone) return

    const stillExists = renderedZones.some(zone => zone.id === selectedZone.id)
    if (!stillExists) {
      setSelectedZone(null)
    }
  }, [selectedZone, renderedZones])

  const selectedZoneCategoryLabel = selectedZone
    ? (CATEGORIES.find(cat => cat.id === selectedZone.catId)?.label ?? selectedZone.catId)
    : null

  const selectedZoneItems = useMemo(() => {
    if (!selectedZone) {
      return [] as StudentInventoryItem[]
    }

    const targetShelfUid = normalizeText(selectedZone.id)
    return items
      .filter(item => normalizeText(resolveShelfUidForItem(item)) === targetShelfUid)
      .sort((a, b) => {
        const aTitle = buildItemTitle(a)
        const bTitle = buildItemTitle(b)
        return aTitle.localeCompare(bTitle)
      })
  }, [items, selectedZone])

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <main
      className="theme-floorplan-admin"
      style={{
        minHeight: '100dvh',
        background: 'var(--fp-page-bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 16px 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <HexPanel
        style={{ width: 'fit-content', alignSelf: 'center', marginBottom: 16 }}
        contentStyle={{ textAlign: 'center', padding: '14px 22px' }}
      >
        <h1 style={{ color: 'var(--fp-text-primary)', fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, margin: '0 0 4px' }}>
          The Hub — Floor Map
        </h1>
        <p style={{ color: 'var(--fp-text-muted)', fontSize: 'clamp(13px, 3vw, 15px)', margin: 0 }}>
          Find what you need before you arrive
        </p>
      </HexPanel>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <LoadingAnimation
            message="Loading floor plan…"
            className="py-2"
            iconClassName="h-20 w-20"
            messageClassName="mt-2 text-sm font-medium text-slate-300"
          />
        </div>
      )}
      {error && (
        <HexPanel style={{ width: 'fit-content', alignSelf: 'center', marginTop: 24 }} contentStyle={{ textAlign: 'center', color: 'var(--fp-danger)', fontSize: 15, fontWeight: 700, padding: '12px 18px' }}>
          {error}
        </HexPanel>
      )}
      {!loading && !error && shelves.length === 0 && markers.length === 0 && walls.length === 0 && (
        <HexPanel style={{ width: 'fit-content', alignSelf: 'center', marginTop: 24 }} contentStyle={{ textAlign: 'center', color: 'var(--fp-text-subtle)', fontSize: 15, fontWeight: 600, padding: '12px 18px' }}>
          No floor plan has been published yet. Check back soon!
        </HexPanel>
      )}

      {!loading && !error && (shelves.length > 0 || markers.length > 0 || walls.length > 0) && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          margin: '0 auto',
        }}>
          <FloorPlanCanvas
            canvasSize={canvasSize}
            zones={renderedZones}
            walls={renderedWalls}
            markers={renderedMarkers}
            selected={selectedZone ? { id: selectedZone.id, kind: 'zone' } : null}
            onZoneClick={zone => setSelectedZone(zone)}
            style={{ width: canvasSize, height: canvasSize, flexShrink: 0 }}
          />
          <p style={{ fontSize: 13, color: 'var(--fp-text-muted)', margin: 0 }}>
            Tap a shelf section to see what items are currently in that area.
          </p>

          {selectedZone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--fp-panel-border)', background: 'var(--fp-surface-secondary)' }}>
              <span style={{ fontSize: 13, color: 'var(--fp-text-secondary)', fontWeight: 600 }}>
                Viewing: <strong style={{ color: 'var(--fp-text-primary)' }}>{selectedZoneCategoryLabel}</strong>
                {loadingItems ? ' (loading items...)' : ` (${selectedZoneItems.length} item${selectedZoneItems.length === 1 ? '' : 's'})`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid var(--fp-panel-border)', background: 'var(--fp-input-bg)', color: 'var(--fp-text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Legend — compact horizontal grid below canvas */}
          <HexPanel
            style={{ width: canvasSize }}
            fill="#ffffff"
            contentStyle={{ padding: '18px 22px' }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--fp-text-muted)', margin: '0 0 14px' }}>
              Legend
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px' }}>
              {CATEGORIES.map(cat => (
                <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: cat.fill, border: `1.5px solid ${cat.text}55`, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, color: cat.text, fontWeight: 600 }}>{cat.label}</span>
                </div>
              ))}
              {(Object.entries(MARKER_CONFIGS) as [MarkerType, typeof MARKER_CONFIGS[MarkerType]][]).map(([type, cfg]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <MarkerIcon type={type} color={cfg.arrowColor} size={20} />
                  <span style={{ fontSize: 16, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 14, borderRadius: 3, backgroundColor: 'rgba(49,69,107,0.88)', border: '1.5px solid #22304b', flexShrink: 0 }} />
                <span style={{ fontSize: 16, color: 'var(--fp-text-secondary)', fontWeight: 600 }}>Wall</span>
              </div>
            </div>
          </HexPanel>
        </div>
      )}

      {selectedZone && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(10,18,30,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}
          onClick={() => setSelectedZone(null)}
        >
          <div
            style={{
              background: 'var(--fp-surface-primary)',
              border: '1px solid var(--fp-panel-border)',
              borderRadius: 16,
              padding: '24px',
              width: '100%',
              maxWidth: 620,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            onClick={event => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fp-text-muted)' }}>
                  Shelf Area
                </p>
                <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--fp-text-primary)' }}>
                  {selectedZoneCategoryLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--fp-panel-border)', background: 'var(--fp-input-bg)', color: 'var(--fp-text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: 'var(--fp-text-secondary)' }}>
              Shelf ID: <span style={{ fontFamily: 'monospace', color: 'var(--fp-text-primary)', fontWeight: 700 }}>{selectedZone.id}</span>
            </p>

            <div
              style={{
                borderRadius: 12,
                border: '1px solid var(--fp-panel-border)',
                background: 'var(--fp-surface-secondary)',
                minHeight: 220,
                maxHeight: '55vh',
                overflowY: 'auto',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {loadingItems ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fp-text-muted)' }}>Loading items for this area…</p>
              ) : itemsError ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fp-danger)' }}>{itemsError}</p>
              ) : selectedZoneItems.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fp-text-muted)' }}>
                  No items are currently mapped to this shelf area.
                </p>
              ) : (
                selectedZoneItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      width: '100%',
                      borderRadius: 10,
                      border: '1px solid var(--fp-panel-border)',
                      background: 'var(--fp-surface-primary)',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--fp-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {buildItemTitle(item)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--fp-text-secondary)' }}>
                        {item.type || 'uncategorized'}{item.category ? ` • ${item.category}` : ''}
                      </p>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--fp-text-muted)', fontWeight: 700, flexShrink: 0 }}>
                      Qty {item.quantity}{item.size ? ` • ${item.size}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
