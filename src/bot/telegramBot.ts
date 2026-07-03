import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:8000';

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new Telegraf(token);

bot.start((ctx) => {
  ctx.reply(
    'Welcome to Ethio Bingo! 🥳\nReal-time multiplayer Bingo right in Telegram.',
    Markup.inlineKeyboard([
      [Markup.button.webApp('Play Bingo!', `${publicBaseUrl}`) ],
      [Markup.button.url('Join Channel', 'https://t.me/example')]
    ])
  );
});

bot.command('help', (ctx) => {
  ctx.reply('Commands:\n/start - Start the bot\n/play - Play the game\n/help - Show this help');
});

bot.command('play', (ctx) => {
    ctx.reply(
        'Ready to play? Click the button below to open the Bingo Mini App.',
        Markup.inlineKeyboard([
            Markup.button.webApp('Open Mini App', publicBaseUrl)
        ])
    );
});

bot.launch().then(() => {
  console.log('Telegram Bot is running');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
