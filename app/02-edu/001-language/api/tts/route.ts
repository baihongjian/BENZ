import { NextRequest, NextResponse } from 'next/server';

const TTS_SERVER_URL = 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text;
    const lang = body.lang || 'de';

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log('[TTS] 请求文本:', text.substring(0, 30));

    // 调用本地 Edge TTS 服务器
    const response = await fetch(`${TTS_SERVER_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, lang }),
    });

    console.log('[TTS] 响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`TTS server returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[TTS] 成功:', data.success);

    if (data.success && data.audio) {
      return NextResponse.json({
        success: true,
        audio: data.audio
      });
    } else {
      console.log('[TTS] 错误:', data.error);
      return NextResponse.json({
        success: false,
        error: data.error || 'TTS server unavailable'
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TTS] 错误:', errorMessage);
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
