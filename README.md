# Carrot/Puffer Price Monitor with Telegram Notifications

A web application that monitors the price relationship between Carrot and Puffer tokens, sending Telegram alerts when Carrot's price falls below 55% of Puffer's price. It also tracks and alerts about significant buy/sell transactions.

## Project Overview

This application:

1. Fetches real-time price data for Carrot and Puffer tokens from CoinMarketCap
2. Monitors if Carrot price < Puffer price * 0.55
3. Calculates the discount percentage when this condition is met
4. Tracks on-chain transactions for Carrot token
5. Sends Telegram notifications for both price alerts and significant transactions

## Features

- Real-time price monitoring
- On-chain transaction monitoring
- Configurable check intervals
- Telegram bot notifications for price alerts and large transactions
- Dashboard with current prices and threshold information
- Recent transactions display
- User-friendly interface
- Bot commands for checking prices and transactions on demand

## Technology Stack

- Frontend: React.js
- Backend: Node.js with Express
- Telegram Bot API: node-telegram-bot-api
- Blockchain Interaction: ethers.js
- API Integration: CoinMarketCap API
- Development: Create React App

### Prerequisites

- Node.js and npm installed
- CoinMarketCap API key
- Telegram account
- Ethereum provider (Infura or Alchemy API key)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/carrot-puffer-monitor.git
   cd carrot-puffer-monitor
   ```

2. Install dependencies for both frontend and backend
   ```
   # Install all dependencies
   npm run install-all
   ```

3. Create a Telegram Bot
   - Open Telegram and search for "@BotFather"
   - Start a chat with BotFather and type `/newbot`
   - Follow the instructions to create your bot
   - Save the bot token provided by BotFather

4. Configure environment variables
   - Create a `.env` file in the root directory using the template in `.env.example`
   - Add your CoinMarketCap API key
   - Add your Telegram Bot token
   - Add your Ethereum provider details (Infura or Alchemy API key)

5. Start the development server
   ```
   # Start both backend and frontend
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

## Usage

### Web Interface
1. Open the web application in your browser
2. Follow the instructions to connect to the Telegram bot
3. Set the desired check interval in minutes
4. Toggle transaction alerts if desired
5. Click "Start Monitoring" to begin tracking prices and transactions

### Telegram Commands
- `/start` - Initialize the bot and get welcome information
- `/monitor` - Start monitoring Carrot/Puffer prices
- `/transactions` - Toggle transaction alerts
- `/recent` - Show recent Carrot transactions
- `/stop` - Stop price monitoring
- `/check` - Check current prices immediately
- `/status` - View your current monitoring status
- `/help` - List all available commands

The application will automatically send Telegram notifications when:
- Carrot's price falls below 55% of Puffer's price
- Significant buy/sell transactions occur for Carrot token (configurable threshold)

## Transaction Monitoring

The application monitors the Ethereum blockchain for Carrot token transfers and categorizes them as:

- **Buy**: Transactions from known exchange addresses to user wallets
- **Sell**: Transactions from user wallets to known exchange addresses
- **Mint**: Token creation transactions
- **Burn**: Token destruction transactions
- **Transfer**: Regular transfers between addresses

Only transactions above the configured minimum size (`MIN_TRANSACTION_SIZE` in .env) will be tracked and displayed.