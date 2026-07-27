const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

bot.start((ctx) => {
    ctx.reply('سلام! لینک اینستاگرام یا یوتیوب رو بفرست تا ویدیوش رو برات دانلود کنم.');
});

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : userId;

    // ارسال نوتیفیکیشن برای شما
    if (userMessage.includes('http')) {
        try {
            await bot.telegram.sendMessage(ADMIN_ID, `🔔 پیام جدید!\nکاربر: ${username}\nلینک:\n${userMessage}`);
        } catch (err) {}
    }

    // پشتیبانی همزمان از اینستاگرام و یوتیوب!
    if (userMessage.includes('instagram.com') || userMessage.includes('youtube.com') || userMessage.includes('youtu.be')) {
        const loadingMsg = await ctx.reply('⏳ در حال دانلود ویدیو...');

        try {
            // ترفند مهم: بریدن کدهای مزاحمِ آخر لینک‌های اینستاگرام (?igsh=)
            let targetUrl = userMessage;
            if (userMessage.includes('instagram.com')) {
                targetUrl = userMessage.split('?')[0]; 
            }

            let videoUrl = null;

            // تلاش اول: سرور قدرتمند کبالت (برای اینستا و یوتیوب)
            try {
                const cobaltRes = await axios.post('https://api.cobalt.tools/api/json', {
                    url: targetUrl
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (cobaltRes.data && cobaltRes.data.url) {
                    videoUrl = cobaltRes.data.url;
                }
            } catch (e1) {
                console.log("کبالت ارور داد:", e1.message);
            }

            // تلاش دوم: اگر اولی شلوغ بود (فقط برای اینستاگرام)
            if (!videoUrl && userMessage.includes('instagram.com')) {
                try {
                    const fallbackRes = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(targetUrl)}`);
                    if (fallbackRes.data && fallbackRes.data.data && fallbackRes.data.data.length > 0) {
                        videoUrl = fallbackRes.data.data[0].url;
                    }
                } catch (e2) {
                    console.log("سرور کمکی ارور داد.");
                }
            }

            // اگر بالاخره لینک استخراج شد
            if (videoUrl) {
                try {
                    await ctx.replyWithVideo(videoUrl);
                } catch (vidErr) {
                    await ctx.reply(`⚠️ تلگرام نتوانست این ویدیو را مستقیم پخش کند.\n\n📥 **لینک دانلود مستقیم:**\n${videoUrl}`);
                }
                await ctx.deleteMessage(loadingMsg.message_id); 
            } else {
                throw new Error("ویدیو پیدا نشد");
            }

        } catch (error) {
            await ctx.deleteMessage(loadingMsg.message_id);
            ctx.reply('❌ متاسفانه دانلود این ویدیو با خطا مواجه شد. (احتمالاً اینستاگرام جلوی ربات‌ها را برای این ویدیو بسته است).');
        }
    } 
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body, res);
    } else {
        res.status(200).send('Bot is Working perfectly!');
    }
};
