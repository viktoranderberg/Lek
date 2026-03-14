import React, { useState } from 'react';
import UserSelect from './UserSelect';

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const modal = {
  background: '#fff', borderRadius: 12, padding: 28, width: 380,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};

export default function BookingModal({ users, initialStart, initialEnd, booking, onSave, onDelete, onClose }) {
  const [userName, setUserName] = useState(booking?.user_name || '');
  const [startTime, setStartTime] = useState(initialStart || booking?.start_time || '');
  const [endTime, setEndTime] = useState(initialEnd || booking?.end_time || '');
  const [note, setNote] = useState(booking?.note || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isView = !!booking;

  async function handleSave() {
    if (!userName) return setError('Välj ett namn');
    if (!startTime || !endTime) return setError('Ange start- och sluttid');
    if (startTime >= endTime) return setError('Sluttid måste vara efter starttid');
    setError('');
    setLoading(true);
    try {
      await onSave({ user_name: userName, start_time: startTime, end_time: endTime, note });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Ta bort bokningen?')) return;
    setLoading(true);
    try {
      await onDelete(booking.id);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <h2 style={{ marginBottom: 20, fontSize: 18 }}>
          {isView ? 'Bokningsdetaljer' : 'Ny bokning'}
        </h2>

        <label style={labelStyle}>Namn</label>
        {isView
          ? <div style={readonlyStyle}>{booking.user_name}</div>
          : <UserSelect users={users} value={userName} onChange={setUserName} style={{ width: '100%', marginBottom: 12 }} />
        }

        <label style={labelStyle}>Starttid</label>
        <input type="datetime-local" value={startTime} disabled={isView}
          onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Sluttid</label>
        <input type="datetime-local" value={endTime} disabled={isView}
          onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Anteckning (valfritt)</label>
        {isView
          ? <div style={{ ...readonlyStyle, marginBottom: 16 }}>{booking.note || '–'}</div>
          : <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="T.ex. kundbesök Göteborg" style={inputStyle} />
        }

        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Stäng</button>
          {isView
            ? <button onClick={handleDelete} disabled={loading} style={btnDanger}>
                {loading ? '...' : 'Ta bort'}
              </button>
            : <button onClick={handleSave} disabled={loading} style={btnPrimary}>
                {loading ? 'Sparar...' : 'Boka'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, marginBottom: 12 };
const readonlyStyle = { fontSize: 14, marginBottom: 12, color: '#374151' };
const btnBase = { padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const btnPrimary = { ...btnBase, background: '#3b82f6', color: '#fff' };
const btnDanger = { ...btnBase, background: '#ef4444', color: '#fff' };
const btnSecondary = { ...btnBase, background: '#f3f4f6', color: '#374151' };
