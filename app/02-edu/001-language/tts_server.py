#!/usr/bin/env python3
"""
Google TTS Service - 供 Next.js API 调用
使用方法: python tts_server.py "德语文本" "de" "输出文件.mp3"
德语音色: de (德语)
"""

import sys
import base64
import glob
import os
from io import BytesIO
from gtts import gTTS

TEXT = sys.argv[1] if len(sys.argv) > 1 else "Guten Tag"
LANG = sys.argv[2] if len(sys.argv) > 2 else "de"
OUTPUT_FILE = sys.argv[3] if len(sys.argv) > 3 else "tts_temp.mp3"

# 删除旧的MP3文件
def cleanup_old_mp3():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    for old_file in glob.glob(os.path.join(script_dir, "tts_*.mp3")):
        try:
            os.remove(old_file)
            print(f"Deleted: {old_file}")
        except Exception as e:
            print(f"Failed to delete {old_file}: {e}")

def text_to_speech(text: str, lang: str = "de"):
    """将文本转换为语音，保存到文件"""
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(OUTPUT_FILE)
    return OUTPUT_FILE

def main():
    # 清理旧的MP3文件
    cleanup_old_mp3()

    output_file = text_to_speech(TEXT, LANG)
    print(f"Audio saved to: {output_file}")

    # 也输出 base64
    with open(output_file, "rb") as f:
        audio_data = f.read()
        base64_data = base64.b64encode(audio_data).decode("utf-8")
        print(f"BASE64_START{base64_data}BASE64_END")

if __name__ == "__main__":
    main()
