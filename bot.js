require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on("callback_query", async (query) => {
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

      // 回复点击者
      await bot.answerCallbackQuery(query.id, {
        text: `✅ 你已成功加入房间 ${room_code}，当前玩家人数：${players.length}/9`,
        show_alert: false,
      });

      // 可选：通知群里新玩家加入
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

