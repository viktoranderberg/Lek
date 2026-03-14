import React from 'react';

export default function UserSelect({ users, value, onChange, style }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #d1d5db',
        fontSize: 14,
        background: '#fff',
        cursor: 'pointer',
        ...style,
      }}
    >
      <option value="">-- Välj namn --</option>
      {users.map((u) => (
        <option key={u} value={u}>{u}</option>
      ))}
    </select>
  );
}
