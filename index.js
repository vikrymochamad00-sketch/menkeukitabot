require("dotenv").config();
require("dotenv").config();
console.log("BOT_TOKEN:", process.env.BOT_TOKEN);
console.log("SHEET_WEBHOOK_URL:", process.env.SHEET_WEBHOOK_URL);

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const SHEET_WEBHOOK_URL = process.env.SHEET_WEBHOOK_URL;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Format: "+ 50000 notes" atau "- 20000 notes"
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
    const response = await axios.post(SHEET_WEBHOOK_URL, {
      type,
      amount,
      notes: notes || "-",
    });

    const { income, expense, saldo } = response.data;

    bot.sendMessage(
      chatId,
      `✔ Data tersimpan!\n\n` +
      `Type: ${type}\nAmount: ${Number(amount).toLocaleString()}\nNotes: ${notes}\n\n` +
      `📊 *Ringkasan Keuangan*\n` +
      `• Total Income: *Rp ${income.toLocaleString()}*\n` +
      `• Total Expense: *Rp ${expense.toLocaleString()}*\n` +
      `• 💰 Saldo: *Rp ${saldo.toLocaleString()}*`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Error menyimpan ke Google Sheets.");
  }
});

console.log("Bot is running...");


