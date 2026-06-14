'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// 音效函数
function playSound(isCorrect: boolean) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // 正确：高频音，错误：低频音
  oscillator.frequency.value = isCorrect ? 800 : 200;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

// 朗读函数
const speak = async (text: string) => {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch('http://localhost:8000/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: 'de' })
    });

    const data = await response.json();

    if (data.audio) {
      const audio = new Audio(data.audio);
      await audio.play();
      return;
    }
  } catch (error) {
    console.log('Edge TTS 不可用，使用浏览器语音');
  }

  // 回退到浏览器语音
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.85;
  utterance.pitch = 1;

  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    const germanVoice = voices.find(v => v.lang.includes("de"));
    if (germanVoice) utterance.voice = germanVoice;
  };

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  speechSynthesis.speak(utterance);
};

// 类别数据
const categories = [
  { id: 'adj', name: '人的状态' },
  { id: 'state', name: '物体的状态' },
  { id: 'place', name: '场所/空间/时' },
  { id: 'mind', name: '思考/知识/发现/心/感情' },
  { id: 'action', name: '移动/动作' },
  { id: 'transport', name: '交通' },
  { id: 'building', name: '建筑' },
  { id: 'possessive', name: '物主代词' },
  { id: 'face', name: '人的脸部' },
  { id: 'family', name: '家族词汇' },
  { id: 'level5w1', name: '5级第1周' },
  { id: 'level5w2', name: '5级第2周' },
  { id: 'level5w3', name: '5级第3周' },
];

// 形容词的特性
const adjectives = [
  { id: 1, german: "alt", chinese: "老的" },
  { id: 2, german: "jung", chinese: "年轻的" },
  { id: 3, german: "arm", chinese: "贫穷的" },
  { id: 4, german: "reich", chinese: "富有的" },
  { id: 5, german: "frei", chinese: "自由的 / 空闲的" },
  { id: 6, german: "traurig", chinese: "悲伤的" },
  { id: 7, german: "glücklich", chinese: "快乐的 / 幸福的" },
  { id: 8, german: "gesund", chinese: "健康的" },
  { id: 9, german: "krank", chinese: "生病的" },
  { id: 10, german: "schwach", chinese: "虚弱的 / 弱的" },
  { id: 11, german: "stark", chinese: "强壮的 / 强的" },
  { id: 12, german: "leise", chinese: "安静的 / 小声的" },
  { id: 13, german: "müde", chinese: "疲倦的" },
  { id: 14, german: "tot", chinese: "死的" },
  { id: 15, german: "satt", chinese: "饱的" },
  { id: 16, german: "freundlich", chinese: "友好的" },
  { id: 17, german: "nett", chinese: "和蔼的 / 亲切的" },
  { id: 18, german: "klug", chinese: "聪明的" },
  { id: 19, german: "dumm", chinese: "愚蠢的" },
  { id: 20, german: "faul", chinese: "懒的" },
  { id: 21, german: "fleißig", chinese: "勤奋的" },
];

// 物体的状态
const states = [
  { id: 101, german: "groß", chinese: "大的 / 高的" },
  { id: 102, german: "klein", chinese: "小的" },
  { id: 103, german: "lang", chinese: "长的" },
  { id: 104, german: "kurz", chinese: "短的" },
  { id: 105, german: "schwer", chinese: "重的 / 困难的" },
  { id: 106, german: "leicht", chinese: "轻的 / 容易的" },
  { id: 107, german: "weit", chinese: "远的 / 宽广的" },
  { id: 108, german: "eng", chinese: "狭窄的" },
  { id: 109, german: "schnell", chinese: "快的" },
  { id: 110, german: "langsam", chinese: "慢的" },
  { id: 111, german: "schön", chinese: "美丽的" },
  { id: 112, german: "neu", chinese: "新的" },
  { id: 113, german: "hoch", chinese: "高的" },
  { id: 114, german: "frisch", chinese: "新鲜的" },
  { id: 115, german: "laut", chinese: "大声的 / 吵的" },
  { id: 116, german: "süß", chinese: "甜的 / 可爱的" },
  { id: 117, german: "ander(e)", chinese: "其他的" },
  { id: 118, german: "gleich", chinese: "一样的 / 马上" },
  { id: 119, german: "kaputt", chinese: "坏的 / 破的" },
  { id: 120, german: "wichtig", chinese: "重要的" },
];

// 场所/空间/时
const places = [
  { id: 201, german: "hier", chinese: "这里" },
  { id: 202, german: "dort", chinese: "那里" },
  { id: 203, german: "weg", chinese: "离开 / 不在了" },
  { id: 204, german: "zurück", chinese: "回来 / 回去" },
  { id: 205, german: "links", chinese: "左边" },
  { id: 206, german: "rechts", chinese: "右边" },
  { id: 207, german: "heute", chinese: "今天" },
  { id: 208, german: "gestern", chinese: "昨天" },
  { id: 209, german: "morgen", chinese: "明天 / 早上" },
  { id: 210, german: "bald", chinese: "很快" },
  { id: 211, german: "dann", chinese: "然后 / 那时" },
  { id: 212, german: "gerade", chinese: "正在 / 刚刚" },
  { id: 213, german: "jetzt", chinese: "现在" },
  { id: 214, german: "einmal", chinese: "一次 / 曾经" },
  { id: 215, german: "noch", chinese: "还 / 仍然" },
  { id: 216, german: "schon", chinese: "已经" },
  { id: 217, german: "später", chinese: "稍后" },
  { id: 218, german: "früh", chinese: "早的" },
  { id: 219, german: "spät", chinese: "晚的" },
  { id: 220, german: "erst", chinese: "才 / 仅仅" },
  { id: 221, german: "nächst(e)", chinese: "下一个" },
  { id: 222, german: "letzt(e)", chinese: "上一个 / 最后一个" },
];

// 思考/知识/发现/心/感情
const minds = [
  { id: 301, german: "denken", chinese: "思考" },
  { id: 302, german: "glauben", chinese: "相信 / 认为" },
  { id: 303, german: "erzählen", chinese: "讲述" },
  { id: 304, german: "kennen", chinese: "认识（人/地方）" },
  { id: 305, german: "wissen", chinese: "知道（事实）" },
  { id: 306, german: "finden", chinese: "觉得 / 找到" },
  { id: 307, german: "vergessen", chinese: "忘记" },
  { id: 308, german: "lieben", chinese: "爱" },
  { id: 309, german: "freuen", chinese: "高兴" },
  { id: 310, german: "danken", chinese: "感谢" },
  { id: 311, german: "gefallen", chinese: "使喜欢" },
  { id: 312, german: "sehen", chinese: "看见" },
  { id: 313, german: "hören", chinese: "听见" },
  { id: 314, german: "lachen", chinese: "笑" },
  { id: 315, german: "weinen", chinese: "哭" },
  { id: 316, german: "fühlen", chinese: "感觉" },
];

// 移动/动作
const actions = [
  { id: 401, german: "gehen", chinese: "走 / 去（步行）" },
  { id: 402, german: "fahren", chinese: "乘车 / 行驶" },
  { id: 403, german: "kommen", chinese: "来" },
  { id: 404, german: "fliegen", chinese: "飞" },
  { id: 405, german: "laufen", chinese: "跑 / 走（较快）" },
  { id: 406, german: "schwimmen", chinese: "游泳" },
  { id: 407, german: "reisen", chinese: "旅行" },
  { id: 408, german: "abfahren", chinese: "出发" },
  { id: 409, german: "ankommen", chinese: "到达" },
  { id: 410, german: "aussteigen", chinese: "下车" },
  { id: 411, german: "einsteigen", chinese: "上车" },
  { id: 412, german: "machen", chinese: "做" },
  { id: 413, german: "tun", chinese: "做" },
  { id: 414, german: "stellen", chinese: "放（竖着）" },
  { id: 415, german: "tragen", chinese: "搬 / 穿 / 拿" },
  { id: 416, german: "legen", chinese: "放（平放）" },
  { id: 417, german: "ziehen", chinese: "拉 / 搬动" },
  { id: 418, german: "hängen", chinese: "挂着 / 挂" },
  { id: 419, german: "halten", chinese: "停下 / 握住" },
  { id: 420, german: "holen", chinese: "去取" },
  { id: 421, german: "bringen", chinese: "带来" },
  { id: 422, german: "öffnen", chinese: "打开" },
  { id: 423, german: "schlagen", chinese: "打 / 敲" },
  { id: 424, german: "schicken", chinese: "发送 / 寄" },
];

// 交通
const transports = [
  { id: 501, german: "der Zug", chinese: "火车" },
  { id: 502, german: "die Straßenbahn", chinese: "有轨电车" },
  { id: 503, german: "das Auto", chinese: "汽车" },
  { id: 504, german: "der Wagen", chinese: "车辆 / 车厢" },
  { id: 505, german: "das Taxi", chinese: "出租车" },
  { id: 506, german: "der Bus", chinese: "公交车" },
  { id: 507, german: "das Fahrrad", chinese: "自行车" },
  { id: 508, german: "das Flugzeug", chinese: "飞机" },
  { id: 509, german: "die Welt", chinese: "世界" },
  { id: 510, german: "das Ausland", chinese: "国外" },
  { id: 511, german: "die Heimat", chinese: "家乡 / 祖国" },
  { id: 512, german: "Europa", chinese: "欧洲" },
  { id: 513, german: "das Problem", chinese: "问题 / 难题" },
  { id: 514, german: "die Sache", chinese: "事情 / 东西" },
  { id: 515, german: "der Plan", chinese: "计划" },
  { id: 516, german: "die Vorsicht", chinese: "小心 / 谨慎" },
];

// 建筑
const buildings = [
  { id: 601, german: "die Stadt", chinese: "城市" },
  { id: 602, german: "das Dorf", chinese: "村庄" },
  { id: 603, german: "die Straße", chinese: "街道" },
  { id: 604, german: "der Weg", chinese: "路 / 小路" },
  { id: 605, german: "der Bahnhof", chinese: "火车站" },
  { id: 606, german: "das Rathaus", chinese: "市政厅" },
  { id: 607, german: "die Kirche", chinese: "教堂" },
  { id: 608, german: "die Polizei", chinese: "警察（机构）" },
  { id: 609, german: "die Bank", chinese: "银行" },
  { id: 610, german: "das Kaufhaus", chinese: "百货商店" },
  { id: 611, german: "das Geschäft", chinese: "商店 / 生意" },
  { id: 612, german: "das Hotel", chinese: "酒店" },
  { id: 613, german: "das Restaurant", chinese: "餐厅" },
  { id: 614, german: "der Platz", chinese: "广场 / 地方" },
  { id: 615, german: "die Mitte", chinese: "中间" },
  { id: 616, german: "das Geld", chinese: "钱" },
  { id: 617, german: "der Euro", chinese: "欧元" },
  { id: 618, german: "das Geschenk", chinese: "礼物" },
];

// 物主代词
const possessives = [
  { id: 701, german: "mein", chinese: "我的" },
  { id: 702, german: "dein", chinese: "你的" },
  { id: 703, german: "sein", chinese: "他的" },
  { id: 704, german: "ihr", chinese: "她的" },
  { id: 705, german: "sein", chinese: "它的" },
  { id: 706, german: "unser", chinese: "我们的" },
  { id: 707, german: "euer", chinese: "你们的" },
  { id: 708, german: "ihr", chinese: "他们的/她们的/它们的" },
  { id: 709, german: "Ihr", chinese: "您的；您们的" },
];

// 人的脸部
const faces = [
  { id: 801, german: "das Gesicht", chinese: "脸" },
  { id: 802, german: "das Haar", chinese: "头发" },
  { id: 803, german: "das Auge", chinese: "眼睛" },
  { id: 804, german: "die Nase", chinese: "鼻子" },
  { id: 805, german: "das Ohr", chinese: "耳朵" },
  { id: 806, german: "der Mund", chinese: "嘴巴" },
  { id: 807, german: "die Zunge", chinese: "舌头" },
  { id: 808, german: "die Lippe", chinese: "嘴唇" },
  { id: 809, german: "der Zahn", chinese: "牙齿" },
];

// 家族词汇
const families = [
  { id: 901, german: "die Familie", chinese: "家庭" },
  { id: 902, german: "die Großeltern", chinese: "（外）祖父母" },
  { id: 903, german: "der Großvater", chinese: "（外）祖父" },
  { id: 904, german: "die Großmutter", chinese: "（外）祖母" },
  { id: 905, german: "die Eltern", chinese: "父母" },
  { id: 906, german: "der Vater", chinese: "父亲" },
  { id: 907, german: "die Mutter", chinese: "母亲" },
  { id: 908, german: "der Sohn", chinese: "儿子" },
  { id: 909, german: "die Tochter", chinese: "女儿" },
  { id: 910, german: "die Geschwister", chinese: "兄弟姐妹" },
  { id: 911, german: "der Bruder", chinese: "兄弟" },
  { id: 912, german: "die Schwester", chinese: "姐妹" },
  { id: 913, german: "die Tante", chinese: "阿姨；姑妈；舅妈" },
  { id: 914, german: "der Onkel", chinese: "叔叔；舅舅；姑父" },
  { id: 915, german: "der Cousin", chinese: "堂兄弟；表兄弟" },
  { id: 916, german: "die Cousine", chinese: "堂姐妹；表姐妹" },
];

// 5级第1周词汇
const level5w1 = [
  { id: 1001, german: "der Bruder", chinese: "兄弟" },
  { id: 1002, german: "die Schwester", chinese: "姐妹" },
  { id: 1003, german: "der Arzt", chinese: "医生" },
  { id: 1004, german: "Deutschland", chinese: "德国" },
  { id: 1005, german: "das Brot", chinese: "面包" },
  { id: 1006, german: "der Käse", chinese: "奶酪" },
  { id: 1007, german: "die Schokolade", chinese: "巧克力" },
  { id: 1008, german: "die Eltern", chinese: "父母" },
  { id: 1009, german: "der Sohn", chinese: "儿子" },
  { id: 1010, german: "der Beruf", chinese: "职业" },
  { id: 1011, german: "Deutsch", chinese: "德语（语言）" },
  { id: 1012, german: "das Brötchen", chinese: "小面包" },
  { id: 1013, german: "der Kuchen", chinese: "蛋糕" },
  { id: 1014, german: "die Suppe", chinese: "汤" },
  { id: 1015, german: "die Familie", chinese: "家庭" },
  { id: 1016, german: "die Tochter", chinese: "女儿" },
  { id: 1017, german: "die Firma", chinese: "公司" },
  { id: 1018, german: "Japan", chinese: "日本" },
  { id: 1019, german: "die Butter", chinese: "黄油" },
  { id: 1020, german: "die Marmelade", chinese: "果酱" },
  { id: 1021, german: "die Wurst", chinese: "香肠" },
  { id: 1022, german: "die Frau", chinese: "女人/妻子" },
  { id: 1023, german: "der Vater", chinese: "父亲" },
  { id: 1024, german: "der Lehrer", chinese: "老师" },
  { id: 1025, german: "Japanisch", chinese: "日语（语言）" },
  { id: 1026, german: "das Ei", chinese: "鸡蛋" },
  { id: 1027, german: "das Öl", chinese: "油" },
  { id: 1028, german: "der Zucker", chinese: "糖" },
  { id: 1029, german: "die Geschwister", chinese: "兄弟姐妹" },
  { id: 1030, german: "die Tante", chinese: "阿姨/姑妈/舅妈" },
  { id: 1031, german: "der Professor", chinese: "教授" },
  { id: 1032, german: "Österreich", chinese: "奥地利" },
  { id: 1033, german: "das Essen", chinese: "食物/饭" },
  { id: 1034, german: "der Reis", chinese: "米饭" },
  { id: 1035, german: "der Hunger", chinese: "饥饿" },
  { id: 1036, german: "das Kind", chinese: "孩子" },
  { id: 1037, german: "der Onkel", chinese: "叔叔/舅舅/姑父" },
  { id: 1038, german: "die Hausfrau", chinese: "家庭主妇" },
  { id: 1039, german: "die Schweiz", chinese: "瑞士" },
  { id: 1040, german: "der Essig", chinese: "醋" },
  { id: 1041, german: "der Salat", chinese: "沙拉" },
  { id: 1042, german: "der Pfeffer", chinese: "胡椒" },
  { id: 1043, german: "der Mann", chinese: "男人/丈夫" },
  { id: 1044, german: "das Mädchen", chinese: "女孩" },
  { id: 1045, german: "der Schüler", chinese: "学生" },
  { id: 1046, german: "der Japaner", chinese: "日本人" },
  { id: 1047, german: "der Fisch", chinese: "鱼" },
  { id: 1048, german: "das Salz", chinese: "盐" },
  { id: 1049, german: "die Sahne", chinese: "奶油" },
  { id: 1050, german: "die Mutter", chinese: "母亲" },
  { id: 1051, german: "der Junge", chinese: "男孩" },
  { id: 1052, german: "der Student", chinese: "大学生" },
  { id: 1053, german: "das Ausland", chinese: "国外" },
  { id: 1054, german: "das Fleisch", chinese: "肉" },
  { id: 1055, german: "der Schinken", chinese: "火腿" },
  { id: 1056, german: "das Frühstück", chinese: "早餐" },
];

// 5级第2周词汇
const level5w2 = [
  { id: 2001, german: "das Bier", chinese: "啤酒" },
  { id: 2002, german: "die Pflanze", chinese: "植物" },
  { id: 2003, german: "der Berg", chinese: "山" },
  { id: 2004, german: "das Wetter", chinese: "天气" },
  { id: 2005, german: "die Kirche", chinese: "教堂" },
  { id: 2006, german: "die Bäckerei", chinese: "面包店" },
  { id: 2007, german: "die Bahn", chinese: "火车/轨道" },
  { id: 2008, german: "der Kaffee", chinese: "咖啡" },
  { id: 2009, german: "der Baum", chinese: "树" },
  { id: 2010, german: "das Feld", chinese: "田地/领域" },
  { id: 2011, german: "der Wind", chinese: "风" },
  { id: 2012, german: "das Krankenhaus", chinese: "医院" },
  { id: 2013, german: "das Geschäft", chinese: "商店/生意" },
  { id: 2014, german: "der Zug", chinese: "火车" },
  { id: 2015, german: "die Milch", chinese: "牛奶" },
  { id: 2016, german: "die Blume", chinese: "花" },
  { id: 2017, german: "der Wald", chinese: "森林" },
  { id: 2018, german: "der Regen", chinese: "雨" },
  { id: 2019, german: "die Polizei", chinese: "警察（机构）" },
  { id: 2020, german: "das Kaufhaus", chinese: "百货商店" },
  { id: 2021, german: "der Bahnhof", chinese: "火车站" },
  { id: 2022, german: "der Saft", chinese: "果汁" },
  { id: 2023, german: "das Tier", chinese: "动物" },
  { id: 2024, german: "das Meer", chinese: "海/海洋" },
  { id: 2025, german: "der Schnee", chinese: "雪" },
  { id: 2026, german: "die Post", chinese: "邮局/邮件" },
  { id: 2027, german: "das Kino", chinese: "电影院" },
  { id: 2028, german: "die Haltestelle", chinese: "车站" },
  { id: 2029, german: "der Tee", chinese: "茶" },
  { id: 2030, german: "der Hund", chinese: "狗" },
  { id: 2031, german: "der See", chinese: "湖" },
  { id: 2032, german: "die Luft", chinese: "空气" },
  { id: 2033, german: "das Rathaus", chinese: "市政厅" },
  { id: 2034, german: "der Markt", chinese: "市场" },
  { id: 2035, german: "der Fahrplan", chinese: "时刻表" },
  { id: 2036, german: "das Wasser", chinese: "水" },
  { id: 2037, german: "die Katze", chinese: "猫" },
  { id: 2038, german: "der Fluss", chinese: "河" },
  { id: 2039, german: "die Sonne", chinese: "太阳" },
  { id: 2040, german: "die Stadt", chinese: "城市" },
  { id: 2041, german: "der Park", chinese: "公园" },
  { id: 2042, german: "die Abfahrt", chinese: "出发/出发时间" },
  { id: 2043, german: "der Wein", chinese: "葡萄酒" },
  { id: 2044, german: "der Vogel", chinese: "鸟" },
  { id: 2045, german: "der Himmel", chinese: "天空" },
  { id: 2046, german: "der Stern", chinese: "星星" },
  { id: 2047, german: "die Straße", chinese: "街道" },
  { id: 2048, german: "das Hotel", chinese: "酒店" },
  { id: 2049, german: "die Ankunft", chinese: "到达/到达时间" },
  { id: 2050, german: "der Durst", chinese: "口渴" },
  { id: 2051, german: "das Pferd", chinese: "马" },
  { id: 2052, german: "die Natur", chinese: "自然" },
  { id: 2053, german: "der Mond", chinese: "月亮" },
  { id: 2054, german: "der Platz", chinese: "广场/地方" },
  { id: 2055, german: "das Schloss", chinese: "城堡/宫殿" },
  { id: 2056, german: "die Fahrkarte", chinese: "车票" },
];

// 5级第3周词汇
const level5w3 = [
  { id: 3001, german: "das Auto", chinese: "汽车" },
  { id: 3002, german: "das Bad", chinese: "浴室/厕所" },
  { id: 3003, german: "die Küche", chinese: "厨房" },
  { id: 3004, german: "der Tisch", chinese: "桌子" },
  { id: 3005, german: "das Bild", chinese: "图片" },
  { id: 3006, german: "der Fußball", chinese: "足球" },
  { id: 3007, german: "die Frage", chinese: "问题" },
  { id: 3008, german: "der Wagen", chinese: "车/车厢" },
  { id: 3009, german: "das Bett", chinese: "床" },
  { id: 3010, german: "der Kühlschrank", chinese: "冰箱" },
  { id: 3011, german: "die Toilette", chinese: "厕所" },
  { id: 3012, german: "der Brief", chinese: "信" },
  { id: 3013, german: "die Geige", chinese: "小提琴" },
  { id: 3014, german: "der Geburtstag", chinese: "生日" },
  { id: 3015, german: "das Taxi", chinese: "出租车" },
  { id: 3016, german: "die Dusche", chinese: "淋浴" },
  { id: 3017, german: "der Schlüssel", chinese: "钥匙" },
  { id: 3018, german: "die Tür", chinese: "门" },
  { id: 3019, german: "das Buch", chinese: "书" },
  { id: 3020, german: "das Klavier", chinese: "钢琴" },
  { id: 3021, german: "das Geld", chinese: "钱" },
  { id: 3022, german: "der Bus", chinese: "公交车" },
  { id: 3023, german: "das Fenster", chinese: "窗户" },
  { id: 3024, german: "das Regal", chinese: "架子" },
  { id: 3025, german: "die Uhr", chinese: "钟/表" },
  { id: 3026, german: "das Heft", chinese: "本子" },
  { id: 3027, german: "das Museum", chinese: "博物馆" },
  { id: 3028, german: "die Liebe", chinese: "爱" },
  { id: 3029, german: "das Fahrrad", chinese: "自行车" },
  { id: 3030, german: "der Fernseher", chinese: "电视机" },
  { id: 3031, german: "der Schrank", chinese: "柜子" },
  { id: 3032, german: "die Wand", chinese: "墙" },
  { id: 3033, german: "die Karte", chinese: "卡片/地图" },
  { id: 3034, german: "die Oper", chinese: "歌剧" },
  { id: 3035, german: "der Freund", chinese: "朋友" },
  { id: 3036, german: "die Autobahn", chinese: "高速公路" },
  { id: 3037, german: "der Garten", chinese: "花园" },
  { id: 3038, german: "der Spiegel", chinese: "镜子" },
  { id: 3039, german: "die Waschmaschine", chinese: "洗衣机" },
  { id: 3040, german: "das Papier", chinese: "纸" },
  { id: 3041, german: "die Reise", chinese: "旅行" },
  { id: 3042, german: "der Name", chinese: "名字" },
  { id: 3043, german: "das Flugzeug", chinese: "飞机" },
  { id: 3044, german: "das Haus", chinese: "房子" },
  { id: 3045, german: "der Stuhl", chinese: "椅子" },
  { id: 3046, german: "die Wohnung", chinese: "公寓" },
  { id: 3047, german: "der Stift", chinese: "笔" },
  { id: 3048, german: "das Theater", chinese: "剧院" },
  { id: 3049, german: "der Schmerz", chinese: "疼痛" },
  { id: 3050, german: "das Schiff", chinese: "船" },
  { id: 3051, german: "die Heizung", chinese: "暖气/加热" },
  { id: 3052, german: "das Telefon", chinese: "电话" },
  { id: 3053, german: "das Zimmer", chinese: "房间" },
  { id: 3054, german: "das Wörterbuch", chinese: "词典" },
  { id: 3055, german: "der Urlaub", chinese: "假期" },
  { id: 3056, german: "die Sprache", chinese: "语言" },
  { id: 3057, german: "die Zeit", chinese: "时间" },
  { id: 3058, german: "der Anfang", chinese: "开始" },
  { id: 3059, german: "das Ende", chinese: "结束" },
  { id: 3060, german: "das Wort", chinese: "词/单词" },
  { id: 3061, german: "die Zeitung", chinese: "报纸" },
  { id: 3062, german: "die Schule", chinese: "学校" },
  { id: 3063, german: "die Universität", chinese: "大学" },
  { id: 3064, german: "der Unterricht", chinese: "课/课程" },
];

// 根据类别获取数据
function getDataByCategory(categoryId: string) {
  if (categoryId === 'state') {
    return states;
  }
  if (categoryId === 'place') {
    return places;
  }
  if (categoryId === 'mind') {
    return minds;
  }
  if (categoryId === 'action') {
    return actions;
  }
  if (categoryId === 'transport') {
    return transports;
  }
  if (categoryId === 'building') {
    return buildings;
  }
  if (categoryId === 'possessive') {
    return possessives;
  }
  if (categoryId === 'face') {
    return faces;
  }
  if (categoryId === 'family') {
    return families;
  }
  if (categoryId === 'level5w1') {
    return level5w1;
  }
  if (categoryId === 'level5w2') {
    return level5w2;
  }
  if (categoryId === 'level5w3') {
    return level5w3;
  }
  return adjectives;
}

// 获取所有选项
function getAllOptions(data: typeof adjectives | typeof states | typeof places | typeof minds | typeof actions | typeof transports | typeof buildings | typeof possessives | typeof faces | typeof families | typeof level5w1 | typeof level5w2 | typeof level5w3, lang: 'german' | 'chinese') {
  return data.map(a => a[lang]);
}

// 生成选项（1个正确答案 + 3个干扰选项）
function generateOptions(correctAnswer: string, options: string[]): string[] {
  const pool = options.filter(o => o !== correctAnswer);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return [correctAnswer, ...shuffled.slice(0, 3)].sort(() => Math.random() - 0.5);
}

export default function SelectQuestion2() {
  const [category, setCategory] = useState('adj');
  const [mode, setMode] = useState<'de2zh' | 'zh2de'>('de2zh');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [optionsMap, setOptionsMap] = useState<Record<number, string[]>>({});

  const data = getDataByCategory(category);

  // 切换类别或模式时重新初始化
  useEffect(() => {
    const map: Record<number, string[]> = {};
    const optionList = getAllOptions(data, mode === 'de2zh' ? 'chinese' : 'german');
    const correctKey = mode === 'de2zh' ? 'chinese' : 'german';

    data.forEach(item => {
      map[item.id] = generateOptions(item[correctKey as keyof typeof item] as string, optionList);
    });
    setOptionsMap(map);
    setAnswers({});
  }, [category, mode]);

  const handleSelect = (id: number, answer: string, isCorrect: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
    playSound(isCorrect);
  };

  const getOptionClass = (itemId: number, option: string) => {
    const item = data.find(a => a.id === itemId);
    if (!item) return '';

    const correctAnswer = mode === 'de2zh' ? item.chinese : item.german;
    let baseClass = 'px-4 py-2 border rounded cursor-pointer transition-colors ';

    if (answers[itemId]) {
      if (option === correctAnswer) {
        return baseClass + 'bg-green-100 border-green-500 text-green-700';
      }
      if (answers[itemId] === option && option !== correctAnswer) {
        return baseClass + 'bg-red-100 border-red-500 text-red-700';
      }
      return baseClass + 'bg-gray-50 border-gray-200 text-gray-400';
    }

    if (answers[itemId] === option) {
      return baseClass + 'bg-blue-100 border-blue-500 text-blue-700';
    }
    return baseClass + 'bg-white border-gray-300 hover:bg-blue-50';
  };

  const correctCount = Object.entries(answers).filter(([id, answer]) => {
    const item = data.find(a => a.id === Number(id));
    if (!item) return false;
    const correctAnswer = mode === 'de2zh' ? item.chinese : item.german;
    return answer === correctAnswer;
  }).length;

  const handleReset = () => {
    setAnswers({});
    const map: Record<number, string[]> = {};
    const optionList = getAllOptions(data, mode === 'de2zh' ? 'chinese' : 'german');
    const correctKey = mode === 'de2zh' ? 'chinese' : 'german';

    data.forEach(item => {
      map[item.id] = generateOptions(item[correctKey as keyof typeof item] as string, optionList);
    });
    setOptionsMap(map);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/02-edu/001-language"
            className="text-blue-600 hover:underline"
          >
            ← 返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            德语选择
          </h1>
          <div className="w-16"></div>
        </div>

        {/* 答题区域 */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* 类别切换 */}
          <div className="flex justify-center gap-4 mb-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-full ${
                  category === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 模式切换 */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setMode('de2zh')}
              className={`px-4 py-2 rounded-full ${
                mode === 'de2zh'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              德→中
            </button>
            <button
              onClick={() => setMode('zh2de')}
              className={`px-4 py-2 rounded-full ${
                mode === 'zh2de'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              中→德
            </button>
          </div>

          {/* 说明 */}
          <p className="text-gray-600 mb-6 text-center">
            {mode === 'de2zh' ? '选择每个德语词语对应的中文含义' : '选择每个中文含义对应的德语词语'}
          </p>

          {/* 题目列表 */}
          <div className="space-y-6">
            {data.map(item => (
              <div key={item.id} className="border-b pb-6 last:border-b-0">
                {/* 题目 */}
                <div className="flex items-center gap-4 mb-3">
                  {mode === 'de2zh' ? (
                    <button
                      onClick={() => speak(item.german)}
                      className="text-2xl font-bold text-blue-600 hover:text-blue-800 min-w-[140px] text-left"
                    >
                      {item.german} 🔊
                    </button>
                  ) : (
                    <span className="text-2xl font-bold text-gray-800 min-w-[140px]">
                      {item.chinese}
                    </span>
                  )}
                  <span className="text-gray-400">→</span>
                  <span className="text-lg text-gray-600">
                    {answers[item.id] || '?'}
                  </span>
                  {answers[item.id] && answers[item.id] === (mode === 'de2zh' ? item.chinese : item.german) && (
                    <span className="text-green-600">✓</span>
                  )}
                  {answers[item.id] && answers[item.id] !== (mode === 'de2zh' ? item.chinese : item.german) && (
                    <span className="text-red-600">✗</span>
                  )}
                </div>

                {/* 选项 */}
                <div className="flex flex-wrap gap-2 ml-40">
                  {optionsMap[item.id]?.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item.id, option, option === (mode === 'de2zh' ? item.chinese : item.german))}
                      className={getOptionClass(item.id, option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="mt-8 pt-6 border-t flex justify-between items-center">
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              重置
            </button>

            <div className="text-lg">
              <span className="font-bold text-green-600">
                正确: {correctCount}/{data.length}
              </span>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}