require("dotenv").config();

console.log("BOT_TOKEN:", process.env.BOT_TOKEN);
console.log("SHEET_WEBHOOK_URL:", process.env.SHEET_WEBHOOK_URL);

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const SHEET_WEBHOOK_URL = process.env.SHEET_WEBHOOK_URL;

if (!BOT_TOKEN || !SHEET_WEBHOOK_URL) {
  console.error("❌ BOT_TOKEN atau SHEET_WEBHOOK_URL belum diisi di .env");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });


// =====================================================
//  COMMAND: /reset
// =====================================================
bot.onText(/\/reset/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await axios.post(SHEET_WEBHOOK_URL, { command: "reset" });

    bot.sendMessage(chatId, "🔄 Semua data berhasil di-*reset*! 🎉", {
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Gagal melakukan reset data.");
  }
});

// =====================================================
//  COMMAND: /newmonth
// =====================================================
bot.onText(/\/newmonth/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await axios.post(SHEET_WEBHOOK_URL, { command: "newmonth" });

    bot.sendMessage(chatId, "🗓️ Bulan baru berhasil dibuat! Data lama sudah di-*arsipkan*.", {
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Gagal membuat bulan baru.");
  }
});


// =====================================================
//  INPUT NORMAL: + 50000 notes / - 20000 notes
// =====================================================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Jangan proses jika itu adalah command /reset atau /newmonth
  if (text.startsWith("/")) return;

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
