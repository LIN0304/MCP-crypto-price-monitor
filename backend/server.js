// server.js - Express server with Telegram notifications
const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const { startTransactionMonitoring } = require('./transactions');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// CoinMarketCap API configuration
const CMC_API_KEY = process.env.CMC_API_KEY;
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Telegram Bot configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Store active chat IDs and their monitoring preferences
const activeMonitors = new Map();
// Make activeMonitors globally available for other modules
global.activeMonitors = activeMonitors;

// Initialize transaction monitoring
const transactionMonitor = startTransactionMonitoring(bot);

// Welcome message when user starts the bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId, 
    'Welcome to Crypto Price Monitor Bot! 🚀\n\n' +
    'This bot monitors the price relationship between Carrot and Puffer tokens ' +
    'and can alert you about significant transactions.\n\n' +
    'Commands:\n' +
    '/monitor - Start price monitoring\n' +
    '/transactions - Toggle transaction alerts\n' +
    '/recent - Show recent Carrot transactions\n' +
    '/stop - Stop all monitoring\n' +
    '/status - Check monitoring status\n' +
    '/help - Show available commands'
  );
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Available commands:\n\n' +
    '/monitor - Start monitoring Carrot/Puffer prices\n' +
    '/transactions - Toggle transaction alerts\n' +
    '/recent - Show recent Carrot transactions\n' +
    '/stop - Stop all monitoring\n' +
    '/status - Check current monitoring status\n' +
    '/check - Check prices now\n' +
    '/help - Show this help message'
  );
});

// Start monitoring command
bot.onText(/\/monitor/, (msg) => {
  const chatId = msg.chat.id;
  
  // Add user to active monitors with default settings
  const monitorState = activeMonitors.get(chatId) || {
    active: false,
    interval: 5, // minutes
    lastChecked: null,
    transactionAlerts: false
  };
  
  monitorState.active = true;
  activeMonitors.set(chatId, monitorState);
  
  bot.sendMessage(
    chatId,
    '✅ Price monitoring activated!\n\n' +
    'I will notify you when Carrot price falls below 55% of Puffer price.\n' +
    'Checks will occur every 5 minutes.\n\n' +
    'Transaction alerts are currently ' + 
    (monitorState.transactionAlerts ? 'ON' : 'OFF') + 
    '. Use /transactions to toggle.\n\n' +
    'Use /stop to deactivate monitoring.'
  );
  
  // Perform initial check
  checkPricesForUser(chatId);
});

// Toggle transaction monitoring
bot.onText(/\/transactions/, (msg) => {
  const chatId = msg.chat.id;
  
  // Get or create monitor state
  const monitorState = activeMonitors.get(chatId) || {
    active: false,
    interval: 5,
    lastChecked: null,
    transactionAlerts: false
  };
  
  // Toggle transaction alerts
  monitorState.transactionAlerts = !monitorState.transactionAlerts;
  activeMonitors.set(chatId, monitorState);
  
  bot.sendMessage(
    chatId,
    `Transaction alerts are now ${monitorState.transactionAlerts ? 'ON ✅' : 'OFF ❌'}\n\n` +
    (monitorState.transactionAlerts 
      ? 'You will receive notifications when significant Carrot token transactions occur.' 
      : 'You will no longer receive transaction notifications.')
  );
});

// Recent transactions command
bot.onText(/\/recent/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Get recent transactions
  const recentTransactions = transactionMonitor.getRecentTransactions();
  
  if (recentTransactions.length === 0) {
    bot.sendMessage(chatId, 'No transactions have been detected yet. Please try again later.');
    return;
  }
  
  // Display the 5 most recent transactions
  let message = '📊 Recent Carrot Transactions:\n\n';
  
  const transactions = recentTransactions.slice(0, 5);
  
  transactions.forEach((tx, index) => {
    const emoji = 
      tx.type === 'Buy' ? '🟢' : 
      tx.type === 'Sell' ? '🔴' : 
      tx.type === 'Mint' ? '✨' : 
      tx.type === 'Burn' ? '🔥' : '🔄';
    
    message += `${index + 1}. ${emoji} ${tx.type}: ${tx.amount.toFixed(2)} CARROT`;
    
    if (tx.usdValue) {
      message += ` ($${tx.usdValue.toFixed(2)})`;
    }
    
    message += `\n`;
  });
  
  message += `\nUse /transactions to toggle alerts for significant trades.`;
  
  bot.sendMessage(chatId, message);
});

// Stop monitoring command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  
  if (activeMonitors.has(chatId)) {
    const monitor = activeMonitors.get(chatId);
    monitor.active = false;
    activeMonitors.set(chatId, monitor);
    
    bot.sendMessage(
      chatId,
      '🛑 Price monitoring stopped.\n\n' +
      'Use /monitor to activate it again.'
    );
  } else {
    bot.sendMessage(
      chatId,
      '⚠️ You are not currently monitoring prices.\n\n' +
      'Use /monitor to start.'
    );
  }
});

// Check status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (activeMonitors.has(chatId)) {
    const monitor = activeMonitors.get(chatId);
    const status = monitor.active ? 'Active' : 'Inactive';
    const lastChecked = monitor.lastChecked ? new Date(monitor.lastChecked).toLocaleString() : 'Never';
    const txAlerts = monitor.transactionAlerts ? 'Enabled' : 'Disabled';
    
    bot.sendMessage(
      chatId,
      `📊 Monitoring Status: ${status}\n` +
      `⏱️ Check Interval: ${monitor.interval} minutes\n` +
      `🕒 Last Checked: ${lastChecked}\n` +
      `💸 Transaction Alerts: ${txAlerts}\n\n` +
      'Use /check to check prices now.\n' +
      'Use /recent to see recent transactions.'
    );
  } else {
    bot.sendMessage(
      chatId,
      '⚠️ You are not currently monitoring prices.\n\n' +
      'Use /monitor to start.'
    );
  }
});

// Check prices now command
bot.onText(/\/check/, (msg) => {
  const chatId = msg.chat.id;
  checkPricesForUser(chatId);
});

// Function to check prices for a specific user
async function checkPricesForUser(chatId) {
  try {
    bot.sendMessage(chatId, '🔍 Checking prices...');
    
    // Fetch data for both tokens in a single request
    const response = await axios.get(CMC_API_URL, {
      params: {
        symbol: 'CARROT,PUFFER',
      },
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
      },
    });
    
    const data = response.data.data;
    const carrotPrice = data.CARROT.quote.USD.price;
    const pufferPrice = data.PUFFER.quote.USD.price;
    const thresholdPrice = pufferPrice * 0.55;
    
    // Update last checked time
    if (activeMonitors.has(chatId)) {
      const monitor = activeMonitors.get(chatId);
      monitor.lastChecked = new Date();
      activeMonitors.set(chatId, monitor);
    }
    
    // Send current prices
    let message = `📊 Current Prices:\n\n` +
                  `Puffer: $${pufferPrice.toFixed(6)}\n` +
                  `Carrot: $${carrotPrice.toFixed(6)}\n` +
                  `Threshold (55% of Puffer): $${thresholdPrice.toFixed(6)}\n\n`;
    
    // Check if Carrot price is below threshold
    if (carrotPrice < thresholdPrice) {
      const discountAmount = thresholdPrice - carrotPrice;
      const discountPercentage = (discountAmount / thresholdPrice) * 100;
      
      message += `🚨 ALERT! Carrot is below threshold!\n` +
                `Discount: ${discountPercentage.toFixed(2)}% below threshold\n\n` +
                `This might be a good buying opportunity.`;
    } else {
      message += `✅ Carrot price is above the threshold.`;
    }
    
    bot.sendMessage(chatId, message);
    
    return {
      carrotPrice,
      pufferPrice,
      thresholdPrice,
      isBelow: carrotPrice < thresholdPrice
    };
  } catch (error) {
    console.error('Error checking prices:', error);
    bot.sendMessage(chatId, '❌ Error fetching cryptocurrency data. Please try again later.');
    
    return null;
  }
}

// Scheduled task to periodically check prices for all active monitors
function runScheduledChecks() {
  for (const [chatId, monitor] of activeMonitors.entries()) {
    if (monitor.active) {
      const now = new Date();
      const lastChecked = monitor.lastChecked ? new Date(monitor.lastChecked) : null;
      
      // Check if it's time to check prices again
      if (!lastChecked || (now - lastChecked) >= (monitor.interval * 60 * 1000)) {
        checkPricesForUser(chatId);
      }
    }
  }
}

// Run the scheduled checks every minute
setInterval(runScheduledChecks, 60 * 1000);

// API endpoint for external systems to trigger notifications
app.post('/api/notify', async (req, res) => {
  const { chatId } = req.body;
  
  if (!chatId) {
    return res.status(400).json({ error: 'Chat ID is required' });
  }
  
  try {
    const result = await checkPricesForUser(chatId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error in notify endpoint:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// API endpoint to fetch current prices
app.get('/api/crypto-prices', async (req, res) => {
  try {
    // Fetch data for both tokens in a single request
    const response = await axios.get(CMC_API_URL, {
      params: {
        symbol: 'CARROT,PUFFER',
      },
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching crypto prices:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch cryptocurrency data' });
  }
});

// API endpoint to fetch recent transactions
app.get('/api/recent-transactions', (req, res) => {
  try {
    const transactions = transactionMonitor.getRecentTransactions();
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transaction data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Telegram bot started. Ready to receive commands.');
  console.log('Transaction monitoring initialized.');
});