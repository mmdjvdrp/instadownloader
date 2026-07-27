const { Telegraf } = require('telegraf');
const axios = require('axios');

// اینجا دیگه اصلاً کاری به RAPIDAPI_KEY نداریم
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

bot.start((ctx) => {
    ctx.reply('سلام! لینک اینستاگرام رو بفرست تا ویدیوش رو با سرعت بالا برات دانلود کنم.');
});

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : userId;

    // ارسال نوتیفیکیشن برای ادمین
    if (userMessage.includes('http')) {
        try {
            await bot.telegram.sendMessage(ADMIN_ID, `🔔 پیام جدید!\nکاربر: ${username}\nلینک:\n${userMessage}`);
        } catch (err) {}
    }

    // دانلود از اینستاگرام بدون نیاز به کلید
    if (userMessage.includes('instagram.com')) {
        const loadingMsg = await ctx.reply('⏳ در حال دانلود ویدیو... لطفاً کمی صبر کنید.');

        try {
            let videoUrl = null;
            const encodedUrl = encodeURIComponent(userMessage);

            // تلاش اول: استفاده از سرور قدرتمند اول
            try {
                const res1 = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodedUrl}`);
                if (res1.data && res1.data.data && res1.data.data.length > 0) {
                    videoUrl = res1.data.data[0].url;
                }
            } catch (e1) {
                console.log("سرور اول قطع بود.");
            }

            // تلاش دوم: اگر سرور اول جواب نداد، سریع میره سراغ سرور دوم
            if (!videoUrl) {
                try {
                    const res2 = await axios.get(`https://api.siputzx.my.id/api/d/igdl?url=${encodedUrl}`);
                    if (res2.data && res2.data.data && res2.data.data.length > 0) {
                        videoUrl = res2.data.data[0].url;
                    }
                } catch (e2) {
                    console.log("سرور دوم هم قطع بود.");
                }
            }

            // اگر بالاخره لینک ویدیو پیدا شد
            if (videoUrl) {
                try {
                    // ارسال مستقیم ویدیو تو تلگرام
                    await ctx.replyWithVideo(videoUrl);
                } catch (vidErr) {
                    // اگر تلگرام به خاطر حجم یا فرمت نتونست ویدیو رو لود کنه
                    await ctx.reply(`⚠️ تلگرام نتوانست این ویدیو را مستقیم پخش کند.\n\n📥 **لینک دانلود مستقیم:**\n${videoUrl}`);
                }
                await ctx.deleteMessage(loadingMsg.message_id); 
            } else {
                throw new Error("ویدیو پیدا نشد");
            }

        } catch (error) {
            await ctx.deleteMessage(loadingMsg.message_id);
            ctx.reply('❌ متاسفانه دانلود این ویدیو با خطا مواجه شد. (ممکن است پیج پرایوت باشد).');
        }
    } 
    else if (userMessage.includes('youtube.com') || userMessage.includes('youtu.be')) {
        ctx.reply('نوتیفیکیشن یوتیوب برای ادمین ارسال شد!');
    }
});

// اجرای ربات روی Vercel
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body, res);
    } else {
        res.status(200).send('Bot is working perfectly without RapidAPI!');
    }
};
