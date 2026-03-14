import React, { useMemo } from 'react';

const HOUR_START = 7;
const HOUR_END = 20;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const DAY_NAMES = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const USER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toMinutes(timeStr) {
  const d = new Date(timeStr);
  return d.getHours() * 60 + d.getMinutes();
}

export default function WeekView({ bookings, weekStart, onSlotClick, onBookingClick, userColorMap }) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const gridHeight = 600;
  const minuteH = gridHeight / totalMinutes;

  function dayBookings(day) {
    const dateStr = day.toISOString().slice(0, 10);
    return bookings.filter((b) => b.start_time.slice(0, 10) === dateStr);
  }

  function handleGridClick(e, day, colEl) {
    const rect = colEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.round((y / gridHeight) * totalMinutes / 30) * 30;
    const totalMin = HOUR_START * 60 + Math.max(0, Math.min(minutes, totalMinutes - 30));
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const m = String(totalMin % 60).padStart(2, '0');
    const dateStr = day.toISOString().slice(0, 10);
    onSlotClick(`${dateStr}T${h}:${m}`, `${dateStr}T${String(Math.floor((totalMin + 60) / 60)).padStart(2, '0')}:${String((totalMin + 60) % 60).padStart(2, '0')}`);
  }

  return (
    <div style={{ display: 'flex', overflow: 'auto' }}>
      {/* Time gutter */}
      <div style={{ width: 48, flexShrink: 0, position: 'relative', height: gridHeight + 32 }}>
        <div style={{ height: 32 }} />
        {HOURS.map((h) => (
          <div key={h} style={{
            position: 'absolute',
            top: 32 + (h - HOUR_START) * 60 * minuteH,
            fontSize: 11, color: '#9ca3af', width: 44, textAlign: 'right', paddingRight: 6,
          }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {/* Day columns */}
      {days.map((day, di) => {
        const isToday = day.toDateString() === new Date().toDateString();
        return (
          <div key={di} style={{ flex: 1, minWidth: 90 }}>
            {/* Day header */}
            <div style={{
              height: 32, textAlign: 'center', fontSize: 12, fontWeight: 600,
              color: isToday ? '#3b82f6' : '#6b7280', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {DAY_NAMES[di]} <span style={{ fontWeight: 400 }}>{day.getDate()} {MONTH_NAMES[day.getMonth()]}</span>
            </div>

            {/* Grid */}
            <div
              style={{
                position: 'relative', height: gridHeight,
                borderRight: '1px solid #e5e7eb',
                background: isToday ? '#eff6ff' : '#fff',
                cursor: 'crosshair',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget || e.target.classList.contains('grid-bg')) {
                  handleGridClick(e, day, e.currentTarget);
                }
              }}
            >
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div key={h} className="grid-bg" style={{
                  position: 'absolute', left: 0, right: 0,
                  top: (h - HOUR_START) * 60 * minuteH,
                  borderTop: '1px solid #f3f4f6', pointerEvents: 'none',
                }} />
              ))}

              {/* Bookings */}
              {dayBookings(day).map((b) => {
                const startMin = toMinutes(b.start_time) - HOUR_START * 60;
                const endMin = toMinutes(b.end_time) - HOUR_START * 60;
                const top = Math.max(0, startMin * minuteH);
                const height = Math.max(20, (endMin - startMin) * minuteH - 2);
                const color = userColorMap[b.user_name] || '#6b7280';
                return (
                  <div
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                    style={{
                      position: 'absolute', left: 2, right: 2, top,
                      height, background: color, borderRadius: 4, padding: '2px 5px',
                      color: '#fff', fontSize: 11, fontWeight: 600, overflow: 'hidden',
                      cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {b.user_name.split(' ')[0]}
                    {b.note && <span style={{ fontWeight: 400 }}> · {b.note}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { getMonday, USER_COLORS };
