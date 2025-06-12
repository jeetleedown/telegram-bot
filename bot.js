require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// 设置 webhook 地址
bot.setWebHook(`${process.env.BASE_URL}/bot${process.env.BOT_TOKEN}`);

// 处理 Telegram 发来的请求
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 处理 /startgame 指令
bot.onText(/\/startgame/, async (msg) => {
  const chatId = msg.chat.id;
  const room_code = Math.random().toString(36).substr(2, 6).toUpperCase();

  const keyboard = {
    inline_keyboard: [
      [{ text: "✅ 我要加入游戏", callback_data: `join_${room_code}` }]
    ]
  };

  bot.sendMessage(chatId, `🎲 德州扑克房间创建成功：${room_code}`, {
    reply_markup: keyboard
  });
});

// 玩家点击按钮加入房间
bot.on('callback_query', async (query) => {
  const data = query.data;
  const from = query.from;

  if (data.startsWith("join_")) {
    const room_code = data.split("_")[1];
    const telegram_id = from.id;
    const username = from.username || from.first_name || `user_${telegram_id}`;

    try {
      const res = await axios.post(`${process.env.BACKEND_URL}/rooms/join`, {
        room_code,
        telegram_id,
        username,
      });

      const players = res.data.players || [];

      await bot.answerCallbackQuery(query.id, {
        text: `✅ 已加入房间 ${room_code}，当前人数 ${players.length}/9`,
        show_alert: false,
      });

      await bot.sendMessage(query.message.chat.id, `👤 ${username} 加入了房间 ${room_code}，共 ${players.length} 人`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "服务器错误";
      await bot.answerCallbackQuery(query.id, {
        text: `❌ 加入失败：${errorMsg}`,
        show_alert: true,
      });
    }
  }
});

app.listen(port, () => {
  console.log(`✅ Webhook server running at port ${port}`);
});


