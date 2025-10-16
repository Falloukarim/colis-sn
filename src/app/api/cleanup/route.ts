import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Cleanup endpoint - No functionality needed' 
  });
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 });
}