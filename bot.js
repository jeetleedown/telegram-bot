require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/startgame/, async (msg) => {
  const chatId = msg.chat.id;
  const room_code = Math.random().toString(36).substr(2, 6).toUpperCase();

  const keyboard = {
    inline_keyboard: [
      [{ text: "✅ 加入游戏", callback_data: `join_${room_code}` }]
    ]
  };

  bot.sendMessage(chatId, `🎲 德州扑克房间创建成功：${room_code}`, {
    reply_markup: keyboard
  });
});

bot.on("callback_query", async (query) => {
  const data = query.data;
  if (data.startsWith("join_")) {
    const room_code = data.split("_")[1];
    bot.answerCallbackQuery(query.id, {
      text: `你已加入房间 ${room_code}`
    });
  }
});
