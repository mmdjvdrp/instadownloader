const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; // برگشتیم به کلید قدرتمند خودمون

// 🧠 موتور جستجوی هوشمند: پیدا کردن لینک ویدیو از بین کدهای شلوغِ اینستاگرام
function findVideoUrl(obj) {
    let foundUrl = null;
    function search(item) {
        if (foundUrl) return; 
        if (item !== null && typeof item === 'object') {
            // اگر کلمه video_url پیدا شد
            if (item.video_url && typeof item.video_url === 'string') {
                foundUrl = item.video_url;
                return;
            }
            // اگر آرایه video_versions پیدا شد (نسخه باکیفیت)
            if (item.video_versions && Array.isArray(item.video_versions) && item.video_versions.length > 0) {
                if (item.video_versions[0].url) {
                    foundUrl = item.video_versions[0].url;
                    return;
                }
            }
            // ادامه جستجو در لایه‌های عمیق‌تر
            if (Array.isArray(item)) {
                for (let i = 0; i < item.length; i++) search(item[i]);
            } else {
                for (let key in item) search(item[key]);
            }
        }
    }
    search(obj);
    return foundUrl;
}

bot.start((ctx) => {
    ctx.reply('سلام! لینک اینستاگرام رو بفرست تا با موتور هوشمند استخراجش کنم.');
});

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : userId;

    if (userMessage.includes('http')) {
        try {
            await bot.telegram.sendMessage(ADMIN_ID, `🔔 پیام جدید!\nکاربر: ${username}\nلینک:\n${userMessage}`);
        } catch (err) {}
    }

    if (userMessage.includes('instagram.com')) {
        const loadingMsg = await ctx.reply('⏳ در حال نفوذ به سرور و استخراج ویدیو...');

        try {
            // پاکسازی لینک از کدهای مزاحم
            const cleanUrl = userMessage.split('?')[0]; 

            // درخواست به RapidAPI که قدرت دور زدن بلاک را دارد
            const options = {
                method: 'GET',
                url: 'https://instagram-reels-downloader-api.p.rapidapi.com/download',
                params: { url: cleanUrl },
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com',
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.request(options);
            
            // 🔍 سپردنِ خروجیِ شلوغِ API به دست موتور جستجوی هوشمند
            const videoUrl = findVideoUrl(response.data);

            if (videoUrl) {
                try {
                    // ارسال ویدیو به کاربر
                    await ctx.replyWithVideo(videoUrl);
                } catch (vidErr) {
                    // اگر حجم زیاد بود یا تلگرام گیر داد
                    await ctx.reply(`⚠️ تلگرام نتوانست این ویدیو را مستقیم پخش کند.\n\n📥 **لینک دانلود مستقیم:**\n${videoUrl}`);
                }
                await ctx.deleteMessage(loadingMsg.message_id); 
            } else {
                throw new Error("ویدیو داخل کدهای اینستاگرام پیدا نشد.");
            }

        } catch (error) {
            await ctx.deleteMessage(loadingMsg.message_id);
            ctx.reply(`❌ خطا در دانلود ویدیو.\nدلیل ارور: ${error.message}`);
        }
    } 
});

// اجرای بدون مشکل در Vercel
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body, res);
    } else {
        res.status(200).send('Bot is working with Smart JSON Scanner!');
    }
};
