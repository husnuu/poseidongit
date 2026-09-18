'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft,
  Martini,
  Beer,
  CupSoda,
  X,
  Plus,
  Minus,
} from 'lucide-react'
import type { BarOrder, BarOrderItem } from '@/lib/crew/barOrders'

export interface CrewMenuItem {
  id: string
  title: string
  category: string
  price: number
  imageUrl: string | null
}

const CATEGORY_TABS: { value: string; label: string; Icon: typeof Martini }[] = [
  { value: 'kokteyller', label: 'Kokteyller', Icon: Martini },
  { value: 'mocktails', label: 'Mocktails', Icon: CupSoda },
  { value: 'alkollu_icecekler', label: 'Bira & Şarap', Icon: Beer },
  { value: 'soft_icecekler', label: 'Soft içecek', Icon: CupSoda },
  { value: 'siseler', label: 'Şişeler', Icon: Beer },
]

function money(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR')}`
}

export default function BarTripClient({
  tripKey: _tripKey,
  tourId,
  tourTitle,
  tripDate,
  tripTime,
  initialOrders,
  menu,
}: {
  tripKey: string
  tourId: string
  tourTitle: string
  tripDate: string
  tripTime: string | null
  initialOrders: BarOrder[]
  menu: CrewMenuItem[]
}) {
  void _tripKey
  const [orders, setOrders] = useState<BarOrder[]>(initialOrders)
  const [tab, setTab] = useState<'active' | 'served'>('active')
  const [newOrderOpen, setNewOrderOpen] = useState(false)

  const todaySales = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0)
  const pendingCollection = orders
    .filter((o) => o.paymentStatus === 'unpaid')
    .reduce((s, o) => s + o.totalAmount, 0)
  const activeOrders = orders.filter((o) => o.status !== 'served')
  const servedOrders = orders.filter((o) => o.status === 'served')

  const patchOrder = (updated: BarOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
  }

  const handleStatusChange = async (order: BarOrder, action: 'preparing' | 'served') => {
    const res = await fetch(`/api/crew/bar-orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.order) patchOrder(data.order)
  }

  const handlePay = async (order: BarOrder, method: 'cash' | 'card') => {
    const res = await fetch(`/api/crew/bar-orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pay', method }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.order) patchOrder(data.order)
  }

  const handleCreated = (order: BarOrder) => {
    setOrders((prev) => [...prev, order])
    setNewOrderOpen(false)
  }

  const list = tab === 'active' ? activeOrders : servedOrders

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/ekip/bar" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100">
          <ChevronLeft className="h-5 w-5 text-[#131719]" aria-hidden />
        </Link>
        <h1 className="m-0 truncate text-lg font-black text-[#131719]">{tourTitle}</h1>
      </div>

      <div className="rounded-2xl border border-[#f1f5f9] bg-white p-5 shadow-[0_2px_8px_rgba(19,23,25,0.06)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-zinc-500">Today&apos;s Sales</p>
            <p className="m-0 mt-0.5 text-2xl font-black text-[#131719]">{money(todaySales)}</p>
            <p className="m-0 mt-0.5 text-xs text-zinc-500">{orders.length} Orders</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-amber-600">Pending Collection</p>
            <p className="m-0 mt-0.5 text-2xl font-black text-amber-600">{money(pendingCollection)}</p>
            <p className="m-0 mt-0.5 text-xs text-zinc-500">Unpaid</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setNewOrderOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white"
        style={{ background: '#131719' }}
      >
        <Plus className="h-4 w-4" aria-hidden />
        New Walk-in Order
      </button>

      <div className="flex rounded-xl bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${tab === 'active' ? 'bg-white text-[#131719] shadow-sm' : 'text-zinc-500'}`}
        >
          Active ({activeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('served')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${tab === 'served' ? 'bg-white text-[#131719] shadow-sm' : 'text-zinc-500'}`}
        >
          Served ({servedOrders.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          No {tab === 'active' ? 'active' : 'served'} orders at the moment.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} onPay={handlePay} />
          ))}
        </div>
      )}

      {newOrderOpen && (
        <NewOrderSheet
          tourId={tourId}
          tourTitle={tourTitle}
          tripDate={tripDate}
          tripTime={tripTime}
          menu={menu}
          onClose={() => setNewOrderOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

function OrderCard({
  order,
  onStatusChange,
  onPay,
}: {
  order: BarOrder
  onStatusChange: (order: BarOrder, action: 'preparing' | 'served') => void
  onPay: (order: BarOrder, method: 'cash' | 'card') => void
}) {
  const [payOpen, setPayOpen] = useState(false)
  const time = new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const isNew = order.status === 'new'

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(19,23,25,0.06)] ${
        order.status !== 'served' ? 'border-amber-200' : 'border-[#f1f5f9]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] pb-3">
        <span className="flex items-center gap-2 text-sm">
          <span className="font-mono font-bold text-[#131719]">#{order.id.slice(0, 4)}</span>
          <span className="text-zinc-400">{time}</span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#2168b8]">
            Walk-in
          </span>
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            order.status === 'new'
              ? 'bg-amber-100 text-amber-700'
              : order.status === 'preparing'
                ? 'bg-blue-50 text-[#2168b8]'
                : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {order.status === 'new' ? 'New' : order.status === 'preparing' ? 'Preparing' : 'Served'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="m-0 font-bold text-[#131719]">{order.guestLabel}</p>
        <div className="text-right">
          <p className="m-0 font-bold text-[#131719]">{money(order.totalAmount)}</p>
          <p className={`m-0 text-xs font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {order.paymentStatus === 'paid' ? `Paid (${order.paymentMethod})` : 'Unpaid'}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-[#f1f5f9] pt-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-600">
                {item.qty}
              </span>
              <span className="font-semibold text-[#131719]">{item.title}</span>
            </span>
            <span className="text-zinc-500">{money(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      {order.status !== 'served' && (
        <div className="mt-3 space-y-2 border-t border-[#f1f5f9] pt-3">
          {order.paymentStatus === 'unpaid' && !payOpen && (
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-[#131719]"
            >
              Mark as Paid...
            </button>
          )}
          {payOpen && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onPay(order, 'cash')
                  setPayOpen(false)
                }}
                className="flex-1 rounded-xl bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700"
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => {
                  onPay(order, 'card')
                  setPayOpen(false)
                }}
                className="flex-1 rounded-xl bg-blue-50 py-2.5 text-sm font-bold text-[#2168b8]"
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
          {isNew ? (
            <button
              type="button"
              onClick={() => onStatusChange(order, 'preparing')}
              className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
              style={{ background: '#131719' }}
            >
              Start Preparing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStatusChange(order, 'served')}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white"
            >
              ✓ Mark as Served
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NewOrderSheet({
  tourId,
  tourTitle,
  tripDate,
  tripTime,
  menu,
  onClose,
  onCreated,
}: {
  tourId: string
  tourTitle: string
  tripDate: string
  tripTime: string | null
  menu: CrewMenuItem[]
  onClose: () => void
  onCreated: (order: BarOrder) => void
}) {
  const [category, setCategory] = useState(CATEGORY_TABS[0]?.value ?? '')
  const [qtys, setQtys] = useState<Record<string, number>>({})
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [guestLabel, setGuestLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const availableCategories = useMemo(
    () => CATEGORY_TABS.filter((c) => menu.some((m) => m.category === c.value)),
    [menu]
  )
  const items = menu.filter((m) => m.category === category)

  const selected: (CrewMenuItem & { qty: number })[] = useMemo(
    () =>
      menu
        .filter((m) => (qtys[m.id] ?? 0) > 0)
        .map((m) => ({ ...m, qty: qtys[m.id] ?? 0 })),
    [menu, qtys]
  )
  const totalCount = selected.reduce((s, i) => s + i.qty, 0)
  const totalAmount = selected.reduce((s, i) => s + i.qty * i.price, 0)

  const setQty = (id: string, delta: number) => {
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }))
  }

  const handleCreate = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    try {
      const items: BarOrderItem[] = selected.map((s) => ({ title: s.title, price: s.price, qty: s.qty }))
      const res = await fetch('/api/crew/bar-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourId, tourTitle, tripDate, tripTime, guestLabel, items }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.order) onCreated(data.order)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-4">
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100">
          <X className="h-5 w-5 text-[#131719]" aria-hidden />
        </button>
        <h2 className="m-0 text-base font-black text-[#131719]">New Walk-in Order</h2>
        <span className="w-9" />
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#f1f5f9] px-4 py-3">
        {availableCategories.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${
              category === value ? 'bg-[#131719] text-white' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28">
        {items.map((item) => {
          const qty = qtys[item.id] ?? 0
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#f1f5f9] p-3">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-xl bg-zinc-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="m-0 font-bold text-[#131719]">{item.title}</p>
                <p className="m-0 mt-0.5 text-sm font-bold" style={{ color: '#fc6c4f' }}>
                  {money(item.price)}
                </p>
              </div>
              {qty === 0 ? (
                <button
                  type="button"
                  onClick={() => setQty(item.id, 1)}
                  className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold text-[#131719]"
                >
                  ADD
                </button>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="w-4 text-center text-sm font-bold text-[#131719]">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                    style={{ background: '#fc6c4f' }}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-[#f1f5f9] bg-white p-4">
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className="flex w-full items-center justify-between rounded-xl px-5 py-3.5 text-sm font-bold text-white"
            style={{ background: '#fc6c4f' }}
          >
            <span>{totalCount} VIEW ORDER</span>
            <span>{money(totalAmount)}</span>
          </button>
        </div>
      )}

      {summaryOpen && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/50" onClick={() => setSummaryOpen(false)}>
          <div className="w-full rounded-t-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-200" />
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-lg font-black text-[#131719]">Walk-in Summary</h3>
              <button type="button" onClick={() => setSummaryOpen(false)}>
                <X className="h-5 w-5 text-zinc-500" aria-hidden />
              </button>
            </div>
            <div className="mt-4 space-y-2 border-t border-[#f1f5f9] pt-4">
              {selected.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#131719]">
                    {s.qty}× {s.title}
                  </span>
                  <span className="text-zinc-500">{money(s.price * s.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#f1f5f9] pt-4">
              <span className="font-bold text-[#131719]">Total</span>
              <span className="text-lg font-black" style={{ color: '#fc6c4f' }}>
                {money(totalAmount)}
              </span>
            </div>
            <label className="mt-4 block text-sm font-semibold text-zinc-600">
              Guest name / identifier (optional)
              <input
                type="text"
                value={guestLabel}
                onChange={(e) => setGuestLabel(e.target.value)}
                placeholder="e.g. Table by bar, or John"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm focus:border-[#2168b8] focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="mt-5 w-full rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: '#131719' }}
            >
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
