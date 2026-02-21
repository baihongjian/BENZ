import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * POST /api/02-edu/002-zhongshou/fetch-yotsuya
 * 触发获取 yotsuya 数据的脚本
 */
export async function POST(request) {
  const scriptPath = path.resolve('/Users/zhangna/work/BENZ/app/02-edu/002-zhongshou/db/fetch_yotsuya_schools.js');

  console.log('Executing script:', scriptPath);

  return new Promise((resolve) => {
    const process = spawn('node', [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
      // 实时输出到控制台
      console.log(data.toString());
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(data.toString());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({
          success: true,
          message: '四谷大塚数据获取成功!',
          output: stdout,
        }));
      } else {
        resolve(NextResponse.json({
          success: false,
          error: `脚本执行失败，退出码: ${code}`,
          output: stderr || stdout,
        }, { status: 500 }));
      }
    });

    process.on('error', (err) => {
      resolve(NextResponse.json({
        success: false,
        error: `启动脚本失败: ${err.message}`,
      }, { status: 500 }));
    });
  });
}
