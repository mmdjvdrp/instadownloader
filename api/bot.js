const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

bot.start((ctx) => {
    ctx.reply('سلام! لینک اینستاگرام رو بفرست تا ویدیوش رو برات دانلود کنم.');
});

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : userId;

    if (userMessage.includes('http')) {
        try {
            await bot.telegram.sendMessage(ADMIN_ID, `🔔 پیام جدید!\nکاربر: ${username}\nلینک ارسالی:\n${userMessage}\n\nلطفا چک کن.`);
        } catch (err) {}
    }

    if (userMessage.includes('instagram.com')) {
        const loadingMsg = await ctx.reply('⏳ در حال دریافت ویدیو...');
        try {
            const options = {
                method: 'GET',
                url: 'https://instagram-reels-downloader-api.p.rapidapi.com/download',
                params: { url: userMessage },
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com',
                    'Content-Type': 'application/json'
                }
            };
            const response = await axios.request(options);
            const videoUrl = response.data.video_url || response.data.url || response.data.data;

            if (videoUrl) {
                await ctx.replyWithVideo(videoUrl);
                await ctx.deleteMessage(loadingMsg.message_id); 
            } else {
                throw new Error("لینک پیدا نشد");
            }
        } catch (error) {
            await ctx.deleteMessage(loadingMsg.message_id);
            ctx.reply('❌ خطا در دانلود ویدیو.');
        }
    } else if (userMessage.includes('youtube.com') || userMessage.includes('youtu.be')) {
        ctx.reply('یوتیوب هنوز فعال نیست، اما به ادمین اطلاع داده شد!');
    }
});

module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body, res);
        } else {
            res.status(200).send('Bot is working!');
        }
    } catch (e) {
        res.status(500).send('Error');
    }
};
