#!/usr/bin/env python3
"""
Google TTS Service - 供 Next.js API 调用
使用方法: python tts_server.py "德语文本" "de" "输出文件.mp3"
德语音色: de (德语)
"""

import sys
import base64
from io import BytesIO
from gtts import gTTS

TEXT = sys.argv[1] if len(sys.argv) > 1 else "Guten Tag"
LANG = sys.argv[2] if len(sys.argv) > 2 else "de"
OUTPUT_FILE = sys.argv[3] if len(sys.argv) > 3 else "output.mp3"

def text_to_speech(text: str, lang: str = "de"):
    """将文本转换为语音，保存到文件"""
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(OUTPUT_FILE)
    return OUTPUT_FILE

def main():
    output_file = text_to_speech(TEXT, LANG)
    print(f"Audio saved to: {output_file}")

    # 也输出 base64
    with open(output_file, "rb") as f:
        audio_data = f.read()
        base64_data = base64.b64encode(audio_data).decode("utf-8")
        print(f"BASE64_START{base64_data}BASE64_END")

if __name__ == "__main__":
    main()
