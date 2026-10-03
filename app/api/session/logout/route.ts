import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('connection_id');
  response.cookies.delete('project_id');
  return response;
}
