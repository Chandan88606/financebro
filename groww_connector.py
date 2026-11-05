"""
groww_connector.py - Official Groww Trading API Bridge for FinanceBro
Streams real-time Indian stock market quotes & 1-minute candlestick data.

Prerequisites:
  1. An active Groww trading account with Trading API access.
  2. Install the official SDK:
       pip install growwapi
  3. Set your GROWW_AUTH_TOKEN in your environment or .env file.
"""

import os
import sys
import json
import datetime
from typing import Dict, Any, List, Optional

# Check if growwapi is installed
try:
  from growwapi import GrowwAPI, GrowwFeed
  GROWW_SDK_AVAILABLE = True
except ImportError:
  GROWW_SDK_AVAILABLE = False


class GrowwConnector:
  """Bridge to connect Groww Trading API into FinanceBro."""

  def __init__(self, auth_token: Optional[str] = None):
    self.auth_token = auth_token or os.environ.get("GROWW_AUTH_TOKEN", "")
    self.api = None
    self.feed = None

    if not GROWW_SDK_AVAILABLE:
      print("⚠️ 'growwapi' is not installed. Install via: pip install growwapi")
      return

    if self.auth_token:
      try:
        self.api = GrowwAPI(self.auth_token)
        self.feed = GrowwFeed(self.auth_token)
        print("✅ Groww API connected successfully.")
      except Exception as e:
        print(f"❌ Groww API initialization failed: {e}")
    else:
      print("ℹ️ No GROWW_AUTH_TOKEN provided. Operating in dry-run/guidance mode.")

  def get_live_ltp(self, trading_symbol: str = "RELIANCE") -> Optional[float]:
    """Fetch live Last Traded Price (LTP) from Groww."""
    if not self.feed:
      print("Groww feed not initialized. Please set GROWW_AUTH_TOKEN.")
      return None

    try:
      self.feed.subscribe_live_data(GrowwAPI.SEGMENT_CASH, trading_symbol)
      ltp = self.feed.get_stocks_ltp(trading_symbol, timeout=3)
      return float(ltp) if ltp else None
    except Exception as e:
      print(f"Error fetching LTP for {trading_symbol}: {e}")
      return None

  def get_1min_candles(self, trading_symbol: str = "RELIANCE", days_back: int = 1) -> List[Dict[str, Any]]:
    """Fetch 1-minute real-time OHLCV historical candlestick data for charts."""
    if not self.api:
      print("Groww API not initialized. Please set GROWW_AUTH_TOKEN.")
      return []

    try:
      end_dt = datetime.datetime.now()
      start_dt = end_dt - datetime.timedelta(days=days_back)

      start_str = start_dt.strftime("%Y-%m-%d 09:15:00")
      end_str = end_dt.strftime("%Y-%m-%d %H:%M:%S")

      # Fetch historical 1-minute candles
      raw_candles = self.api.get_historical_candles(
          exchange=self.api.EXCHANGE_NSE,
          segment=self.api.SEGMENT_CASH,
          trading_symbol=trading_symbol,
          interval_in_minutes=1,
          start_time=start_str,
          end_time=end_str
      )

      candles = []
      for bar in raw_candles:
        candles.append({
            "time": bar[0],       # Timestamp
            "open": float(bar[1]),
            "high": float(bar[2]),
            "low": float(bar[3]),
            "close": float(bar[4]),
            "volume": int(bar[5])
        })
      return candles
    except Exception as e:
      print(f"Error fetching 1-minute candles from Groww: {e}")
      return []

  def get_option_chain_greeks(self, underlying: str = "NIFTY") -> Optional[Dict[str, Any]]:
    """Fetch live derivatives Option Chain & Greeks from Groww API."""
    if not self.api:
      return None
    try:
      return self.api.get_option_chain(exchange=self.api.EXCHANGE_NSE, underlying=underlying)
    except Exception as e:
      print(f"Error fetching option chain: {e}")
      return None


if __name__ == "__main__":
  print("=" * 65)
  print(" Groww Trading API Diagnostic & Setup Guide")
  print("=" * 65)
  token = os.environ.get("GROWW_AUTH_TOKEN")
  if not token:
    print("\n[!] GROWW_AUTH_TOKEN is not set.")
    print("How to get your Groww API Token:")
    print("  1. Log into your Groww account at: https://groww.in")
    print("  2. Navigate to Profile > Settings > Trading API / Developer Portal.")
    print("  3. Create an API App and copy your Auth Token.")
    print("  4. Add it to your .env file:")
    print("       GROWW_AUTH_TOKEN=your_token_here")
    print("  5. Run this test script:")
    print("       python groww_connector.py\n")
  else:
    connector = GrowwConnector(token)
    price = connector.get_live_ltp("RELIANCE")
    print(f"Reliance Live LTP from Groww: {price}")
