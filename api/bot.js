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

    // 1. ارسال نوتیفیکیشن به ادمین (شما)
    if (userMessage.includes('http')) {
        try {
            await bot.telegram.sendMessage(ADMIN_ID, `🔔 پیام جدید!\nکاربر: ${username}\nلینک ارسالی:\n${userMessage}\n\nلطفا چک کن.`);
        } catch (err) {
            console.error("خطا در ارسال پیام به ادمین:", err);
        }
    }

    // 2. دانلود از اینستاگرام
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
            
            // چاپ کردن جواب API در سرور برای عیب یابی
            console.log("API Response:", JSON.stringify(response.data)); 
            
            // پیدا کردن لینک ویدیو با دقت بالا
            let videoUrl = null;
            if (response.data.video_url) {
                videoUrl = response.data.video_url;
            } else if (response.data.url) {
                videoUrl = response.data.url;
            } else if (response.data.data && typeof response.data.data === 'string') {
                videoUrl = response.data.data;
            } else if (response.data.data && response.data.data[0]) {
                videoUrl = response.data.data[0].video_url || response.data.data[0].url;
            }

            if (videoUrl) {
                try {
                    // اول تلاش میکنه ویدیو رو مستقیم و قابل پخش بفرسته
                    await ctx.replyWithVideo(videoUrl);
                } catch (vidErr) {
                    console.error("تلگرام نتوانست ویدیو را لود کند:", vidErr.message);
                    // اگر ویدیو باگ داشت یا تلگرام قبول نکرد، لینک مستقیم و سالم رو میفرسته
                    await ctx.reply(`⚠️ تلگرام نتوانست این ویدیو را مستقیم پخش کند.\n\n📥 **لینک دانلود مستقیم شما:**\n${videoUrl}`);
                }
                // پاک کردن پیام "در حال دریافت..."
                await ctx.deleteMessage(loadingMsg.message_id); 
            } else {
                throw new Error("لینک ویدیو پیدا نشد.");
            }

        } catch (error) {
            console.error("Error details:", error.message);
            await ctx.deleteMessage(loadingMsg.message_id);
            ctx.reply('❌ متاسفانه دانلود این ویدیو با خطا مواجه شد. ممکن است پیج پرایوت باشد.');
        }
    } 
    // 3. بخش یوتیوب
    else if (userMessage.includes('youtube.com') || userMessage.includes('youtu.be')) {
        ctx.reply('یوتیوب هنوز فعال نیست، اما به ادمین اطلاع داده شد!');
    }
});

// تنظیمات Vercel برای اجرای ربات
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body, res);
        } else {
            res.status(200).send('Bot is working perfectly!');
        }
    } catch (e) {
        console.error("Webhook Error:", e);
        res.status(500).send('Error');
    }
};
