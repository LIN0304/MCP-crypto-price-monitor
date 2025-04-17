// transactions.js - Monitor Carrot token transactions
const ethers = require('ethers');
const axios = require('axios');
require('dotenv').config();

// Store recent transactions
const recentTransactions = [];
const TRANSACTION_LIMIT = 50; // Maximum number of transactions to store

// Carrot token contract address (on Ethereum)
const CARROT_TOKEN_ADDRESS = '0x282a69142bac47855c3fbe1693fcc4ba3b4d5ed6';

// Minimum transaction size to report (in tokens)
const MIN_TRANSACTION_SIZE = process.env.MIN_TRANSACTION_SIZE || 1000;

// ERC20 ABI (minimal ABI for Transfer event)
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Initialize provider
let provider;
if (process.env.ETHEREUM_RPC_URL) {
  provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
} else {
  // Fallback to a public provider (rate-limited)
  provider = new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_API_KEY);
}

// Create contract interface
const carrotContract = new ethers.Contract(CARROT_TOKEN_ADDRESS, ERC20_ABI, provider);

// Function to start monitoring transactions
function startTransactionMonitoring(telegramBot) {
  console.log('🔍 Starting Carrot token transaction monitoring...');
  
  // Listen for Transfer events
  carrotContract.on("Transfer", async (from, to, value, event) => {
    try {
      // Convert value to token amount (considering decimals)
      const decimals = 18; // Assuming 18 decimals for the token
      const amount = parseFloat(ethers.utils.formatUnits(value, decimals));
      
      // Skip small transactions
      if (amount < MIN_TRANSACTION_SIZE) {
        return;
      }
      
      // Determine if it's a buy or sell
      // This is a simplification - in real DEXs it's more complex
      let transactionType = "Transfer";
      if (from.toLowerCase() === '0x0000000000000000000000000000000000000000') {
        transactionType = "Mint"; // Token creation
      } else if (to.toLowerCase() === '0x0000000000000000000000000000000000000000') {
        transactionType = "Burn"; // Token destruction
      } else {
        // Try to determine if it's from/to a known exchange
        const knownExchanges = [
          // Add known exchange addresses here
          '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2 Router
          '0xe592427a0aece92de3edee1f18e0157c05861564'  // Uniswap V3 Router
        ];
        
        if (knownExchanges.includes(from.toLowerCase())) {
          transactionType = "Buy";
        } else if (knownExchanges.includes(to.toLowerCase())) {
          transactionType = "Sell";
        }
      }
      
      // Calculate USD value (if possible)
      let usdValue = null;
      try {
        const CMC_API_KEY = process.env.CMC_API_KEY;
        const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
        
        const response = await axios.get(CMC_API_URL, {
          params: {
            symbol: 'CARROT',
          },
          headers: {
            'X-CMC_PRO_API_KEY': CMC_API_KEY,
          }
        });
        
        const carrotPrice = response.data.data.CARROT.quote.USD.price;
        usdValue = amount * carrotPrice;
      } catch (error) {
        console.error('Error fetching Carrot price:', error);
      }
      
      // Create transaction record
      const transaction = {
        hash: event.transactionHash,
        from: from,
        to: to,
        amount: amount,
        usdValue: usdValue,
        type: transactionType,
        timestamp: new Date().toISOString(),
        blockNumber: event.blockNumber
      };
      
      // Add to recent transactions
      recentTransactions.unshift(transaction);
      
      // Limit size of recent transactions array
      if (recentTransactions.length > TRANSACTION_LIMIT) {
        recentTransactions.pop();
      }
      
      // Notify via Telegram for significant transactions
      if (telegramBot && amount > MIN_TRANSACTION_SIZE * 10) {
        // Get active monitors
        const activeMonitors = global.activeMonitors;
        if (activeMonitors && activeMonitors.size > 0) {
          const message = createTransactionAlertMessage(transaction);
          
          // Send to all active monitors
          for (const [chatId, monitor] of activeMonitors.entries()) {
            if (monitor.active && monitor.transactionAlerts) {
              telegramBot.sendMessage(chatId, message);
            }
          }
        }
      }
      
      console.log(`📊 Detected Carrot token ${transactionType}: ${amount.toFixed(2)} tokens ($${usdValue ? usdValue.toFixed(2) : 'unknown'})`);
    } catch (error) {
      console.error('Error processing transaction event:', error);
    }
  });
  
  console.log('✅ Transaction monitoring initialized');
  
  return {
    getRecentTransactions: () => [...recentTransactions]
  };
}

// Create a formatted message for transaction alerts
function createTransactionAlertMessage(transaction) {
  const { type, amount, usdValue, hash } = transaction;
  
  let emoji = '🔄';
  if (type === 'Buy') emoji = '🟢';
  if (type === 'Sell') emoji = '🔴';
  if (type === 'Mint') emoji = '✨';
  if (type === 'Burn') emoji = '🔥';
  
  let message = `${emoji} Large Carrot ${type} Detected!\n\n`;
  message += `Amount: ${amount.toFixed(2)} CARROT`;
  
  if (usdValue) {
    message += ` ($${usdValue.toFixed(2)} USD)`;
  }
  
  message += `\n\nTransaction: https://etherscan.io/tx/${hash}`;
  
  return message;
}

module.exports = {
  startTransactionMonitoring
};