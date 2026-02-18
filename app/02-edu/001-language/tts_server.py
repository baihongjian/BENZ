#!/usr/bin/env python3
"""
Edge TTS HTTP Server - 供 Next.js API 调用
运行方式: python tts_server.py
德语音色: de-DE-KatjaNeural (女声)
"""

import asyncio
import base64
import glob
import os
from aiohttp import web
import edge_tts

# 德语语音
VOICE = "de-DE-KatjaNeural"  # 女声
# VOICE = "de-DE-ConradNeural"  # 男声

# 临时文件目录
TEMP_DIR = os.path.dirname(os.path.abspath(__file__))

# 删除旧的MP3文件
def cleanup_old_mp3():
    for old_file in glob.glob(os.path.join(TEMP_DIR, "tts_*.mp3")):
        try:
            os.remove(old_file)
        except:
            pass

async def tts_handler(request):
    """处理 TTS 请求"""
    try:
        data = await request.json()
        text = data.get("text", "Guten Tag")
        lang = data.get("lang", "de")

        # 根据语言选择语音
        voice = VOICE
        if lang == "en":
            voice = "en-US-AriaNeural"
        elif lang == "zh":
            voice = "zh-CN-XiaoxiaoNeural"

        # 生成唯一文件名
        import time
        timestamp = str(int(time.time() * 1000))
        output_file = os.path.join(TEMP_DIR, f"tts_{timestamp}.mp3")

        # 生成语音
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)

        # 读取并转换为 base64
        with open(output_file, "rb") as f:
            audio_data = f.read()
            base64_data = base64.b64encode(audio_data).decode("utf-8")

        # 清理临时文件
        try:
            os.remove(output_file)
        except:
            pass

        response = web.json_response({
            "success": True,
            "audio": f"data:audio/mp3;base64,{base64_data}"
        })
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except Exception as e:
        print(f"TTS Error: {e}")
        response = web.json_response({
            "success": False,
            "error": str(e)
        }, status=500)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

async def index_handler(request):
    """返回服务状态"""
    response = web.json_response({
        "status": "running",
        "voice": VOICE,
        "service": "Edge TTS Server"
    })
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

async def options_handler(request):
    """处理 OPTIONS 预检请求"""
    response = web.Response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

async def main():
    """启动服务器"""
    cleanup_old_mp3()

    app = web.Application()
    app.router.add_post('/tts', tts_handler)
    app.router.add_get('/', index_handler)
    app.router.add_options('/tts', options_handler)

    print("=" * 50)
    print("Edge TTS Server Started!")
    print(f"Voice: {VOICE}")
    print("URL: http://localhost:8000")
    print("=" * 50)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "localhost", 8000)
    await site.start()

    # 保持运行
    try:
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        pass
    finally:
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
