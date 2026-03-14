import React, { useEffect, useState, useCallback } from 'react';
import WeekView, { getMonday, USER_COLORS } from './components/WeekView';
import BookingModal from './components/BookingModal';
import { fetchUsers, fetchBookings, createBooking, deleteBooking } from './api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [modal, setModal] = useState(null); // null | { type: 'new', start, end } | { type: 'view', booking }
  const [loading, setLoading] = useState(false);

  const userColorMap = Object.fromEntries(
    users.map((u, i) => [u, USER_COLORS[i % USER_COLORS.length]])
  );

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBookings(weekStart.toISOString(), weekEnd.toISOString());
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchUsers().then(setUsers); }, []);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }
  function goToday() { setWeekStart(getMonday(new Date())); }

  function formatWeekLabel() {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
    if (weekStart.getMonth() === end.getMonth()) {
      return `${weekStart.getDate()}–${end.getDate()} ${months[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    }
    return `${weekStart.getDate()} ${months[weekStart.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${weekStart.getFullYear()}`;
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tjänstebilsbokning</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Klicka i kalendern för att boka</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevWeek} style={navBtn}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 180, textAlign: 'center' }}>
            {formatWeekLabel()}
          </span>
          <button onClick={nextWeek} style={navBtn}>›</button>
          <button onClick={goToday} style={{ ...navBtn, padding: '6px 12px', fontSize: 13 }}>Idag</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {users.map((u, i) => (
          <span key={u} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 99, padding: '3px 10px', fontSize: 12,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length], display: 'inline-block' }} />
            {u.split(' ')[0]}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {loading && (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Laddar...</div>
        )}
        <WeekView
          bookings={bookings}
          weekStart={weekStart}
          userColorMap={userColorMap}
          onSlotClick={(start, end) => setModal({ type: 'new', start, end })}
          onBookingClick={(booking) => setModal({ type: 'view', booking })}
        />
      </div>

      {/* Modal */}
      {modal?.type === 'new' && (
        <BookingModal
          users={users}
          initialStart={modal.start}
          initialEnd={modal.end}
          onSave={async (data) => { await createBooking(data); await loadBookings(); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'view' && (
        <BookingModal
          users={users}
          booking={modal.booking}
          onDelete={async (id) => { await deleteBooking(id); await loadBookings(); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const navBtn = {
  padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6,
  background: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 600,
};
