'use client';
import React from 'react';

export default function NdaForm({ requestId }: { requestId: string }) {
  return (
    <form>
      <h1>NDA — {requestId}</h1>
      {/* placeholder fields */}
      <label>
        Name
        <input name="name" />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}