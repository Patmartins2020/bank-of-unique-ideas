import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log('BODY RECEIVED:', body);

    return NextResponse.json({
      ok: true,
      message: 'API WORKING',
      data: body
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}