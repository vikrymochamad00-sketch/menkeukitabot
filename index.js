require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// Ambil dari .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const SHEET_WEBHOOK_URL = process.env.SHEET_WEBHOOK_URL;

if (!BOT_TOKEN || !SHEET_WEBHOOK_URL) {
  console.error("❌ BOT_TOKEN atau SHEET_WEBHOOK_URL belum diisi di .env");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  const regex = /^(\+|\-)\s?(\d+)\s?(.*)$/;

  if (!regex.test(text)) {
    return bot.sendMessage(
      chatId,
      "Format salah.\n\nContoh:\n+ 50000 jualan\n- 20000 makan"
    );
  }

  const [, sign, amount, notes] = text.match(regex);

  const type = sign === "+" ? "Income" : "Expense";

  try {
    await axios.post(SHEET_WEBHOOK_URL, {
      type,
      amount,
      notes: notes || "-",
    });

    bot.sendMessage(
      chatId,
      `✔ Data tersimpan!\n\nType: ${type}\nAmount: ${amount}\nNotes: ${notes}`
    );
  } catch (err) {
    bot.sendMessage(chatId, "❌ Error menyimpan ke Google Sheets.");
  }
});

console.log("Bot is running...");
