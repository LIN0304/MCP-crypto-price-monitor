// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [carrotPrice, setCarrotPrice] = useState(null);
  const [pufferPrice, setPufferPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [discount, setDiscount] = useState(null);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [monitorActive, setMonitorActive] = useState(false);
  const [botStarted, setBotStarted] = useState(false);
  const [chatId, setChatId] = useState('');
  const [interval, setInterval] = useState(5); // minutes

  // Function to fetch cryptocurrency prices
  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using the CoinMarketCap API with proper endpoints
      // Note: You'll need an API key from CoinMarketCap
      // https://coinmarketcap.com/api/documentation/v1/
      
      // The CoinMarketCap API endpoint for cryptocurrency quotes
      const CMC_API_ENDPOINT = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
      
      // Carrot token contract address: 0x282a69142bac47855c3fbe1693fcc4ba3b4d5ed6
      // Puffer token contract address: 0x4d1c297d39c5c1277964d0e3f8aa901493664530
      
      // For Carrot by Puffer
      const carrotResponse = await axios.get(CMC_API_ENDPOINT, {
        params: {
          symbol: 'CARROT',
        },
        headers: {
          'X-CMC_PRO_API_KEY': process.env.REACT_APP_CMC_API_KEY,
        }
      });
      
      // For Puffer
      const pufferResponse = await axios.get(CMC_API_ENDPOINT, {
        params: {
          symbol: 'PUFFER',
        },
        headers: {
          'X-CMC_PRO_API_KEY': process.env.REACT_APP_CMC_API_KEY,
        }
      });
      
      // Extract price data (adjust based on actual API response structure)
      const carrotPriceValue = carrotResponse.data.data.CARROT.quote.USD.price;
      const pufferPriceValue = pufferResponse.data.data.PUFFER.quote.USD.price;
      
      setCarrotPrice(carrotPriceValue);
      setPufferPrice(pufferPriceValue);
      
      // Calculate threshold price (55% of Puffer price)
      const thresholdPrice = pufferPriceValue * 0.55;
      
      // Check if Carrot price is lower than the threshold
      if (carrotPriceValue < thresholdPrice) {
        // Calculate discount percentage
        const discountAmount = thresholdPrice - carrotPriceValue;
        const discountPercentage = (discountAmount / thresholdPrice) * 100;
        setDiscount(discountPercentage.toFixed(2));
        
        // Send Telegram notification if monitoring is active
        if (monitorActive && telegramConnected) {
          sendTelegramAlert(carrotPriceValue, pufferPriceValue, discountPercentage);
        }
      } else {
        setDiscount(null);
      }
      
      setLastChecked(new Date().toLocaleString());
    } catch (err) {
      console.error('Error fetching cryptocurrency data:', err);
      setError('Failed to fetch cryptocurrency data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to send Telegram alert
  const sendTelegramAlert = async (carrotPrice, pufferPrice, discountPercentage) => {
    try {
      // Send notification to Telegram bot
      await axios.post('/api/notify', {
        chatId,
        carrotPrice,
        pufferPrice,
        discountPercentage
      });
      
      setTelegramConnected(true);
    } catch (err) {
      console.error('Error sending Telegram alert:', err);
      setError('Failed to send Telegram alert. Please check your Telegram bot connection.');
    }
  };
  
  // Connect to Telegram bot
  const connectTelegramBot = async () => {
    if (!telegramUsername) {
      setError('Please enter your Telegram username before connecting.');
      return;
    }
    
    try {
      setError(null);
      // Normally, we would have a backend endpoint to retrieve the chat ID
      // In a real application, the user would start a conversation with the bot
      // and the backend would store the mapping between username and chat ID
      
      // For this demo, we'll simulate obtaining a chat ID
      const demoId = Math.floor(Math.random() * 10000000) + 1000000000;
      setChatId(demoId.toString());
      setBotStarted(true);
      setTelegramConnected(true);
      
    } catch (err) {
      console.error('Error connecting to Telegram bot:', err);
      setError('Failed to connect to Telegram bot. Please make sure you have started a chat with the bot.');
    }
  };
  
  // Start/stop monitoring
  const toggleMonitoring = () => {
    if (!monitorActive) {
      if (!telegramConnected) {
        setError('Please connect to the Telegram bot before starting monitoring.');
        return;
      }
      fetchPrices(); // Fetch immediately when starting
    }
    setMonitorActive(!monitorActive);
  };
  
  // Set up periodic checking when monitoring is active
  useEffect(() => {
    let timer;
    
    if (monitorActive) {
      timer = setInterval(fetchPrices, interval * 60 * 1000); // Convert minutes to milliseconds
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [monitorActive, interval]);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Crypto Price Monitor</h1>
        <p>Monitoring Carrot vs Puffer price relationship</p>
      </header>
      
      <main>
        <div className="control-panel">
          {!botStarted ? (
            <div className="telegram-setup">
              <h3>Connect to Telegram Bot</h3>
              <ol>
                <li>Open Telegram and search for <code>@YourCryptoMonitorBot</code></li>
                <li>Start a conversation with the bot by sending <code>/start</code></li>
                <li>Enter your Telegram username below (without @)</li>
              </ol>
              
              <div className="input-group">
                <label htmlFor="telegramUsername">Telegram username:</label>
                <input
                  type="text"
                  id="telegramUsername"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="username"
                  disabled={telegramConnected}
                />
              </div>
              
              <button 
                className="connect-telegram" 
                onClick={connectTelegramBot}
                disabled={telegramConnected}
              >
                {telegramConnected ? "Connected ✓" : "Connect to Telegram"}
              </button>
              
              {telegramConnected && (
                <p className="status success">
                  Successfully connected to Telegram! You can now start monitoring.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="telegram-status">
                <h3>Telegram Bot Status</h3>
                <p>Connected as: <strong>{telegramUsername}</strong></p>
                <p>You will receive alerts directly in Telegram when prices meet your criteria.</p>
                <p>Use <code>/check</code> in Telegram to check prices anytime.</p>
              </div>
              
              <div className="input-group">
                <label htmlFor="interval">Check interval (minutes):</label>
                <input
                  type="number"
                  id="interval"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  disabled={monitorActive}
                />
              </div>
              
              <button 
                className={monitorActive ? "stop" : "start"} 
                onClick={toggleMonitoring}
              >
                {monitorActive ? "Stop Monitoring" : "Start Monitoring"}
              </button>
              
              <button 
                className="check-now" 
                onClick={fetchPrices} 
                disabled={loading}
              >
                Check Prices Now
              </button>
            </>
          )}
        </div>
        
        {loading && <p className="status loading">Loading price data...</p>}
        {error && <p className="status error">{error}</p>}
        
        <div className="price-display">
          <h2>Current Prices</h2>
          
          {pufferPrice && (
            <div className="price-item">
              <h3>Puffer Price:</h3>
              <p className="price">${pufferPrice.toFixed(6)}</p>
            </div>
          )}
          
          {pufferPrice && (
            <div className="price-item threshold">
              <h3>Threshold Price (55% of Puffer):</h3>
              <p className="price">${(pufferPrice * 0.55).toFixed(6)}</p>
            </div>
          )}
          
          {carrotPrice && (
            <div className="price-item">
              <h3>Carrot Price:</h3>
              <p className="price">${carrotPrice.toFixed(6)}</p>
            </div>
          )}
          
          {discount && (
            <div className="discount-alert">
              <h3>Alert! Carrot is below threshold</h3>
              <p>Discount: {discount}% below threshold</p>
            </div>
          )}
          
          {lastChecked && (
            <p className="last-checked">Last checked: {lastChecked}</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;