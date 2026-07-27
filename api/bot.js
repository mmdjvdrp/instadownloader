const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

bot.start((ctx) => {
    ctx.reply('سلام! لینک اینستاگرام رو بفرست تا تست کنیم ببینیم API چی جواب میده.');
});

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;

    // ارسال نوتیفیکیشن به ادمین
    if (userMessage.includes('http')) {
        try {
            await bot.telegram.sendMessage(ADMIN_ID, `🔔 لینک جدید دریافت شد:\n${userMessage}`);
        } catch (err) {}
    }

    // پردازش اینستاگرام
    if (userMessage.includes('instagram.com')) {
        const loadingMsg = await ctx.reply('⏳ در حال درخواست از API...');

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
            
            // اینجا هرچی API جواب داده رو به متن تبدیل میکنیم
            const apiResult = JSON.stringify(response.data, null, 2);
            
            // جواب واقعی API رو برات تو تلگرام میفرسته تا ببینی!
            await ctx.reply(`پاسخ واقعی API به ما این بود:\n\n${apiResult.substring(0, 3000)}`);
            await ctx.deleteMessage(loadingMsg.message_id);

        } catch (error) {
            await ctx.deleteMessage(loadingMsg.message_id);
            // اگر اصلا API جواب نده این ارور رو میده
            ctx.reply(`❌ کلا API قطع شده و این ارور رو داد:\n${error.message}`);
        }
    } 
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body, res);
    } else {
        res.status(200).send('working');
    }
};
