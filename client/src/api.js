const BASE = '/api';

export async function fetchUsers() {
  const res = await fetch(`${BASE}/users`);
  return res.json();
}

export async function fetchBookings(start, end) {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const res = await fetch(`${BASE}/bookings?${params}`);
  return res.json();
}

export async function createBooking(data) {
  const res = await fetch(`${BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Något gick fel');
  return json;
}

export async function deleteBooking(id) {
  const res = await fetch(`${BASE}/bookings/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Kunde inte ta bort bokning');
  }
}
