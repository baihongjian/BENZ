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
  { id: 5, english: "What are you working on?", german: "Was machst du gerade?", chinese: "你现在在做什么？" },
  { id: 6, english: "I'm working on it.", german: "Ich mache das gerade.", chinese: "我现在在做这个。" },
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

// IT工程师德语礼貌体 (Sie形式)
const basicPhrases5: BasicPhrase[] = [
  // 👋 基础沟通
  { id: 1, english: "Everything clear with you?", german: "Alles klar bei Ihnen?", chinese: "您那边都好吧？" },
  { id: 2, english: "Yes, everything clear.", german: "Ja, alles klar.", chinese: "是的，都好。" },
  { id: 3, english: "Hello everyone, are you ready?", german: "Hallo zusammen, sind Sie bereit?", chinese: "大家好，都准备好了吗？" },
  { id: 4, english: "Yes, okay.", german: "Ja, es passt.", chinese: "好的，准备好了。" },
  // 📅 Standup / 工作汇报
  { id: 5, english: "What are you working on?", german: "Was machen Sie gerade?", chinese: "您现在在做什么？" },
  { id: 6, english: "I'm working on it.", german: "Ich mache das gerade.", chinese: "我现在在做这个。" },
  { id: 7, english: "Are you finished?", german: "Sind Sie fertig damit?", chinese: "您做完了吗？" },
  { id: 8, english: "I'm finished.", german: "Ich bin fertig.", chinese: "我做完了。" },
  { id: 9, english: "How far are you?", german: "Wie weit sind Sie?", chinese: "您进展到哪里了？" },
  { id: 10, english: "I'm almost done.", german: "Ich bin fast fertig.", chinese: "我快做完了。" },
  { id: 11, english: "Are there any problems?", german: "Gibt es Probleme?", chinese: "有什么问题吗？" },
  { id: 12, english: "I have a problem.", german: "Ich habe ein Problem.", chinese: "我有一个问题。" },
  { id: 13, english: "Why isn't it progressing?", german: "Warum geht es nicht weiter?", chinese: "为什么没有进展？" },
  { id: 14, english: "I'm blocked.", german: "Ich komme hier nicht weiter.", chinese: "我这里推进不下去了。" },
  // 🐞 Bug / 问题
  { id: 15, english: "Does it work?", german: "Funktioniert das?", chinese: "这个能用吗？" },
  { id: 16, english: "No, that doesn't work.", german: "Nein, das funktioniert nicht.", chinese: "不能用。" },
  { id: 17, english: "What happened?", german: "Was ist passiert?", chinese: "发生了什么？" },
  { id: 18, english: "It's broken.", german: "Das ist kaputt.", chinese: "坏了。" },
  { id: 19, english: "Is there an error?", german: "Gibt es einen Fehler?", chinese: "有错误吗？" },
  { id: 20, english: "Yes, there's a bug.", german: "Ja, da ist ein Bug.", chinese: "是的，有个bug。" },
  { id: 21, english: "Can you reproduce the problem?", german: "Können Sie das Problem nachstellen?", chinese: "您能复现这个问题吗？" },
  { id: 22, english: "I can reproduce it.", german: "Ich kann das reproduzieren.", chinese: "我能复现。" },
  { id: 23, english: "Really?", german: "Wirklich?", chinese: "真的吗？" },
  { id: 24, english: "No, I can't reproduce it.", german: "Nein, ich kann das nicht reproduzieren.", chinese: "不能，我复现不了。" },
  // 🔧 技术讨论
  { id: 25, english: "Does that make sense?", german: "Macht das Sinn für Sie?", chinese: "这样合理吗？" },
  { id: 26, english: "Yes, that makes sense.", german: "Ja, das macht Sinn.", chinese: "合理。" },
  { id: 27, english: "Is that okay?", german: "Ist das so okay?", chinese: "这样可以吗？" },
  { id: 28, english: "Yes, that's okay.", german: "Ja, das passt so.", chinese: "可以。" },
  { id: 29, english: "What do you think about it?", german: "Was halten Sie davon?", chinese: "您觉得怎么样？" },
  { id: 30, english: "Good idea.", german: "Gute Idee.", chinese: "好主意。" },
  // 继续更多
  { id: 31, english: "And this solution?", german: "Und diese Lösung?", chinese: "这个解决方案呢？" },
  { id: 32, english: "Not a good idea.", german: "Keine gute Idee.", chinese: "不是好主意。" },
  { id: 33, english: "How would you do it?", german: "Wie würden Sie das machen?", chinese: "您会怎么做？" },
  { id: 34, english: "I would do it this way.", german: "Ich würde das so machen.", chinese: "我会这样做。" },
  // 🤝 协作 / 求助
  { id: 35, english: "Can you solve it alone?", german: "Können Sie das alleine lösen?", chinese: "您能自己解决吗？" },
  { id: 36, english: "No, can you help me?", german: "Nein, können Sie mir helfen?", chinese: "不能，您能帮我吗？" },
  { id: 37, english: "Can you check it?", german: "Können Sie das prüfen?", chinese: "您能检查一下吗？" },
  { id: 38, english: "Can you take a quick look?", german: "Können Sie kurz schauen?", chinese: "您能看一下吗？" },
  { id: 39, english: "Who does this?", german: "Wer macht das?", chinese: "谁来做这个？" },
  { id: 40, english: "I'll take it.", german: "Ich übernehme das.", chinese: "我来负责。" },
  { id: 41, english: "Can you take care of it?", german: "Können Sie sich darum kümmern?", chinese: "您能处理一下吗？" },
  { id: 42, english: "Yes, I'll take care of it.", german: "Ja, ich kümmere mich darum.", chinese: "好的，我来处理。" },
  { id: 43, english: "Can you check it?", german: "Können Sie das checken?", chinese: "您能确认一下吗？" },
  { id: 44, english: "Yes, I'll look at it.", german: "Ja, ich schaue mir das an.", chinese: "好的，我看一下。" },
  // 💬 确认 / 澄清
  { id: 45, english: "We're changing the logic here.", german: "Wir ändern die Logik hier.", chinese: "我们改一下这里的逻辑。" },
  { id: 46, english: "Do you mean it this way?", german: "Meinen Sie das so?", chinese: "您是这个意思吗？" },
  { id: 47, english: "Did you understand?", german: "Haben Sie es verstanden?", chinese: "您理解了吗？" },
  { id: 48, english: "Did I understand correctly?", german: "Habe ich das richtig verstanden?", chinese: "我理解得对吗？" },
  { id: 49, english: "Is anything unclear?", german: "Ist etwas unklar?", chinese: "有什么不清楚的吗？" },
  { id: 50, english: "Can you explain that?", german: "Können Sie das erklären?", chinese: "您能解释一下吗？" },
  // 🚀 收尾 / 结束
  { id: 51, english: "When will you give me feedback?", german: "Wann geben Sie mir Feedback?", chinese: "什么时候给我反馈？" },
  { id: 52, english: "I'll get back to you later.", german: "Ich melde mich später.", chinese: "我稍后联系您。" },
  { id: 53, english: "Thanks for your help.", german: "Danke für Ihre Hilfe.", chinese: "谢谢您的帮助。" },
  { id: 54, english: "No Problem!", german: "Kein Problem!", chinese: "没问题！" },
];

// 第1课语法 (人称动词变位)
const basicPhrases6: BasicPhrase[] = [
  // Ich人称
  { id: 1, english: "My name is Tom.", german: "Ich heiße Tom.", chinese: "我叫Tom。" },
  { id: 2, english: "I work in Japan.", german: "Ich arbeite in Japan.", chinese: "我在日本工作。" },
  { id: 3, english: "I am Japanese.", german: "Ich bin Japaner.", chinese: "我是日本人。" },
  { id: 4, english: "I live in Japan.", german: "Ich wohne in Japan.", chinese: "我住在日本。" },
  // Du人称
  { id: 5, english: "Your name is Tom.", german: "Du heißt Tom.", chinese: "你叫Tom。" },
  { id: 6, english: "You work in Japan.", german: "Du arbeitest in Japan.", chinese: "你在日本工作。" },
  { id: 7, english: "You are Japanese.", german: "Du bist Japaner.", chinese: "你是日本人。" },
  { id: 8, english: "You live in Japan.", german: "Du wohnst in Japan.", chinese: "你住在日本。" },
  // Wir人称
  { id: 9, english: "We are all named Tom.", german: "Wir heißen alle Tom.", chinese: "我们都叫Tom。" },
  { id: 10, english: "We work in Japan.", german: "Wir arbeiten in Japan.", chinese: "我们在日本工作。" },
  { id: 11, english: "We are Japanese.", german: "Wir sind Japaner.", chinese: "我们是日本人。" },
  { id: 12, english: "We live in Japan.", german: "Wir wohnen in Japan.", chinese: "我们住在日本。" },
  // Ihr人称
  { id: 13, english: "You all are named Tom.", german: "Ihr heißt alle Tom.", chinese: "你们都叫Tom。" },
  { id: 14, english: "You all work in Japan.", german: "Ihr arbeitet in Japan.", chinese: "你们在日本工作。" },
  { id: 15, english: "You all are Japanese.", german: "Ihr seid Japaner.", chinese: "你们是日本人。" },
  { id: 16, english: "You all live in Japan.", german: "Ihr wohnt in Japan.", chinese: "你们住在日本。" },
  // Sie人称
  { id: 17, english: "You (formal) are named Tom.", german: "Sie heißen alle Tom.", chinese: "您或您们都叫Tom。" },
  { id: 18, english: "You (formal) work in Japan.", german: "Sie arbeiten in Japan.", chinese: "您或您们在日本工作。" },
  { id: 19, english: "You (formal) are Japanese.", german: "Sie sind Japaner.", chinese: "您或您们是日本人。" },
  { id: 20, english: "You (formal) live in Japan.", german: "Sie wohnen in Japan.", chinese: "您或您们住在日本。" },
];

// 第1课语法（2）
const basicPhrases7: BasicPhrase[] = [
  { id: 1, english: "What is your name?", german: "Wie heißen Sie?", chinese: "您或您们叫什么？" },
  { id: 2, english: "My name is Schäfer.", german: "Ich heiße Schäfer.", chinese: "我叫 Schäfer。" },
  { id: 3, english: "Where are you from?", german: "Woher kommen Sie?", chinese: "您或您们来自哪里？" },
  { id: 4, english: "I'm from Japan.", german: "Ich komme aus Japan.", chinese: "我来自日本。" },
  { id: 5, english: "Where do you work?", german: "Wo arbeitest du?", chinese: "你在哪里工作？" },
  { id: 6, english: "I work in Leipzig.", german: "Ich arbeite in Leipzig.", chinese: "我在莱比锡工作。" },
  { id: 7, english: "Where do you all live?", german: "Wo wohnt ihr?", chinese: "你们住在哪里？" },
  { id: 8, english: "We live in Lübeck.", german: "Wir wohnen in Lübeck.", chinese: "我们住在吕贝克。" },
  { id: 9, english: "I am German.", german: "Ich bin Deutsche.", chinese: "我是德国人。" },
  { id: 10, english: "And you all?", german: "Und ihr?", chinese: "你们呢？" },
  { id: 11, english: "We are Japanese.", german: "Wir sind Japaner.", chinese: "我们是日本人。" },
  { id: 12, english: "Where do you all live?", german: "Wo wohnt ihr?", chinese: "你们住在哪里？" },
  { id: 13, english: "We live in Hamburg.", german: "Wir wohnen in Hamburg.", chinese: "我们住在汉堡。" },
  { id: 14, english: "Where do you work?", german: "Wo arbeitest du?", chinese: "你在哪里工作？" },
  { id: 15, english: "I work in Mannheim.", german: "Ich arbeite in Mannheim.", chinese: "我在曼海姆工作。" },
  { id: 16, english: "Where are you from?", german: "Woher kommst du?", chinese: "你来自哪里？" },
  { id: 17, english: "I'm from Vienna.", german: "Ich komme aus Wien.", chinese: "我来自维也纳。" },
  { id: 18, english: "What is your name?", german: "Wie heißt ihr?", chinese: "你们叫什么？" },
  { id: 19, english: "We are Schönberg.", german: "Wir heißen Schönberg.", chinese: "我们叫 Schönberg。" },
  { id: 20, english: "Where do you live?", german: "Wo wohnen Sie?", chinese: "您或您们住在哪里？" },
  { id: 21, english: "I live in Flensburg.", german: "Ich wohne in Flensburg.", chinese: "我住在弗伦斯堡。" },
];

// 5级词汇 - 人的状态（形容词）
const basicPhrases8: BasicPhrase[] = [
  { id: 1, english: "He is old.", german: "Er ist alt.", chinese: "他老。" },
  { id: 2, english: "He is young.", german: "Er ist jung.", chinese: "他年轻。" },
  { id: 3, english: "He is poor.", german: "Er ist arm.", chinese: "他穷。" },
  { id: 4, english: "He is rich.", german: "Er ist reich.", chinese: "他富。" },
  { id: 5, english: "I am free.", german: "Ich bin frei.", chinese: "我有空 / 我是自由的。" },
  { id: 6, english: "She is sad.", german: "Sie ist traurig.", chinese: "她很伤心。" },
  { id: 7, english: "She is happy.", german: "Sie ist glücklich.", chinese: "她很幸福。" },
  { id: 8, english: "He is healthy.", german: "Er ist gesund.", chinese: "他很健康。" },
  { id: 9, english: "He is sick.", german: "Er ist krank.", chinese: "他生病了。" },
  { id: 10, english: "He is weak.", german: "Er ist schwach.", chinese: "他很虚弱。" },
  { id: 11, english: "He is strong.", german: "Er ist stark.", chinese: "他很强壮。" },
  { id: 12, english: "He is quiet.", german: "Er ist leise.", chinese: "他很安静。" },
  { id: 13, english: "He is loud.", german: "Er ist laut.", chinese: "他很吵。" },
  { id: 14, english: "I am tired.", german: "Ich bin müde.", chinese: "我很累。" },
  { id: 15, english: "The dog is dead.", german: "Der Hund ist tot.", chinese: "狗死了。" },
  { id: 16, english: "The dog is alive.", german: "Der Hund ist lebendig.", chinese: "狗是活的。" },
  { id: 17, english: "I am full.", german: "Ich bin satt.", chinese: "我吃饱了。" },
  { id: 18, english: "He is friendly.", german: "Er ist freundlich.", chinese: "他很友好。" },
  { id: 19, english: "He is nice.", german: "Er ist nett.", chinese: "他人很好。" },
  { id: 20, english: "He is smart.", german: "Er ist klug.", chinese: "他很聪明。" },
  { id: 21, english: "He is stupid.", german: "Er ist dumm.", chinese: "他很笨。" },
  { id: 22, english: "He is lazy.", german: "Er ist faul.", chinese: "他很懒。" },
  { id: 23, english: "He is diligent.", german: "Er ist fleißig.", chinese: "他很勤奋。" },
];

// Maus对话1 (Sie形式)
const basicPhrases9: BasicPhrase[] = [
  { id: 1, english: "Good day.", german: "Guten Tag.", chinese: "您好。" },
  { id: 2, english: "Good day.", german: "Guten Tag.", chinese: "您好。" },
  { id: 3, english: "Good day. How are you?", german: "Guten Tag. Wie geht es Ihnen?", chinese: "您好，您怎么样？" },
  { id: 4, english: "Hmm, so so.", german: "Hm, es geht so.", chinese: "嗯，还可以。" },
  { id: 5, english: "Good morning.", german: "Guten Morgen.", chinese: "早上好。" },
  { id: 6, english: "Good morning. Did you sleep well?", german: "Guten Morgen. Haben Sie gut geschlafen?", chinese: "早上好，您睡得好吗？" },
  { id: 7, english: "Good evening.", german: "Guten Abend.", chinese: "晚上好。" },
  { id: 8, english: "Good evening. I have a table reserved.", german: "Guten Abend. Ich habe einen Tisch reserviert.", chinese: "晚上好，我已经订了位子。" },
  { id: 9, english: "This is a gift for you.", german: "Das ist ein Geschenk für Sie.", chinese: "这是给您的礼物。" },
  { id: 10, english: "Thank you very much.", german: "Vielen Dank.", chinese: "非常感谢。" },
  { id: 11, english: "You're welcome.", german: "Gern geschehen.", chinese: "不客气。" },
  { id: 12, english: "Thank you very much. That is very nice.", german: "Vielen Dank. Das ist sehr schön.", chinese: "非常感谢，真好。" },
  { id: 13, english: "My name is Maus.", german: "Ich heiße Maus.", chinese: "我叫Maus。" },
  { id: 14, english: "My name is Elefant.", german: "Ich heiße Elefant.", chinese: "我叫Elefant。" },
  { id: 15, english: "Nice to meet you.", german: "Es freut mich, Sie kennenzulernen.", chinese: "很高兴认识您。" },
  { id: 16, english: "I am Swiss.", german: "Ich bin Schweizer.", chinese: "我是瑞士人。" },
  { id: 17, english: "And you?", german: "Und Sie?", chinese: "您呢？" },
  { id: 18, english: "I am Japanese.", german: "Ich bin Japanerin.", chinese: "我是日本人。" },
  { id: 19, english: "Where are you from?", german: "Woher kommen Sie?", chinese: "您来自哪里？" },
  { id: 20, english: "I am from Japan.", german: "Ich komme aus Japan.", chinese: "我来自日本。" },
  { id: 21, english: "And you?", german: "Und Sie?", chinese: "您呢？" },
  { id: 22, english: "I am from Germany.", german: "Ich komme aus Deutschland.", chinese: "我来自德国。" },
  { id: 23, english: "That is interesting. I like Germany.", german: "Das ist interessant. Ich mag Deutschland.", chinese: "很有意思，我喜欢德国。" },
  { id: 24, english: "Goodbye. All the best for you.", german: "Auf Wiedersehen. Alles Gute für Sie.", chinese: "再见，祝您一切顺利。" },
  { id: 25, english: "Thank you. Hope to see you soon.", german: "Vielen Dank. Hoffentlich bis bald.", chinese: "谢谢，希望很快再见。" },
  { id: 26, english: "I have to go now. See you next time.", german: "Ich muss jetzt leider gehen. Bis zum nächsten Mal.", chinese: "我现在得走了，下次见。" },
  { id: 27, english: "All right. I wish you a nice day.", german: "Alles klar. Ich wünsche Ihnen einen schönen Tag.", chinese: "好的，祝您愉快的一天。" },
  { id: 28, english: "I have to go now. Goodbye.", german: "Ich muss jetzt gehen. Auf Wiedersehen.", chinese: "我要走了，再见。" },
  { id: 29, english: "Goodbye. It was very nice with you.", german: "Auf Wiedersehen. Es war sehr schön mit Ihnen.", chinese: "再见，和您在一起很愉快。" },
  { id: 30, english: "Hope to see you soon.", german: "Hoffentlich sehen wir uns bald wieder.", chinese: "希望很快再见。" },
  { id: 31, english: "Yes, all the best for you.", german: "Ja, alles Gute für Sie.", chinese: "好的，祝您一切顺利。" },
  { id: 32, english: "That looks very delicious.", german: "Das sieht sehr lecker aus.", chinese: "看起来很好吃。" },
  { id: 33, english: "Yes, really. Enjoy your meal.", german: "Ja, wirklich. Guten Appetit.", chinese: "是的，祝您好胃口。" },
  { id: 34, english: "Good night. Sleep well.", german: "Gute Nacht. Schlafen Sie gut.", chinese: "晚安，请睡个好觉。" },
  { id: 35, english: "Thank you, you too. Good night.", german: "Vielen Dank, Ihnen auch. Gute Nacht.", chinese: "谢谢，您也是，晚安。" },
  { id: 36, english: "I am coming tomorrow at 3pm. Is that okay for you?", german: "Ich komme morgen um 15 Uhr. Ist das für Sie in Ordnung?", chinese: "我明天下午3点来，可以吗？" },
  { id: 37, english: "Yes, very gladly. I am looking forward to seeing you.", german: "Ja, sehr gern. Ich freue mich auf Sie.", chinese: "好的，非常乐意，我很期待见到您。" },
  { id: 38, english: "The movie is very sad.", german: "Der Film ist sehr traurig.", chinese: "这部电影很悲伤。" },
  { id: 39, english: "Yes, that is true. But it is also very funny.", german: "Ja, das stimmt. Aber er ist auch sehr lustig.", chinese: "是的，但也很有趣。" },
  { id: 40, english: "Today is Monday. The museum is closed.", german: "Heute ist Montag. Das Museum ist geschlossen.", chinese: "今天周一，博物馆关门。" },
  { id: 41, english: "That is true. Too bad. Would you like to go to the cinema?", german: "Das stimmt. Schade. Möchten Sie ins Kino gehen?", chinese: "是的，可惜。您想去看电影吗？" },
  { id: 42, english: "Are you tired? Would you like to rest?", german: "Sind Sie müde? Möchten Sie sich ausruhen?", chinese: "您累了吗？要休息一下吗？" },
  { id: 43, english: "Yes, I am tired. Today was a long day.", german: "Ja, ich bin müde. Heute war ein langer Tag.", chinese: "是的，我很累，今天很漫长。" },
];

// 5级词汇（其它17）物体的状态
const basicPhrases10: BasicPhrase[] = [
  { id: 1, english: "The house is big.", german: "Das Haus ist groß.", chinese: "这个房子很大。" },
  { id: 2, english: "The dog is small.", german: "Der Hund ist klein.", chinese: "这只狗很小。" },
  { id: 3, english: "The road is long.", german: "Der Weg ist lang.", chinese: "这条路很长。" },
  { id: 4, english: "The movie is short.", german: "Der Film ist kurz.", chinese: "这部电影很短。" },
  { id: 5, english: "The suitcase is heavy.", german: "Der Koffer ist schwer.", chinese: "这个行李很重。" },
  { id: 6, english: "The task is easy.", german: "Die Aufgabe ist leicht.", chinese: "这个任务很简单。" },
  { id: 7, english: "The park is far.", german: "Der Park ist weit.", chinese: "这个公园很广。" },
  { id: 8, english: "The street is narrow.", german: "Die Straße ist eng.", chinese: "这条街很窄。" },
  { id: 9, english: "The car is fast.", german: "Das Auto ist schnell.", chinese: "这辆车很快。" },
  { id: 10, english: "The train is slow.", german: "Der Zug ist langsam.", chinese: "这列火车很慢。" },
  { id: 11, english: "The city is beautiful.", german: "Die Stadt ist schön.", chinese: "这个城市很美。" },
  { id: 12, english: "The phone is new.", german: "Das Handy ist neu.", chinese: "这个手机是新的。" },
  { id: 13, english: "The mountain is high.", german: "Der Berg ist hoch.", chinese: "这座山很高。" },
  { id: 14, english: "The bread is fresh.", german: "Das Brot ist frisch.", chinese: "这个面包很新鲜。" },
  { id: 15, english: "The music is loud.", german: "Die Musik ist laut.", chinese: "音乐很吵。" },
  { id: 16, english: "The child is cute.", german: "Das Kind ist süß.", chinese: "这个孩子很可爱。" },
  { id: 17, english: "This is another idea.", german: "Das ist eine andere Idee.", chinese: "这是另一个想法。" },
  { id: 18, english: "We are going now.", german: "Wir gehen gleich.", chinese: "我们马上走。" },
  { id: 19, english: "The phone is broken.", german: "Das Handy ist kaputt.", chinese: "手机坏了。" },
  { id: 20, english: "This is important.", german: "Das ist wichtig.", chinese: "这很重要。" },
];

// 第2课练习1（职业与业余活动）
const basicPhrases11: BasicPhrase[] = [
  { id: 1, english: "What is your profession?", german: "Was machen Sie beruflich?", chinese: "您或您们是做什么工作的？" },
  { id: 2, english: "I write books professionally.", german: "Ich schreibe beruflich Bücher.", chinese: "我从事写书的工作。" },
  { id: 3, english: "What are you doing now?", german: "Was machen Sie gerade?", chinese: "您或您们现在在做什么？" },
  { id: 4, english: "I am playing piano now.", german: "Ich spiele gerade Klavier.", chinese: "我现在正在弹钢琴。" },
  { id: 5, english: "What do you do in your free time?", german: "Was machen Sie in der Freizeit?", chinese: "您或您们业余时间做什么？" },
  { id: 6, english: "We play basketball in our free time.", german: "Wir spielen in der Freizeit Basketball.", chinese: "我们在业余时间打篮球。" },
  { id: 7, english: "What do you do in your free time?", german: "Was machen Sie in der Freizeit?", chinese: "您或您们业余时间做什么？" },
  { id: 8, english: "I go to the museum in my free time.", german: "Ich gehe in der Freizeit ins Museum.", chinese: "我在业余时间去博物馆。" },
  { id: 9, english: "What is your profession?", german: "Was machen Sie beruflich?", chinese: "您或您们是做什么工作的？" },
  { id: 10, english: "I sell vegetables professionally.", german: "Ich verkaufe beruflich Gemüse.", chinese: "我从事卖蔬菜的工作。" },
];

// 第2课练习2（兴趣爱好）
const basicPhrases12: BasicPhrase[] = [
  { id: 1, english: "Do you often play the violin?", german: "Spielst du oft Geige?", chinese: "你经常拉小提琴吗？" },
  { id: 2, english: "Yes, I often play the violin.", german: "Ja, ich spiele oft Geige.", chinese: "是���，我经常拉小提琴。" },
  { id: 3, english: "No, I don't often play the violin.", german: "Nein, ich spiele nicht oft Geige.", chinese: "不，我不经常拉小提琴。" },
  { id: 4, english: "Do you sing?", german: "Singen Sie?", chinese: "您唱歌吗？" },
  { id: 5, english: "Yes, I sing.", german: "Ja, ich singe.", chinese: "是的，我唱歌。" },
  { id: 6, english: "No, I don't sing.", german: "Nein, ich singe nicht.", chinese: "不，我不唱歌。" },
  { id: 7, english: "Do you like reading novels?", german: "Lesen Sie gern Romane?", chinese: "您喜欢看小说吗？" },
  { id: 8, english: "Yes, I like reading novels.", german: "Ja, ich lese gern Romane.", chinese: "是的，我喜欢看小说。" },
  { id: 9, english: "No, I don't like reading novels.", german: "Nein, ich lese nicht gern Romane.", chinese: "不，我不喜欢看小说。" },
  { id: 10, english: "Do you all like going to the cinema?", german: "Geht ihr gern ins Kino?", chinese: "你们喜欢去看电影吗？" },
  { id: 11, english: "Yes, we like going to the cinema.", german: "Ja, wir gehen gern ins Kino.", chinese: "是的，我们喜欢去看电影。" },
  { id: 12, english: "No, we don't like going to the cinema.", german: "Nein, wir gehen nicht gern ins Kino.", chinese: "不，我们不喜欢去看电影。" },
  { id: 13, english: "Do you live in Potsdam?", german: "Wohnen Sie in Potsdam?", chinese: "您住在波茨坦吗？" },
  { id: 14, english: "Yes, I live in Potsdam.", german: "Ja, ich wohne in Potsdam.", chinese: "是的，我住在波茨坦。" },
  { id: 15, english: "No, I don't live in Potsdam.", german: "Nein, ich wohne nicht in Potsdam.", chinese: "不，我不住在波茨坦。" },
];

// 5级词汇19-场所/空间/时
const basicPhrases19: BasicPhrase[] = [
  { id: 1, english: "I am here.", german: "Ich bin hier.", chinese: "我在这里。" },
  { id: 2, english: "The car is over there.", german: "Das Auto steht dort.", chinese: "那辆车停在那里。" },
  { id: 3, english: "My friend is gone.", german: "Mein Freund ist weg.", chinese: "我的朋友离开了。" },
  { id: 4, english: "I'll be back.", german: "Ich komme zurück.", chinese: "我会回来。" },
  { id: 5, english: "The school is on the left.", german: "Die Schule ist links.", chinese: "学校在左边。" },
  { id: 6, english: "The supermarket is on the right.", german: "Der Supermarkt ist rechts.", chinese: "超市在右边。" },
  { id: 7, english: "I work today.", german: "Heute arbeite ich.", chinese: "我今天工作。" },
  { id: 8, english: "I was at home yesterday.", german: "Gestern war ich zu Hause.", chinese: "我昨天在家。" },
  { id: 9, english: "I learn German tomorrow.", german: "Morgen lerne ich Deutsch.", chinese: "我明天学习德语。" },
  { id: 10, english: "I'm coming soon.", german: "Ich komme bald.", chinese: "我很快就来。" },
  { id: 11, english: "I eat, then I sleep.", german: "Ich esse, dann schlafe ich.", chinese: "我吃饭，然后睡觉。" },
  { id: 12, english: "I am learning German right now.", german: "Ich lerne gerade Deutsch.", chinese: "我正在学德语。" },
  { id: 13, english: "I have time now.", german: "Ich habe jetzt Zeit.", chinese: "我现在有时间。" },
  { id: 14, english: "I was once in Berlin.", german: "Ich war einmal in Berlin.", chinese: "我曾经去过柏林。" },
  { id: 15, english: "I am still tired.", german: "Ich bin noch müde.", chinese: "我还很累。" },
  { id: 16, english: "I am already done.", german: "Ich bin schon fertig.", chinese: "我已经完成了。" },
  { id: 17, english: "See you later.", german: "Wir sehen uns später.", chinese: "我们稍后见。" },
  { id: 18, english: "I get up early.", german: "Ich stehe früh auf.", chinese: "我早起。" },
  { id: 19, english: "He comes home late.", german: "Er kommt spät nach Hause.", chinese: "他很晚回家。" },
  { id: 20, english: "I come at eight o'clock.", german: "Ich komme erst um acht.", chinese: "我八点才来。" },
  { id: 21, english: "Next week I have vacation.", german: "Nächste Woche habe ich Urlaub.", chinese: "下周我休假。" },
  { id: 22, english: "Last week I was sick.", german: "Letzte Woche war ich krank.", chinese: "上周我生病了。" },
];

// 5级词汇12-思考/知识/发现/心/感情
const basicPhrases13: BasicPhrase[] = [
  { id: 1, english: "I am thinking about tomorrow.", german: "Ich denke an morgen.", chinese: "我在想着明天。" },
  { id: 2, english: "I believe you.", german: "Ich glaube dir.", chinese: "我相信你。" },
  { id: 3, english: "I tell a story.", german: "Ich erzähle eine Geschichte.", chinese: "我讲一个故事。" },
  { id: 4, english: "I know Berlin.", german: "Ich kenne Berlin.", chinese: "我认识（了解）柏林。" },
  { id: 5, english: "I already know that.", german: "Ich weiß das schon.", chinese: "我已经知道那个了。" },
  { id: 6, english: "I think that is good.", german: "Ich finde das gut.", chinese: "我觉得那个很好。" },
  { id: 7, english: "I often forget my key.", german: "Ich vergesse oft meinen Schlüssel.", chinese: "我经常忘记我的钥匙。" },
  { id: 8, english: "I love music.", german: "Ich liebe Musik.", chinese: "我爱音乐。" },
  { id: 9, english: "I am happy today.", german: "Ich freue mich heute.", chinese: "我今天很高兴。" },
  { id: 10, english: "I thank you.", german: "Ich danke Ihnen.", chinese: "我感谢您。" },
  { id: 11, english: "I like that.", german: "Das gefällt mir.", chinese: "我喜欢那个。（那个使我喜欢）" },
  { id: 12, english: "I see a bird.", german: "Ich sehe einen Vogel.", chinese: "我看见一只鸟。" },
  { id: 13, english: "I hear music.", german: "Ich höre Musik.", chinese: "我听音乐。" },
  { id: 14, english: "I laugh loudly.", german: "Ich lache laut.", chinese: "我大声笑。" },
  { id: 15, english: "I don't cry.", german: "Ich weine nicht.", chinese: "我不哭。" },
  { id: 16, english: "I feel tired.", german: "Ich fühle mich müde.", chinese: "我感觉累了。" },
];

// 5级词汇15-移动/动作
const basicPhrases14: BasicPhrase[] = [
  { id: 1, english: "I go home.", german: "Ich gehe nach Hause.", chinese: "我走回家。" },
  { id: 2, english: "I take the bus.", german: "Ich fahre mit dem Bus.", chinese: "我坐公交车。" },
  { id: 3, english: "I come tomorrow.", german: "Ich komme morgen.", chinese: "我明天来。" },
  { id: 4, english: "I fly to Berlin.", german: "Ich fliege nach Berlin.", chinese: "我飞去柏林。" },
  { id: 5, english: "I run in the park.", german: "Ich laufe im Park.", chinese: "我在公园跑步。" },
  { id: 6, english: "I swim in the lake.", german: "Ich schwimme im See.", chinese: "我在湖里游泳。" },
  { id: 7, english: "I travel to Germany.", german: "Ich reise nach Deutschland.", chinese: "我去德国旅行。" },
  { id: 8, english: "I depart at eight o'clock.", german: "Ich fahre um acht Uhr ab.", chinese: "我八点出发。" },
  { id: 9, english: "I arrive at nine o'clock.", german: "Ich komme um neun Uhr an.", chinese: "我九点到达。" },
  { id: 10, english: "I get off here.", german: "Ich steige hier aus.", chinese: "我在这里下车。" },
  { id: 11, english: "I get on there.", german: "Ich steige dort ein.", chinese: "我在那里上车。" },
  { id: 12, english: "I do my work.", german: "Ich mache meine Arbeit.", chinese: "我做我的工作。" },
  { id: 13, english: "I do a lot today.", german: "Ich tue viel heute.", chinese: "我今天做很多事。" },
  { id: 14, english: "I put the bottle on the table.", german: "Ich stelle die Flasche auf den Tisch.", chinese: "我把瓶子放到桌上（竖放）。" },
  { id: 15, english: "I carry a bag.", german: "Ich trage eine Tasche.", chinese: "我拿着一个包。" },
  { id: 16, english: "I put the book on the table.", german: "Ich lege das Buch auf den Tisch.", chinese: "我把书放在桌上（平放）。" },
  { id: 17, english: "I pull the door.", german: "Ich ziehe die Tür.", chinese: "我拉门。" },
  { id: 18, english: "I hang the picture on the wall.", german: "Ich hänge das Bild an die Wand.", chinese: "我把画挂到墙上。" },
  { id: 19, english: "I hold the ball.", german: "Ich halte den Ball.", chinese: "我拿着球。" },
  { id: 20, english: "I get coffee.", german: "Ich hole Kaffee.", chinese: "我去拿咖啡。" },
  { id: 21, english: "I bring you water.", german: "Ich bringe dir Wasser.", chinese: "我给你带水来。" },
  { id: 22, english: "I open the window.", german: "Ich öffne das Fenster.", chinese: "我打开窗户。" },
  { id: 23, english: "I knock on the door.", german: "Ich schlage an die Tür.", chinese: "我敲门。" },
  { id: 24, english: "I send a message.", german: "Ich schicke eine Nachricht.", chinese: "我发送一条消息。" },
];

// 5级词汇8-交通/其它
const basicPhrases15: BasicPhrase[] = [
  { id: 1, english: "The train is here.", german: "Der Zug ist da.", chinese: "火车到了。" },
  { id: 2, english: "The tram is on time.", german: "Die Straßenbahn ist pünktlich.", chinese: "有轨电车很准时。" },
  { id: 3, english: "The car is new.", german: "Das Auto ist neu.", chinese: "汽车是新的。" },
  { id: 4, english: "This car is big.", german: "Der Wagen ist groß.", chinese: "这辆车很大。" },
  { id: 5, english: "The taxi is coming.", german: "Das Taxi kommt.", chinese: "出租车来了。" },
  { id: 6, english: "The bus is full.", german: "Der Bus ist voll.", chinese: "公交车满了。" },
  { id: 7, english: "The bicycle is fast.", german: "Das Fahrrad ist schnell.", chinese: "自行车很快。" },
  { id: 8, english: "The airplane is flying.", german: "Das Flugzeug fliegt.", chinese: "飞机在飞。" },
  { id: 9, english: "The world is big.", german: "Die Welt ist groß.", chinese: "世界很大。" },
  { id: 10, english: "Abroad is interesting.", german: "Das Ausland ist interessant.", chinese: "国外很有意思。" },
  { id: 11, english: "The hometown is beautiful.", german: "Die Heimat ist schön.", chinese: "家乡很美。" },
  { id: 12, english: "Europe is big.", german: "Europa ist groß.", chinese: "欧洲很大。" },
  { id: 13, english: "The problem is difficult.", german: "Das Problem ist schwer.", chinese: "问题很难。" },
  { id: 14, english: "The matter is important.", german: "Die Sache ist wichtig.", chinese: "事情很重要。" },
  { id: 15, english: "The plan is good.", german: "Der Plan ist gut.", chinese: "计划很好。" },
  { id: 16, english: "Caution is important.", german: "Die Vorsicht ist wichtig.", chinese: "小心谨慎很重要。" },
];

// 5级词汇8-交通/其它短文版
const basicPhrases16: BasicPhrase[] = [
  { id: 1, english: "I have a plan.", german: "Ich habe einen Plan.", chinese: "我有一个计划。" },
  { id: 2, english: "The plan is a trip.", german: "Der Plan ist eine Reise.", chinese: "这个计划是一次旅行。" },
  { id: 3, english: "I travel by train in Europe.", german: "Ich fahre mit dem Zug in Europa.", chinese: "我坐火车去欧洲。" },
  { id: 4, english: "The tram drives in the city.", german: "Die Straßenbahn fährt in der Stadt.", chinese: "有轨电车在城市里行驶。" },
  { id: 5, english: "The bus is also good.", german: "Der Bus ist auch gut.", chinese: "公交车也很好。" },
  { id: 6, english: "Sometimes I take a taxi.", german: "Manchmal nehme ich das Taxi.", chinese: "有时候我坐出租车。" },
  { id: 7, english: "My car stays at home.", german: "Mein Auto bleibt zu Hause.", chinese: "我的汽车留在家里。" },
  { id: 8, english: "The bicycle is fast and practical.", german: "Das Fahrrad ist schnell und praktisch.", chinese: "自行车又快又方便。" },
  { id: 9, english: "The airplane flies abroad.", german: "Das Flugzeug fliegt ins Ausland.", chinese: "飞机飞往国外。" },
  { id: 10, english: "The world is big.", german: "Die Welt ist groß.", chinese: "世界很大。" },
  { id: 11, english: "My hometown is beautiful.", german: "Meine Heimat ist schön.", chinese: "��的家乡很美。" },
  { id: 12, english: "But abroad is also interesting.", german: "Aber das Ausland ist auch interessant.", chinese: "但是国外也很有意思。" },
  { id: 13, english: "One problem is money.", german: "Ein Problem ist das Geld.", chinese: "一个问题是钱。" },
  { id: 14, english: "The matter is not easy.", german: "Die Sache ist nicht leicht.", chinese: "这件事并不容易。" },
  { id: 15, english: "Caution is important.", german: "Vorsicht ist wichtig.", chinese: "小心谨慎很重要。" },
  { id: 16, english: "The car is already waiting.", german: "Der Wagen wartet schon.", chinese: "车辆已经在等着了。" },
];

// 5级词汇15-移动/动作短文版
const basicPhrases17: BasicPhrase[] = [
  { id: 1, english: "I get a box.", german: "Ich hole eine Kiste.", chinese: "我拿一个箱子。" },
  { id: 2, english: "I carry it into the room.", german: "Ich trage sie ins Zimmer.", chinese: "我把它搬进房间。" },
  { id: 3, english: "Then I put the box next to the table.", german: "Dann stelle ich die Kiste neben den Tisch.", chinese: "然后我把箱子放在桌子旁边。" },
  { id: 4, english: "I put a book on it.", german: "Ich lege ein Buch darauf.", chinese: "我放一本书在上面。" },
  { id: 5, english: "I open the window.", german: "Ich öffne das Fenster.", chinese: "我打开窗户。" },
  { id: 6, english: "I hang a picture on the wall.", german: "Ich hänge ein Bild an die Wand.", chinese: "我把一幅画挂在墙上。" },
  { id: 7, english: "My friend brings me a chair.", german: "Mein Freund bringt mir einen Stuhl.", chinese: "我的朋友给我带来一把椅子。" },
  { id: 8, english: "We pull it to the table.", german: "Wir ziehen ihn zum Tisch.", chinese: "我们把它拉到桌子那里。" },
  { id: 9, english: "I hold the lamp.", german: "Ich halte die Lampe.", chinese: "我拿着灯。" },
  { id: 10, english: "He hammers a nail into the wall.", german: "Er schlägt einen Nagel in die Wand.", chinese: "他把一个钉子敲进墙里。" },
  { id: 11, english: "I send a message to my mother.", german: "Ich schicke eine Nachricht an meine Mutter.", chinese: "我给我的妈妈发一条消息。" },
];

// 短语集列表（用于下拉选择）
const phraseSetList = [
  { id: 1, name: "基本フレーズ1" },
  { id: 2, name: "基本フレーズ2" },
  { id: 3, name: "购物用语" },
  { id: 4, name: "IT德语" },
  { id: 5, name: "IT德语(礼貌体)" },
  { id: 6, name: "第1课语法" },
  { id: 7, name: "第1课语法（2）" },
  { id: 8, name: "5级词汇（其它16）人的状态" },
  { id: 9, name: "Maus对话1" },
  { id: 10, name: "5级词汇（其它17）物体的状态" },
  { id: 11, name: "第2课练习1" },
  { id: 12, name: "第2课练习2" },
  { id: 13, name: "5级词汇12" },
  { id: 14, name: "5级词汇15" },
  { id: 15, name: "5级词汇8" },
  { id: 16, name: "5级词汇8短文版" },
  { id: 17, name: "5级词汇15短文版" },
  { id: 19, name: "5级词汇19" },
];

export default function SentencePracticePage() {
  const [mode, setMode] = useState<"learn" | "quiz" | "dialogue" | "phrase">("learn");
  const [category, setCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phraseSet, setPhraseSet] = useState(1);
  const phraseListRef = useRef<HTMLDivElement>(null);

  // 选择当前短语集
  const currentPhrases = phraseSet === 1 ? basicPhrases : phraseSet === 2 ? basicPhrases2 : phraseSet === 3 ? basicPhrases3 : phraseSet === 4 ? basicPhrases4 : phraseSet === 5 ? basicPhrases5 : phraseSet === 6 ? basicPhrases6 : phraseSet === 7 ? basicPhrases7 : phraseSet === 8 ? basicPhrases8 : phraseSet === 9 ? basicPhrases9 : phraseSet === 10 ? basicPhrases10 : phraseSet === 11 ? basicPhrases11 : phraseSet === 12 ? basicPhrases12 : phraseSet === 13 ? basicPhrases13 : phraseSet === 14 ? basicPhrases14 : phraseSet === 15 ? basicPhrases15 : phraseSet === 16 ? basicPhrases16 : phraseSet === 17 ? basicPhrases17 : basicPhrases19;
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
    } else if (lang === "en") {
      voiceName = voiceType === "male" ? "en-US-JennyNeural" : "en-US-AriaNeural";
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
                <h2 className="text-xl font-bold text-gray-800">
                  {phraseSet === 1 ? "基本フレーズ1" : phraseSet === 2 ? "基本フレーズ2" : phraseSet === 3 ? "购物用语" : phraseSet === 4 ? "IT德语" : phraseSet === 5 ? "IT德语(礼貌体)" : phraseSet === 6 ? "第1课语法" : phraseSet === 7 ? "第1课语法（2）" : phraseSet === 8 ? "5级词汇（其它16）人的状态" : phraseSet === 9 ? "Maus对话1" : phraseSet === 10 ? "5级词汇（其它17）物体的状态" : phraseSet === 11 ? "第2课练习1" : phraseSet === 12 ? "第2课练习2" : phraseSet === 13 ? "5级词汇12" : phraseSet === 14 ? "5级词汇15" : phraseSet === 15 ? "5级词汇8-交通/其它" : phraseSet === 16 ? "5级词汇8短文版" : phraseSet === 17 ? "5级词汇15短文版" : "5级词汇19-场所/空间/时"}
                </h2>
                <div className="text-sm text-gray-400">
                  {currentIndex + 1} / {currentPhrases.length}
                </div>
              </div>

              {/* 切换短语集 */}
              <div className="flex justify-center mb-4">
                <select
                  value={phraseSet}
                  onChange={(e) => { setPhraseSet(Number(e.target.value)); setCurrentIndex(0); }}
                  className="px-4 py-2 rounded-full text-sm bg-amber-500 text-white border-none cursor-pointer"
                >
                  {phraseSetList.map((item) => (
                    <option key={item.id} value={item.id} className="bg-white text-gray-800">
                      {item.name}
                    </option>
                  ))}
                </select>
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
                      // 先读德语男声
                      await speak(currentPhrases[i].german, "male");
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      // 读德语女声
                      await speak(currentPhrases[i].german, "female");
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      // 读英文
                      await speak(currentPhrases[i].english, "female", "en");
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      // 读中文
                      await speak(currentPhrases[i].chinese, "female", "zh");
                      await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    setIsPlaying(false);
                  }}
                  disabled={isPlaying}
                  className="px-6 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50"
                >
                  {isPlaying ? "🔊 朗读中..." : "🔊 朗读全部(德英中)"}
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
                        onClick={() => speak(phrase.english, "female", "en")}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
                      >
                        🔊 英文
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
