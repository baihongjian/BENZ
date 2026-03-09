// API 路由：代理 AWS API 请求，解决 CORS 问题
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const awsUrl = 'https://kmacsxuphh.execute-api.ap-northeast-1.amazonaws.com/dev/updates?limit=100';

    const response = await fetch(awsUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('代理请求失败:', error);
    return NextResponse.json(
      { error: '获取数据失败', details: String(error) },
      { status: 500 }
    );
  }
}
