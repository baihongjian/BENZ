import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'de' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 生成唯一的输出文件名
    const timestamp = Date.now();
    const outputFile = path.join(process.cwd(), 'app', '02-edu', '001-language', `tts_${timestamp}.mp3`);

    // 调用 Python 脚本
    const result = await new Promise<{ success: boolean; base64?: string; error?: string }>((resolve) => {
      const pythonProcess = spawn('python3', [
        path.join(process.cwd(), 'app', '02-edu', '001-language', 'tts_server.py'),
        text,
        lang,
        outputFile
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // 从输出中提取 base64 数据
          const base64Match = output.match(/BASE64_START(.+?)BASE64_END/);
          if (base64Match) {
            resolve({ success: true, base64: base64Match[1] });
          } else {
            resolve({ success: true });
          }
        } else {
          resolve({ success: false, error: errorOutput || 'Python script failed' });
        }
      });
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      audio: result.base64 ? `data:audio/mp3;base64,${result.base64}` : null
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
