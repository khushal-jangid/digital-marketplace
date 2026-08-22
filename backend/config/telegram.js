const getBotToken = () => process.env.TELEGRAM_BOT_TOKEN;
const getChatId = () => process.env.TELEGRAM_CHAT_ID;

/**
 * Send message to Telegram Chat/Group
 * @param {string} text - Message body
 * @param {object} replyMarkup - Telegram inline keyboard or other reply markup
 * @param {string|number} overrideChatId - Optional specific chat ID
 */
export const sendTelegramMessage = async (text, replyMarkup = null, overrideChatId = null) => {
  const token = getBotToken();
  const chatId = overrideChatId || getChatId();

  if (!token || !chatId) {
    console.log('Telegram Bot Token or Chat ID not configured. Notification text:\n', text);
    return null;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API Error:', data.description);
    }
    return data;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    return null;
  }
};

/**
 * Answer Telegram callback query (shows a toast or alert to user on Telegram)
 * @param {string} callbackQueryId
 * @param {string} text
 */
export const answerCallbackQuery = async (callbackQueryId, text) => {
  const token = getBotToken();
  if (!token || !callbackQueryId) return;
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (err) {
    console.error('Error answering callback query:', err.message);
  }
};

/**
 * Edit Telegram message text and keyboard (to update button status)
 * @param {number|string} messageId
 * @param {string} text
 * @param {object} replyMarkup
 */
export const editTelegramMessage = async (messageId, text, replyMarkup = null) => {
  const token = getBotToken();
  const chatId = getChatId();
  if (!token || !chatId || !messageId) return;
  const url = `https://api.telegram.org/bot${token}/editMessageText`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
  } catch (err) {
    console.error('Error editing Telegram message:', err.message);
  }
};

/**
 * Start Telegram Long-Polling for instant button clicks without webhooks
 * @param {Function} handleCallbackQuery - Async handler for button actions
 */
let isPollingActive = false;
let lastOffset = 0;

export const startTelegramPolling = async (handleCallbackQuery) => {
  const token = getBotToken();
  if (!token) {
    console.log('Telegram Bot Polling skipped: TELEGRAM_BOT_TOKEN is not defined in .env');
    return;
  }

  if (isPollingActive) return;
  isPollingActive = true;

  console.log('🤖 Telegram Bot polling started. Ready for Instant Approve/Reject actions!');

  const pollLoop = async () => {
    if (!isPollingActive) return;
    try {
      const currentToken = getBotToken();
      if (!currentToken) return;

      const res = await fetch(`https://api.telegram.org/bot${currentToken}/getUpdates?offset=${lastOffset + 1}&timeout=25`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastOffset = update.update_id;

          // If user sends /start or any greeting message, register chat ID & greet
          if (update.message && update.message.chat) {
            const incomingChatId = update.message.chat.id;
            console.log(`Telegram Bot received message from Chat ID: ${incomingChatId} (@${update.message.from?.username || ''})`);
            
            // Auto update env chat ID if empty
            if (!process.env.TELEGRAM_CHAT_ID) {
              process.env.TELEGRAM_CHAT_ID = String(incomingChatId);
            }

            await sendTelegramMessage(
              `🎉 <b>ApexMarket Order Approvals Connected!</b>\n\nHello <b>${update.message.from?.first_name || 'Admin'}</b>! Your bot is live.\nWhenever any customer places an order on your website, you will receive an alert with <b>Approve</b> & <b>Reject</b> buttons right here!`,
              null,
              incomingChatId
            );
          }

          // If user clicked Approve or Reject inline button
          if (update.callback_query && handleCallbackQuery) {
            await handleCallbackQuery(update.callback_query);
          }
        }
      }
    } catch (error) {
      // Ignore network timeouts in polling loop
    }

    if (isPollingActive) {
      setTimeout(pollLoop, 1000);
    }
  };

  pollLoop();
};
