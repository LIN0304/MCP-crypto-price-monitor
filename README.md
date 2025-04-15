# Carrot/Puffer Price Monitor with Telegram Notifications

A web application that monitors the price relationship between Carrot and Puffer tokens, sending Telegram alerts when Carrot's price falls below 55% of Puffer's price.

## Project Overview

This application:

1. Fetches real-time price data for Carrot and Puffer tokens from CoinMarketCap
2. Monitors if Carrot price < Puffer price * 0.55
3. Calculates the discount percentage when this condition is met
4. Sends Telegram notifications to users

## Features

- Real-time price monitoring
- Configurable check intervals
- Telegram bot notifications when price thresholds are met
- Dashboard with current prices and threshold information
- User-friendly interface
- Bot commands for checking prices on demand

## Technology Stack

- Frontend: React.js
- Backend: Node.js with Express
- Telegram Bot API: node-telegram-bot-api
- API Integration: CoinMarketCap API
- Development: Create React App

### Prerequisites

- Node.js and npm installed
- CoinMarketCap API key
- Telegram account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/carrot-puffer-monitor.git
   cd carrot-puffer-monitor
   ```

2. Install dependencies for both frontend and backend
   ```
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. Create a Telegram Bot
   - Open Telegram and search for "@BotFather"
   - Start a chat with BotFather and type `/newbot`
   - Follow the instructions to create your bot
   - Save the bot token provided by BotFather

4. Configure environment variables
   - Create a `.env` file in the root directory using the template in `crypto-config.js`
   - Add your CoinMarketCap API key
   - Add your Telegram Bot token

5. Start the development server
   ```
   # Start backend server
   cd server
   npm start
   
   # In a new terminal, start frontend
   cd ..
   npm start
   ```

6. Access the application at `http://localhost:3000`

## Usage

### Web Interface
1. Open the web application in your browser
2. Follow the instructions to connect to the Telegram bot
3. Set the desired check interval in minutes
4. Click "Start Monitoring" to begin tracking prices

### Telegram Commands
- `/start` - Initialize the bot and get welcome information
- `/monitor` - Start monitoring Carrot/Puffer prices
- `/stop` - Stop price monitoring
- `/check` - Check current prices immediately
- `/status` - View your current monitoring status
- `/help` - List all available commands

The application will automatically send Telegram notifications when Carrot's price falls below 55% of Puffer's price