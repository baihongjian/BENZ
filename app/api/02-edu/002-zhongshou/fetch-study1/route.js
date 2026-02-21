import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/02-edu/002-zhongshou/fetch-study1
 * 触发获取 study1 数据的脚本
 */
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region') || 'kanto';

  // 根据 region 参数选择脚本
  let scriptPath;
  if (region === 'kansai') {
    scriptPath = path.resolve('/Users/zhangna/work/BENZ/app/02-edu/002-zhongshou/db/fetch_study1_guanxi.js');
  } else {
    scriptPath = path.resolve('/Users/zhangna/work/BENZ/app/02-edu/002-zhongshou/db/fetch_study1_guandong.js');
  }

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
          message: region === 'kansai' ? '関西数据获取成功!' : '関東数据获取成功!',
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
