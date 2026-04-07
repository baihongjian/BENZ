'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// 简单德语句子数据
interface Sentence {
  id: number;
  german: string;
  chinese: string;
  pronunciation: string;
  category: string;
}

// 基本短语（英语对照）
interface BasicPhrase {
  id: number;
  english: string;
  german: string;
  chinese: string;
}

// 对话数据
interface Dialogue {
  id: number;
  speaker: "A" | "B";
  german: string;
  chinese: string;
  pronunciation: string;
}

interface DialogueScenario {
  id: string;
  title: string;
  dialogues: Dialogue[];
}

const dialogueScenarios: DialogueScenario[] = [
  {
    id: "introduce",
    title: "自我介绍",
    dialogues: [
      { id: 1, speaker: "A", german: "Hallo, ich heiße Franz. Wie heißt du?", chinese: "你好，我叫Franz。你叫什么名字？", pronunciation: "哈罗， 伊希 哈伊泽 弗兰茨。维 哈伊斯特 杜？" },
      { id: 2, speaker: "B", german: "Hallo, Franz! Ich heiße Akari.", chinese: "你好，Franz！我叫Akari。", pronunciation: "哈罗，弗兰茨！伊希 哈伊泽 阿卡里。" },
      { id: 3, speaker: "A", german: "Akari, woher kommst du?", chinese: "Akari，你来自哪里？", pronunciation: "阿卡里，沃黑尔 科姆斯特 杜？" },
      { id: 4, speaker: "B", german: "Ich komme aus Japan. Ich bin Japanerin.", chinese: "我来自日本。我是日本人。", pronunciation: "伊希 科梅 奥斯 雅潘。伊希 宾 雅潘erin。" },
    ],
  },
  {
    id: "wohnen",
    title: "居住地点",
    dialogues: [
      { id: 1, speaker: "A", german: "Woher kommst du, Franz?", chinese: "Franz，你来自哪里？", pronunciation: "沃黑尔 科姆斯特 杜，弗兰茨？" },
      { id: 2, speaker: "B", german: "Ich komme aus Hannover, aus Deutschland. Aber jetzt arbeite ich hier in Köln.", chinese: "我来自德国汉诺威。但现在我在科隆工作。", pronunciation: "伊希 科梅 奥斯 汉诺威，奥斯 德奇兰德。阿尔 现在特 阿尔贝伊特 伊希 黑尔 因 科隆。" },
      { id: 3, speaker: "A", german: "Und wo wohnst du, Akari?", chinese: "Akari，你住在哪里？", pronunciation: "温特 沃 沃斯特斯特 杜，阿卡里？" },
      { id: 4, speaker: "B", german: "Ich wohne in München.", chinese: "我住在慕尼黑。", pronunciation: "伊希 沃内 因 慕尼希。" },
    ],
  },
  {
    id: "name",
    title: "姓名登记",
    dialogues: [
      { id: 1, speaker: "A", german: "Der Nächste, bitte!", chinese: "下一位，请！", pronunciation: "德尔 奈希斯特， 比特！" },
      { id: 2, speaker: "A", german: "Guten Tag! Wie ist Ihr Name, bitte?", chinese: "您好！请问您的名字？", pronunciation: "古腾 塔克！维 伊斯特 伊尔 纳梅， 比特？" },
      { id: 3, speaker: "B", german: "Guten Tag! Mein Name ist Akari Sudo.", chinese: "您好！我的名字是Akari Sudo。", pronunciation: "古腾 塔克！迈因 纳梅 伊斯特 阿卡里 苏杜。" },
      { id: 4, speaker: "A", german: "Gerne! Also, A-K-A-R-I, S-U-D-O", chinese: "好的！也就是A-K-A-R-I, S-U-D-O", pronunciation: "格尔内！阿尔佐， A-K-A-R-I, S-U-D-O" },
      { id: 5, speaker: "B", german: "Super! Danke schön!", chinese: "太棒了！非常感谢！", pronunciation: "苏佩尔！丹克 舍恩！" },
    ],
  },
];

const sentences: Sentence[] = [
  // 基本问候
  { id: 1, german: "Guten Morgen!", chinese: "早上好！", pronunciation: "古腾 莫根", category: "greeting" },
  { id: 2, german: "Guten Tag!", chinese: "你好！", pronunciation: "古腾 塔克", category: "greeting" },
  { id: 3, german: "Guten Abend!", chinese: "晚上好！", pronunciation: "古腾 阿本特", category: "greeting" },
  { id: 4, german: "Gute Nacht!", chinese: "晚安！", pronunciation: "古特 纳希特", category: "greeting" },
  { id: 5, german: "Auf Wiedersehen!", chinese: "再见！", pronunciation: "奥弗 维德尔泽恩", category: "greeting" },
  { id: 6, german: "Tschüss!", chinese: "拜拜！", pronunciation: "丘斯", category: "greeting" },

  // 感谢与道歉
  { id: 7, german: "Danke!", chinese: "谢谢！", pronunciation: "丹克", category: "thanks" },
  { id: 8, german: "Danke schön!", chinese: "非常感谢！", pronunciation: "丹克 舍恩", category: "thanks" },
  { id: 9, german: "Vielen Dank!", chinese: "衷心感谢！", pronunciation: "菲伦 丹克", category: "thanks" },
  { id: 10, german: "Entschuldigung!", chinese: "对不起！", pronunciation: "恩特舒尔迪贡", category: "thanks" },
  { id: 11, german: "Es tut mir leid.", chinese: "我很抱歉。", pronunciation: "埃斯 敦特 米尔 莱特", category: "thanks" },
  { id: 12, german: "Kein Problem!", chinese: "没问题！", pronunciation: "凯因 普罗blem", category: "thanks" },

  // 日常用语
  { id: 13, german: "Ja.", chinese: "是。", pronunciation: "呀", category: "daily" },
  { id: 14, german: "Nein.", chinese: "不是。", pronunciation: "奈因", category: "daily" },
  { id: 15, german: "Ich verstehe.", chinese: "我明白。", pronunciation: "伊希 菲尔施泰赫", category: "daily" },
  { id: 16, german: "Ich verstehe nicht.", chinese: "我不明白。", pronunciation: "伊希 菲尔施泰赫 尼希特", category: "daily" },
  { id: 17, german: "Könnten Sie das wiederholen?", chinese: "您能再说一遍吗？", pronunciation: "克因ten 贼 达斯 维德尔霍伦", category: "daily" },
  { id: 18, german: "Langsamer, bitte.", chinese: "请说慢一点。", pronunciation: "朗萨默尔, 比特", category: "daily" },
  { id: 19, german: "Wie bitte?", chinese: "什么？", pronunciation: "维 比特", category: "daily" },
  { id: 20, german: "Genau!", chinese: "对的！", pronunciation: "格瑙", category: "daily" },

  // 常用疑问句
  { id: 21, german: "Wie heißen Sie?", chinese: "您叫什么名字？", pronunciation: "维 哈伊森 贼", category: "question" },
  { id: 22, german: "Woher kommen Sie?", chinese: "您来自哪里？", pronunciation: "沃黑尔 科门 贼", category: "question" },
  { id: 23, german: "Wie alt sind Sie?", chinese: "您多大了？", pronunciation: "维 阿尔特 辛德 贼", category: "question" },
  { id: 24, german: "Was kostet das?", chinese: "这个多少钱？", pronunciation: "瓦斯 科斯特特 达斯", category: "question" },
  { id: 25, german: "Wo ist der Bahnhof?", chinese: "火车站在哪里？", pronunciation: "沃 伊斯特 德尔 班霍夫", category: "question" },
  { id: 26, german: "Wie spät ist es?", chinese: "现在几点了？", pronunciation: "维 施派特 伊斯特 埃斯", category: "question" },
  { id: 27, german: "Haben Sie ...?", chinese: "您有...吗？", pronunciation: "哈本 贼", category: "question" },
  { id: 28, german: "Kann ich ...?", chinese: "我可以...吗？", pronunciation: "坎 伊希", category: "question" },

  // 数字
  { id: 29, german: "Eins, zwei, drei.", chinese: "一，二，三。", pronunciation: "艾因斯, 茨维, 德赖", category: "number" },
  { id: 30, german: "Vier, fünf, sechs.", chinese: "四，五，六。", pronunciation: "费尔, 芬夫, 泽克斯", category: "number" },
  { id: 31, german: "Sieben, acht, neun, zehn.", chinese: "七，八，九，十。", pronunciation: "齐本, 阿希特, 诺因, 蔡恩", category: "number" },

  // 时间相关
  { id: 32, german: "Heute ist Montag.", chinese: "今天是星期一。", pronunciation: "霍伊特 伊斯特 蒙塔克", category: "time" },
  { id: 33, german: "Morgen ist Dienstag.", chinese: "明天是星期二。", pronunciation: "莫根 伊斯特 丁斯塔克", category: "time" },
  { id: 34, german: "Jetzt.", chinese: "现在。", pronunciation: "耶特", category: "time" },
  { id: 35, german: "Später.", chinese: "稍后。", pronunciation: "施派特", category: "time" },
  { id: 36, german: "Gleich.", chinese: "马上。", pronunciation: "格莱希", category: "time" },

  // 餐厅用语
  { id: 37, german: "Die Speisekarte, bitte.", chinese: "请给我菜单。", pronunciation: "迪 施莱泽卡尔特, 比特", category: "restaurant" },
  { id: 38, german: "Ich möchte bestellen.", chinese: "我想点餐。", pronunciation: "伊希 梅希特 贝施泰伦", category: "restaurant" },
  { id: 39, german: "Die Rechnung, bitte.", chinese: "买单。", pronunciation: "迪 雷希农, 比特", category: "restaurant" },
  { id: 40, german: "Das ist lecker!", chinese: "好吃！", pronunciation: "达斯 伊斯特 莱克", category: "restaurant" },
  { id: 41, german: "Ich bin satt.", chinese: "我吃饱了。", pronunciation: "伊希 宾 扎特", category: "restaurant" },

  // 购物用语
  { id: 42, german: "Wie viel kostet das?", chinese: "这个多少钱？", pronunciation: "维 菲尔 科斯特特 达斯", category: "shopping" },
  { id: 43, german: "Zu teuer!", chinese: "太贵了！", pronunciation: "茨u 托伊尔", category: "shopping" },
  { id: 44, german: "Ich nehme das.", chinese: "我要这个。", pronunciation: "伊希 内梅 达斯", category: "shopping" },
  { id: 45, german: "Haben Sie das in einer anderen Größe?", chinese: "这个有其他尺寸吗？", pronunciation: "哈本 贼 达斯 因 艾纳 安德伦 格勒塞", category: "shopping" },

  // 常用短句
  { id: 46, german: "Alles klar!", chinese: "好的！", pronunciation: "阿勒斯 克拉尔", category: "phrase" },
  { id: 47, german: "Moment, bitte.", chinese: "请稍等。", pronunciation: "莫蒙特, 比特", category: "phrase" },
  { id: 48, german: "Natürlich!", chinese: "当然！", pronunciation: "那图尔利希", category: "phrase" },
  { id: 49, german: "Leider nicht.", chinese: "很遗憾，不是。", pronunciation: "莱德 尼希特", category: "phrase" },
  { id: 50, german: "Das macht nichts.", chinese: "没关系。", pronunciation: "达斯 马希特 尼希特斯", category: "phrase" },
  { id: 51, german: "Gute Idee!", chinese: "好主意！", pronunciation: "古特 伊德", category: "phrase" },
  { id: 52, german: "Keine Ahnung.", chinese: "我不知道。", pronunciation: "凯纳 阿农", category: "phrase" },
  { id: 53, german: "Ich bin müde.", chinese: "我累了。", pronunciation: "伊希 宾 吕德", category: "phrase" },
  { id: 54, german: "Ich habe Hunger.", chinese: "我饿了。", pronunciation: "伊希 哈伯 洪格尔", category: "phrase" },
  { id: 55, german: "Ich habe Durst.", chinese: "我渴了。", pronunciation: "伊希 哈伯 杜尔斯特", category: "phrase" },
  { id: 56, german: "Mir ist kalt.", chinese: "我冷。", pronunciation: "米尔 伊斯特 卡尔特", category: "phrase" },
  { id: 57, german: "Mir ist warm.", chinese: "我热。", pronunciation: "米尔 伊斯特 瓦尔姆", category: "phrase" },
];

// 句子分类
const sentenceCategories = [
  { id: "all", name: "全部" },
  { id: "greeting", name: "问候" },
  { id: "thanks", name: "感谢道歉" },
  { id: "daily", name: "日常用语" },
  { id: "question", name: "疑问句" },
  { id: "number", name: "数字" },
  { id: "time", name: "时间" },
  { id: "restaurant", name: "餐厅" },
  { id: "shopping", name: "购物" },
  { id: "phrase", name: "常用短句" },
];

// 基本短语（英语-德语对照）
const basicPhrases: BasicPhrase[] = [
  { id: 1, english: "Hello.", german: "Hallo.", chinese: "你好。" },
  { id: 2, english: "Thank you.", german: "Danke schön.", chinese: "谢谢。" },
  { id: 3, english: "You're welcome.", german: "Bitte schön.", chinese: "不客气。" },
  { id: 4, english: "Sure.", german: "Natürlich.", chinese: "当然。" },
  { id: 5, english: "Exactly.", german: "Genau.", chinese: "没错。" },
  { id: 6, english: "I can speak a little English.", german: "Ich kann ein bisschen Englisch sprechen.", chinese: "我可以讲一点英语。" },
  { id: 7, english: "Can you say that again?", german: "Wie bitte?", chinese: "您能再说一遍吗？" },
  { id: 8, english: "Can you speak more slowly?", german: "Bitte sprechen Sie langsamer.", chinese: "请说慢一点。" },
  { id: 9, english: "Did you say something?", german: "Haben Sie etwas gesagt?", chinese: "您说了什么吗？" },
  { id: 10, english: "I'm sorry.", german: "Es tut mir leid.", chinese: "对不起。" },
  { id: 11, english: "I don't know.", german: "Ich weiß nicht.", chinese: "我不知道。" },
  { id: 12, english: "I'm a stranger here.", german: "Ich bin fremd hier.", chinese: "我是这里的陌生人。" },
  { id: 13, english: "Take care.", german: "Pass auf dich auf.", chinese: "保重。" },
  { id: 14, english: "Goodbye.", german: "Auf Wiedersehen.", chinese: "再见。" },
  { id: 15, english: "Have fun.", german: "Viel Spaß!", chinese: "玩得开心！" },
  { id: 16, english: "Have a nice trip.", german: "Gute Reise!", chinese: "旅途愉快！" },
];

// 基本短语2（英语-德语对照）
const basicPhrases2: BasicPhrase[] = [
  { id: 1, english: "Hello.", german: "Hallo.", chinese: "你好。" },
  { id: 2, english: "May I help you?", german: "Kann ich Ihnen helfen?", chinese: "我可以帮您吗？" },
  { id: 3, english: "Have a nice day.", german: "Schönen Tag noch!", chinese: "祝您愉快！" },
  { id: 4, english: "Goodbye.", german: "Tschüss!", chinese: "再见！" },
  { id: 5, english: "Thank you very much.", german: "Vielen Dank!", chinese: "非常感谢！" },
  { id: 6, english: "You're welcome.", german: "Gerne!", chinese: "不客气！" },
  { id: 7, english: "Certainly.", german: "Natürlich!", chinese: "当然！" },
  { id: 8, english: "Excuse me.", german: "Entschuldigung!", chinese: "打扰一下！" },
  { id: 9, english: "I'm very sorry.", german: "Es tut mir sehr leid.", chinese: "我很抱歉。" },
  { id: 10, english: "Please wait a moment.", german: "Einen Moment bitte!", chinese: "请稍等！" },
  { id: 11, english: "Thank you for waiting.", german: "Danke fürs Warten!", chinese: "谢谢您等我！" },
  { id: 12, english: "Here you are.", german: "Bitte!", chinese: "给您！" },
  { id: 13, english: "Could you speak more slowly?", german: "Können Sie langsamer sprechen?", chinese: "您能说慢一点吗？" },
  { id: 14, english: "May I have your name?", german: "Wie heißen Sie?", chinese: "请问您叫什么？" },
  { id: 15, english: "May I see it?", german: "Kann ich das mal sehen?", chinese: "我可以看一下吗？" },
  { id: 16, english: "Is there something wrong?", german: "Alles okay?", chinese: "一切都好吗？" },
];

// 购物短语（英语-德语-中文对照）
const basicPhrases3: BasicPhrase[] = [
  { id: 1, english: "Good day! May I help you?", german: "Guten Tag! Kann ich Ihnen helfen?", chinese: "您好！有什么可以帮助您的吗？" },
  { id: 2, english: "What are you looking for?", german: "Wonach suchen Sie?", chinese: "您在找什么？" },
  { id: 3, english: "Do you need help?", german: "Brauchen Sie Hilfe?", chinese: "需要帮忙吗？" },
  { id: 4, english: "Are you being helped?", german: "Werden Sie schon bedient?", chinese: "已经有人为您服务了吗？" },
  { id: 5, english: "One moment, please.", german: "Einen Moment, bitte.", chinese: "请稍等。" },
  { id: 6, english: "Feel free to look around.", german: "Schauen Sie sich gerne um.", chinese: "请随意参观。" },
  { id: 7, english: "Please let me know.", german: "Sagen Sie mir bitte Bescheid.", chinese: "请告诉我。" },
  { id: 8, english: "Would you like to try it on?", german: "Möchten Sie es anprobieren?", chinese: "您想试穿吗？" },
  { id: 9, english: "Do you like it?", german: "Gefällt es Ihnen gut?", chinese: "您喜欢吗？" },
  { id: 10, english: "It fits you well.", german: "Das passt gut zu Ihnen.", chinese: "很适合您。" },
  { id: 11, english: "We have other sizes.", german: "Wir haben andere Größen.", chinese: "我们有其他尺码。" },
  { id: 12, english: "Unfortunately sold out.", german: "Leider ausverkauft.", chinese: "很遗憾，已售罄。" },
  { id: 13, english: "No more in stock.", german: "Nicht mehr auf Lager.", chinese: "没有库存了。" },
  { id: 14, english: "This is not for sale.", german: "Das ist nicht zum Verkauf.", chinese: "这个不卖。" },
  { id: 15, english: "Please line up here.", german: "Bitte hier anstellen.", chinese: "请在这里排队。" },
  { id: 16, english: "Would you like a bag?", german: "Möchten Sie eine Tüte?", chinese: "您需要袋子吗？" },
  { id: 17, english: "Cash or card?", german: "Bar oder mit Karte?", chinese: "现金还是刷卡？" },
  { id: 18, english: "Here is your receipt.", german: "Hier ist Ihr Kassenbon.", chinese: "这是您的收据。" },
  { id: 19, english: "Photography is not allowed.", german: "Fotografieren ist nicht erlaubt.", chinese: "禁止拍照。" },
  { id: 20, english: "Thank you very much! Come again.", german: "Vielen Dank! Kommen Sie wieder.", chinese: "非常感谢！欢迎再来。" },
];

// IT工程师工作德语
const basicPhrases4: BasicPhrase[] = [
  // 👋 基础沟通
  { id: 1, english: "Everything clear with you?", german: "Alles klar bei dir?", chinese: "你那边都好吧？" },
  { id: 2, english: "Yes, everything clear.", german: "Ja, alles klar.", chinese: "是的，都好。" },
  { id: 3, english: "Hi everyone, are you ready?", german: "Hi zusammen, seid ihr bereit?", chinese: "大家好，都准备好了吗？" },
  { id: 4, english: "Yes, okay.", german: "Ja, passt.", chinese: "好的，准备好了。" },
  // 📅 Standup / 工作汇报
  { id: 5, english: "What are you working on?", german: "Woran arbeitest du gerade?", chinese: "你现在在做什么？" },
  { id: 6, english: "I'm working on it.", german: "Ich arbeite daran.", chinese: "我在做这个。" },
  { id: 7, english: "Are you finished?", german: "Bist du fertig damit?", chinese: "你做完了吗？" },
  { id: 8, english: "I'm finished.", german: "Ich bin fertig.", chinese: "我做完了。" },
  { id: 9, english: "How far are you?", german: "Wie weit bist du?", chinese: "你进展到哪里了？" },
  { id: 10, english: "I'm almost done.", german: "Ich bin fast fertig.", chinese: "我快做完了。" },
  { id: 11, english: "Are there any problems?", german: "Gibt es Probleme?", chinese: "有什么问题吗？" },
  { id: 12, english: "I have a problem.", german: "Ich habe ein Problem.", chinese: "我有一个问题。" },
  { id: 13, english: "Why isn't it progressing?", german: "Warum geht es nicht weiter?", chinese: "为什么没有进展？" },
  { id: 14, english: "I'm blocked.", german: "Ich komme hier nicht weiter. ", chinese: "我这里推进不下去了。" },
  // 🐞 Bug / 问题
  { id: 15, english: "Does it work?", german: "Funktioniert das?", chinese: "这个能用吗？" },
  { id: 16, english: "No, that doesn't work.", german: "Nein, das funktioniert nicht.", chinese: "不能用。" },
  { id: 17, english: "What happened?", german: "Was ist passiert?", chinese: "发生了什么？" },
  { id: 18, english: "It's broken.", german: "Das ist kaputt.", chinese: "坏了。" },
  { id: 19, english: "Is there an error?", german: "Gibt es einen Fehler?", chinese: "有错误吗？" },
  { id: 20, english: "Yes, there's a bug.", german: "Ja, da ist ein Bug.", chinese: "是的，有个bug。" },
  { id: 21, english: "Can you reproduce the problem?", german: "Kannst du das Problem nachstellen?", chinese: "你能复现这个问题吗？" },
  { id: 22, english: "I can reproduce it.", german: "Ich kann das reproduzieren.", chinese: "我能复现。" },
  { id: 23, english: "Really?", german: "Wirklich?", chinese: "真的吗？" },
  { id: 24, english: "No, I can't reproduce it.", german: "Nein, ich kann das nicht reproduzieren.", chinese: "不能，我复现不了。" },
  // 🔧 技术讨论
  { id: 25, english: "Does that make sense?", german: "Macht das Sinn für dich?", chinese: "这样合理吗？" },
  { id: 26, english: "Yes, that makes sense.", german: "Ja, verstehe ich.", chinese: "合理。" },
  { id: 27, english: "Is that okay?", german: "Ist das so okay?", chinese: "这样可以吗？" },
  { id: 28, english: "Yes, that's okay.", german: "Ja, das passt so.", chinese: "可以。" },
  { id: 29, english: "What do you think about it?", german: "Was hältst du davon?", chinese: "你觉得怎么样？" },
  { id: 30, english: "Good idea.", german: "Gute Idee.", chinese: "好主意。" },
  // 继续更多
  { id: 31, english: "And this solution?", german: "Und diese Lösung?", chinese: "这个解决方案呢？" },
  { id: 32, english: "Not a good idea.", german: "Keine gute Idee.", chinese: "不是好主意。" },
  { id: 33, english: "How would you do it?", german: "Wie würdest du das machen?", chinese: "你会怎么做？" },
  { id: 34, english: "I would do it this way.", german: "Ich würde das so machen.", chinese: "我会这样做。" },
  // 🤝 协作 / 求助
  { id: 35, english: "Can you solve it alone?", german: "Kannst du das alleine lösen?", chinese: "你能自己解决吗？" },
  { id: 36, english: "No, can you help me?", german: "Nein, kannst du mir helfen?", chinese: "不能，你能帮我吗？" },
  { id: 37, english: "Can you check it?", german: "Kannst du das prüfen?", chinese: "你能检查一下吗？" },
  { id: 38, english: "Can you take a quick look?", german: "Kannst du kurz schauen?", chinese: "你能看一下吗？" },
  { id: 39, english: "Who does this?", german: "Wer macht das?", chinese: "谁来做这个？" },
  { id: 40, english: "I'll take it.", german: "Ich übernehme das.", chinese: "我来负责。" },
  { id: 41, english: "Can you take care of it?", german: "Kannst du dich darum kümmern?", chinese: "你能处理一下吗？" },
  { id: 42, english: "Yes, I'll take care of it.", german: "Ja, ich kümmere mich darum.", chinese: "好的，我来处理。" },
  { id: 43, english: "Can you check it?", german: "Kannst du das checken?", chinese: "你能确认一下吗？" },
  { id: 44, english: "Yes, I'll look at it.", german: "Ja, ich schaue mir das an.", chinese: "好的，我看一下。" },
  // 💬 确认 / 澄清
  { id: 45, english: "We're changing the logic here.", german: "Wir ändern die Logik hier.", chinese: "我们改一下这里的逻辑。" },
  { id: 46, english: "Do you mean it this way?", german: "Meinst du das so?", chinese: "你是这个意思吗？" },
  { id: 47, english: "Did you understand?", german: "Hast du es verstanden?", chinese: "你理解了吗？" },
  { id: 48, english: "Did I understand correctly?", german: "Habe ich das richtig verstanden?", chinese: "我理解得对吗？" },
  { id: 49, english: "Is anything unclear?", german: "Ist etwas unklar?", chinese: "有什么不清楚的吗？" },
  { id: 50, english: "Can you explain that?", german: "Kannst du das erklären?", chinese: "你能解释一下吗？" },
  // 🚀 收尾 / 结束
  { id: 51, english: "When will you give me feedback?", german: "Wann gibst du mir Feedback?", chinese: "什么时候给我反馈？" },
  { id: 52, english: "I'll get back to you later.", german: "Ich melde mich später.", chinese: "我稍后联系你。" },
  { id: 53, english: "Thanks for your help.", german: "Danke für deine Hilfe.", chinese: "谢谢你的帮助���" },
  { id: 54, english: "No Problem!", german: "Kein Problem!!", chinese: "没问题！" },
];

export default function SentencePracticePage() {
  const [mode, setMode] = useState<"learn" | "quiz" | "dialogue" | "phrase">("learn");
  const [category, setCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phraseSet, setPhraseSet] = useState(1);
  const phraseListRef = useRef<HTMLDivElement>(null);

  // 选择当前短语集
  const currentPhrases = phraseSet === 1 ? basicPhrases : phraseSet === 2 ? basicPhrases2 : phraseSet === 3 ? basicPhrases3 : basicPhrases4;
  const [showChinese, setShowChinese] = useState(true);
  const [showPronunciation, setShowPronunciation] = useState(true);

  // 对话模式相关状态
  const [selectedDialogue, setSelectedDialogue] = useState<DialogueScenario | null>(null);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hideAText, setHideAText] = useState(false);
  const [hideBText, setHideBText] = useState(false);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果处于对话模式
      if (mode !== "dialogue" || !selectedDialogue) return;

      // 忽略输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // 空格键播放当前句子
      if (e.key === " ") {
        e.preventDefault();
        const currentDialogue = selectedDialogue.dialogues[currentDialogueIndex];
        if (currentDialogue) {
          playDialogue(currentDialogue);
        }
      }
      // 左箭头上一句
      if (e.key === "ArrowLeft") {
        setCurrentDialogueIndex(i => {
          const newIndex = Math.max(0, i - 1);
          setTimeout(() => {
            const element = document.getElementById(`dialogue-${newIndex}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100);
          return newIndex;
        });
      }
      // 右箭头下一句
      if (e.key === "ArrowRight") {
        setCurrentDialogueIndex(i => {
          const newIndex = Math.min(selectedDialogue.dialogues.length - 1, i + 1);
          setTimeout(() => {
            const element = document.getElementById(`dialogue-${newIndex}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100);
          return newIndex;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedDialogue, currentDialogueIndex]);

  // 答题相关状态
  const [quizType, setQuizType] = useState<"german" | "chinese">("german");
  const [quizSentence, setQuizSentence] = useState<Sentence | null>(null);
  const [quizOptions, setQuizOptions] = useState<{ sentence: Sentence; isCorrect: boolean }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [wrongBook, setWrongBook] = useState<Sentence[]>([]);
  const [showWrongBook, setShowWrongBook] = useState(false);

  // 筛选句子
  const filteredSentences = category === "all"
    ? sentences
    : sentences.filter(s => s.category === category);

  // 发音函数 - 使用 Edge TTS
  const speak = async (text: string, voiceType: "male" | "female" = "male", lang: string = "de") => {
    if (typeof window === "undefined") return;

    let voiceName: string;
    if (lang === "zh") {
      voiceName = "zh-CN-XiaoxiaoNeural";
    } else {
      voiceName = voiceType === "male" ? "de-DE-ConradNeural" : "de-DE-KatjaNeural";
    }

    try {
      // 尝试使用 Edge TTS 服务器
      const response = await fetch('http://localhost:8000/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang, voice: voiceName })
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

  // 生成答题题目
  const generateQuiz = () => {
    const availableSentences = filteredSentences;
    if (availableSentences.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableSentences.length);
    const correctSentence = availableSentences[randomIndex];

    // 生成错误选项
    const wrongOptions: Sentence[] = [];
    const otherSentences = availableSentences.filter(s => s.id !== correctSentence.id);
    while (wrongOptions.length < 3 && otherSentences.length > 0) {
      const idx = Math.floor(Math.random() * otherSentences.length);
      wrongOptions.push(otherSentences[idx]);
      otherSentences.splice(idx, 1);
    }

    // 组合选项
    const options = [
      { sentence: correctSentence, isCorrect: true },
      ...wrongOptions.map(s => ({ sentence: s, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    setQuizSentence(correctSentence);
    setQuizOptions(options);
    setSelectedOption(null);
    setQuizResult(null);
    setQuizStarted(true);
  };

  // 处理选项选择
  const handleOptionSelect = (index: number) => {
    if (quizResult !== null) return;
    setSelectedOption(index);
    const isCorrect = quizOptions[index].isCorrect;
    setQuizResult(isCorrect ? "correct" : "wrong");

    // 记录错题
    if (!isCorrect && quizSentence) {
      setWrongBook(prev => {
        if (prev.some(s => s.id === quizSentence.id)) return prev;
        return [...prev, quizSentence];
      });
    }
  };

  // 下一题
  const nextQuestion = () => {
    generateQuiz();
  };

  // 播放对话
  const playDialogue = async (dialogue: Dialogue): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      setIsPlaying(true);
      const speaker = dialogue.speaker;

      const playAudio = () => {
        const voiceName = speaker === "A" ? "de-DE-ConradNeural" : "de-DE-KatjaNeural";
        console.log('TTS Request:', { text: dialogue.german, voice: voiceName });

        fetch('http://localhost:8000/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: dialogue.german, lang: 'de', voice: voiceName })
        })
        .then(response => response.json())
        .then(data => {
          console.log('TTS Response:', data);

          if (data.audio) {
            const audio = new Audio(data.audio);
            audio.onended = () => {
              setIsPlaying(false);
              resolve();
            };
            audio.play().catch(() => {
              setIsPlaying(false);
              resolve();
            });
            return;
          } else if (data.error) {
            console.error('TTS Error:', data.error);
          }
          // Fall through to browser TTS
          playBrowserTTS();
        })
        .catch(() => {
          playBrowserTTS();
        });
      };

      const playBrowserTTS = () => {
        const utterance = new SpeechSynthesisUtterance(dialogue.german);
        utterance.lang = "de-DE";
        utterance.rate = 0.85;
        utterance.pitch = speaker === "A" ? 0.8 : 1.2;

        const loadVoices = () => {
          const voices = speechSynthesis.getVoices();
          const germanVoices = voices.filter(v => v.lang.includes("de"));
          const targetVoice = germanVoices.find(v => {
            if (speaker === "A") {
              return v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('conrad');
            } else {
              return v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('katja');
            }
          });
          if (targetVoice) utterance.voice = targetVoice;
        };

        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = loadVoices;
        }

        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          resolve();
        };
        speechSynthesis.speak(utterance);
      };

      playAudio();
    });
  };

  // 播放所有对话（顺序播放）
  const playAllDialogues = async () => {
    if (!selectedDialogue) return;

    for (let i = 0; i < selectedDialogue.dialogues.length; i++) {
      setCurrentDialogueIndex(i);

      // 自动滚动到当前句子
      setTimeout(() => {
        const element = document.getElementById(`dialogue-${i}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);

      // 播放当前句子，等待播放完成
      await playDialogue(selectedDialogue.dialogues[i]);
      // 每句之间稍微停顿
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // 当前句子
  const currentSentence = filteredSentences[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-2">
            <Link
              href="/02-edu/001-language"
              className="text-sm px-3 py-1 bg-white/20 text-white rounded-full hover:bg-white/30 transition"
            >
              ← 德语学习
            </Link>
          </div>
          <h1 className="text-2xl font-bold">📝 德语简单句子练习</h1>
          <p className="mt-1 opacity-90">德语日常短句学习与练习</p>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          <button
            onClick={() => { setMode("learn"); setQuizStarted(false); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "learn" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📖 学习模式
          </button>
          <button
            onClick={() => { setMode("quiz"); setShowWrongBook(false); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "quiz" ? "bg-amber-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📝 答题模式
          </button>
          <button
            onClick={() => { setMode("dialogue"); setShowWrongBook(false); setSelectedDialogue(null); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "dialogue" ? "bg-purple-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            💬 对话练习
          </button>
          <button
            onClick={() => { setMode("phrase"); setCurrentIndex(0); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              mode === "phrase" ? "bg-amber-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📝 基本フレーズ
          </button>
          <button
            onClick={() => { setShowWrongBook(!showWrongBook); }}
            className={`px-6 py-2 rounded-full font-medium transition ${
              showWrongBook ? "bg-red-500 text-white" : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            📚 错题本 ({wrongBook.length})
          </button>
        </div>

        {/* 错题本 */}
        {showWrongBook ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">错题本</h2>
            {wrongBook.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无错题，继续加油！</p>
            ) : (
              <div className="space-y-3">
                {wrongBook.map((sentence) => (
                  <div key={sentence.id} className="bg-red-50 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-800">{sentence.german}</p>
                        <p className="text-gray-600">{sentence.chinese}</p>
                        <p className="text-sm text-gray-400">{sentence.pronunciation}</p>
                      </div>
                      <button
                        onClick={() => speak(sentence.german)}
                        className="p-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : mode === "learn" ? (
          /* 学习模式 */
          <>
            {/* 分类筛选 */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {sentenceCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setCurrentIndex(0); }}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    category === cat.id
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600 hover:bg-blue-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 显示控制 */}
            <div className="flex justify-center gap-4 mb-4 text-sm">
              <button
                onClick={() => setShowChinese(!showChinese)}
                className={`px-3 py-1 rounded-full ${showChinese ? "bg-green-500 text-white" : "bg-gray-200"}`}
              >
                {showChinese ? "🙈 隐藏中文" : "👁️ 显示中文"}
              </button>
              <button
                onClick={() => setShowPronunciation(!showPronunciation)}
                className={`px-3 py-1 rounded-full ${showPronunciation ? "bg-purple-500 text-white" : "bg-gray-200"}`}
              >
                {showPronunciation ? "🙈 隐藏发音" : "👁️ 显示发音"}
              </button>
            </div>

            {/* 句子卡片 */}
            {currentSentence && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-sm text-gray-400 mb-2">
                  {sentenceCategories.find(c => c.id === currentSentence.category)?.name}
                </div>

                <div className="text-2xl font-bold text-gray-800 mb-3">
                  {currentSentence.german}
                </div>

                {showPronunciation && (
                  <div className="text-lg text-purple-600 mb-3">
                    {currentSentence.pronunciation}
                  </div>
                )}

                {showChinese && (
                  <div className="text-xl text-green-600 mb-4">
                    {currentSentence.chinese}
                  </div>
                )}

                {/* 发音按钮 */}
                <button
                  onClick={() => speak(currentSentence.german)}
                  className="px-6 py-3 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition flex items-center gap-2 mx-auto"
                >
                  <span>🔊</span> 播放发音
                </button>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
              >
                ← 上一句
              </button>
              <span className="px-4 py-2 text-gray-600">
                {currentIndex + 1} / {filteredSentences.length}
              </span>
              <button
                onClick={() => setCurrentIndex(i => Math.min(filteredSentences.length - 1, i + 1))}
                disabled={currentIndex === filteredSentences.length - 1}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
              >
                下一句 →
              </button>
            </div>
          </>
        ) : mode === "dialogue" ? (
          /* 对话练习模式 */
          <>
            {!selectedDialogue ? (
              /* 选择对话场景 */
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">选择对话场景</h2>
                <div className="space-y-3">
                  {dialogueScenarios.map(scenario => (
                    <button
                      key={scenario.id}
                      onClick={() => { setSelectedDialogue(scenario); setCurrentDialogueIndex(0); }}
                      className="w-full py-4 px-6 bg-purple-50 text-purple-700 rounded-xl font-medium hover:bg-purple-100 transition text-left flex items-center gap-3"
                    >
                      <span className="text-2xl">💬</span>
                      <div>
                        <div className="font-bold">{scenario.title}</div>
                        <div className="text-sm text-purple-500">{scenario.dialogues.length} 句对话</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 对话内容显示 */
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">{selectedDialogue.title}</h2>
                  <button
                    onClick={() => setSelectedDialogue(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
                  >
                    ← 返回
                  </button>
                </div>

                {/* 播放所有对话按钮 */}
                <div className="text-center mb-4">
                  <button
                    onClick={playAllDialogues}
                    disabled={isPlaying}
                    className="px-8 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 disabled:bg-gray-300 flex items-center gap-2 mx-auto"
                  >
                    <span>🔊</span>
                    {isPlaying ? "播放中..." : "播放全部对话"}
                  </button>
                </div>

                {/* 隐藏/显示文字按钮 */}
                <div className="flex justify-center gap-4 mb-2">
                  <button
                    onClick={() => setHideAText(!hideAText)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      hideAText ? "bg-gray-200 text-gray-600" : "bg-blue-500 text-white"
                    }`}
                  >
                    {hideAText ? "👁️ 显示 A" : "🙈 隐藏 A"}
                  </button>
                  <button
                    onClick={() => setHideBText(!hideBText)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      hideBText ? "bg-gray-200 text-gray-600" : "bg-green-500 text-white"
                    }`}
                  >
                    {hideBText ? "👁️ 显示 B" : "🙈 隐藏 B"}
                  </button>
                </div>

                {/* 快捷键提示 */}
                <div className="text-center text-xs text-gray-400 mb-4">
                  快捷键：空格=播放当前 | ←→=切换句子
                </div>

                {/* 对话列表 */}
                <div className="space-y-4">
                  {selectedDialogue.dialogues.map((dialogue, index) => {
                    const isA = dialogue.speaker === "A";
                    const shouldHideText = isA ? hideAText : hideBText;
                    const isCurrent = currentDialogueIndex === index;
                    return (
                      <div
                        id={`dialogue-${index}`}
                        key={dialogue.id}
                        className={`p-4 rounded-xl ${
                          isA ? "bg-blue-50 ml-8" : "bg-green-50 mr-8"
                        } ${isCurrent ? "ring-4 ring-amber-400 ring-opacity-50" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded text-sm font-bold ${
                                isA ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                              }`}>
                                {dialogue.speaker}
                              </span>
                              <button
                                onClick={() => { setCurrentDialogueIndex(index); playDialogue(dialogue); }}
                                disabled={isPlaying && currentDialogueIndex === index}
                                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 disabled:opacity-50 font-medium text-lg"
                              >
                                🔊 播放
                              </button>
                              {isCurrent && (
                                <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
                                  当前
                                </span>
                              )}
                            </div>
                            {!shouldHideText && (
                              <>
                                <div className="text-lg font-bold text-gray-800 mb-1">
                                  {dialogue.german}
                                </div>
                                <div className="text-sm text-purple-600 mb-1">
                                  {dialogue.pronunciation}
                                </div>
                                <div className="text-gray-600">
                                  {dialogue.chinese}
                                </div>
                              </>
                            )}
                            {shouldHideText && (
                              <div className="text-gray-400 text-sm italic">
                                （点击 🔊 播放听力）
                              </div>
                            )}
                          </div>
                          {/* 右侧编号 */}
                          <div className={`text-2xl font-bold ${
                            isCurrent ? "text-amber-500" : "text-gray-300"
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 导航 */}
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => setCurrentDialogueIndex(i => Math.max(0, i - 1))}
                    disabled={currentDialogueIndex === 0}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                  >
                    ← 上一句
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    {currentDialogueIndex + 1} / {selectedDialogue.dialogues.length}
                  </span>
                  <button
                    onClick={() => setCurrentDialogueIndex(i => Math.min(selectedDialogue.dialogues.length - 1, i + 1))}
                    disabled={currentDialogueIndex === selectedDialogue.dialogues.length - 1}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full disabled:opacity-50"
                  >
                    下一句 →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 答题模式 */
          <>
            {/* 题型选择 */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => { setQuizType("german"); setQuizStarted(false); }}
                className={`px-4 py-2 rounded-full text-sm ${
                  quizType === "german" ? "bg-green-500 text-white" : "bg-white text-gray-600"
                }`}
              >
                看中文选德语
              </button>
              <button
                onClick={() => { setQuizType("chinese"); setQuizStarted(false); }}
                className={`px-4 py-2 rounded-full text-sm ${
                  quizType === "chinese" ? "bg-green-500 text-white" : "bg-white text-gray-600"
                }`}
              >
                看德语选中文
              </button>
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {sentenceCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setQuizStarted(false); }}
                  className={`px-3 py-1 rounded-full text-xs transition ${
                    category === cat.id
                      ? "bg-amber-500 text-white"
                      : "bg-white text-gray-600 hover:bg-amber-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 开始答题按钮 */}
            {!quizStarted ? (
              <div className="text-center">
                <button
                  onClick={generateQuiz}
                  disabled={filteredSentences.length < 4}
                  className="px-8 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 disabled:bg-gray-300"
                >
                  开始答题
                </button>
                {filteredSentences.length < 4 && (
                  <p className="text-sm text-red-500 mt-2">请选择包含至少4个句子的分类</p>
                )}
              </div>
            ) : quizSentence && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* 题目 */}
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">
                    {quizType === "german" ? "请选择正确的德语" : "请选择正确的中文"}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-bold text-gray-800">
                      {quizType === "german" ? quizSentence.chinese : quizSentence.german}
                    </p>
                    <button
                      onClick={() => speak(quizSentence.german)}
                      className="p-2 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200"
                    >
                      🔊
                    </button>
                  </div>
                </div>

                {/* 选项 */}
                <div className="space-y-3">
                  {quizOptions.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const showResult = quizResult !== null;
                    const isCorrect = option.isCorrect;

                    let btnClass = "w-full py-4 rounded-xl text-lg font-medium transition ";
                    if (showResult) {
                      if (isCorrect) btnClass += "bg-green-500 text-white";
                      else if (isSelected) btnClass += "bg-red-500 text-white";
                      else btnClass += "bg-gray-100 text-gray-400";
                    } else {
                      btnClass += isSelected
                        ? "bg-amber-500 text-white"
                        : "bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-amber-50";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={showResult}
                        className={btnClass}
                      >
                        <div className="flex items-center justify-between px-4">
                          <span>{quizType === "german" ? option.sentence.german : option.sentence.chinese}</span>
                          {showResult && isCorrect && <span>✓</span>}
                          {showResult && isSelected && !isCorrect && <span>✗</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 结果和下一题 */}
                {quizResult !== null && (
                  <div className="mt-4 text-center">
                    <p className={`text-xl font-bold mb-4 ${quizResult === "correct" ? "text-green-500" : "text-red-500"}`}>
                      {quizResult === "correct" ? "🎉 回答正确！" : "❌ 回答错误"}
                    </p>
                    <button
                      onClick={nextQuestion}
                      className="px-8 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600"
                    >
                      下一题 →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 基本フレーズ模式 */}
        {mode === "phrase" && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">基本フレーズ 第{phraseSet}组</h2>
                <div className="text-sm text-gray-400">
                  {currentIndex + 1} / {currentPhrases.length}
                </div>
              </div>

              {/* 切换短语集 */}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => { setPhraseSet(1); setCurrentIndex(0); }}
                  className={`px-4 py-2 rounded-full text-sm ${
                    phraseSet === 1 ? "bg-amber-500 text-white" : "bg-gray-200"
                  }`}
                >
                  基本フレーズ1
                </button>
                <button
                  onClick={() => { setPhraseSet(2); setCurrentIndex(0); }}
                  className={`px-4 py-2 rounded-full text-sm ${
                    phraseSet === 2 ? "bg-amber-500 text-white" : "bg-gray-200"
                  }`}
                >
                  基本フレーズ2
                </button>
                <button
                  onClick={() => { setPhraseSet(3); setCurrentIndex(0); }}
                  className={`px-4 py-2 rounded-full text-sm ${
                    phraseSet === 3 ? "bg-amber-500 text-white" : "bg-gray-200"
                  }`}
                >
                  购物用语
                </button>
                <button
                  onClick={() => { setPhraseSet(4); setCurrentIndex(0); }}
                  className={`px-4 py-2 rounded-full text-sm ${
                    phraseSet === 4 ? "bg-amber-500 text-white" : "bg-gray-200"
                  }`}
                >
                  IT德语
                </button>
              </div>

              {/* 自动朗读按钮 */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={async () => {
                    setIsPlaying(true);
                    for (let i = 0; i < currentPhrases.length; i++) {
                      setCurrentIndex(i);
                      // 滚动到当前朗读的位置
                      setTimeout(() => {
                        const element = document.getElementById(`phrase-${phraseSet}-${i}`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }, 50);
                      // 先读男声
                      await speak(currentPhrases[i].german, "male");
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      // 再读女声
                      await speak(currentPhrases[i].german, "female");
                      await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                    setIsPlaying(false);
                  }}
                  disabled={isPlaying}
                  className="px-6 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50"
                >
                  {isPlaying ? "🔊 朗读中..." : "🔊 朗读全部"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setShowChinese(!showChinese)}
                    className={`px-3 py-1 rounded-full text-sm ${showChinese ? "bg-green-500 text-white" : "bg-gray-200"}`}
                  >
                    {showChinese ? "🙈 隐藏中文" : "👁️ 显示中文"}
                  </button>
                </div>

                {currentPhrases.map((phrase, index) => (
                  <div
                    key={phrase.id}
                    id={`phrase-${phraseSet}-${index}`}
                    className={`p-4 rounded-xl ${
                      index === currentIndex ? "bg-amber-50 border-2 border-amber-300" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold">
                        {phrase.id}
                      </span>
                      <span className="text-gray-500 text-sm">{phrase.english}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-gray-800">{phrase.german}</span>
                      <button
                        onClick={() => speak(phrase.german, "male")}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        🔊 男声
                      </button>
                      <button
                        onClick={() => speak(phrase.german, "female")}
                        className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-sm hover:bg-pink-200"
                      >
                        🔊 女声
                      </button>
                      <button
                        onClick={() => speak(phrase.chinese, "female", "zh")}
                        className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                      >
                        🔊 中文
                      </button>
                    </div>
                    {showChinese && (
                      <div className="text-green-600 text-sm">{phrase.chinese}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-sm">
        共 {sentences.length} 个句子 • 分类学习
      </footer>
    </div>
  );
}
