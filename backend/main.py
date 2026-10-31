"""
main.py - FastAPI Backend Server for FinanceBro
NSE Multi-Module Consensus, Paper Trading, REST API & WebSocket Real-time Feed
"""

import asyncio
import json
import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from state import state
from paper_trading import execute_order, get_portfolio_summary
from scanner import (
    MASTER_NSE_STOCKS,
    scan_all_stocks,
    scan_single_stock,
    get_candlestick_data,
    check_auto_exit_positions
)
from modules import DEFAULT_RULES

app = FastAPI(
    title="FinanceBro Institutional API",
    description="High-frequency multi-module technical consensus and paper trading engine for NSE",
    version="2.0.0"
)

# Enable CORS for local development and Cloudflare Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class OrderRequest(BaseModel):
    ticker: str
    action: str  # BUY or SELL
    qty: int
    price: Optional[float] = None

class ResetPortfolioRequest(BaseModel):
    initial_capital: float = 1000.0

class ConfigUpdateRequest(BaseModel):
    rules: Dict[str, Any]


# ==========================================
# REST API ENDPOINTS
# ==========================================

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "service": "FinanceBro Algorithmic Engine",
        "timestamp": datetime.datetime.now().isoformat(),
        "stocks_tracked": len(MASTER_NSE_STOCKS),
        "wallet_balance": state.wallet_balance
    }

@app.get("/api/config")
def get_config():
    return {
        "rules": state.rules,
        "defaults": DEFAULT_RULES
    }

@app.post("/api/config")
def update_config(req: ConfigUpdateRequest):
    state.rules = req.rules
    state.save_config()
    state.add_log("⚙️ Consensus rules & module parameters updated.")
    return {"success": True, "rules": state.rules}

@app.post("/api/config/reset")
def reset_config():
    state.reset_rules()
    return {"success": True, "rules": state.rules}

@app.get("/api/stocks")
def get_stocks(
    max_price: Optional[float] = Query(None, description="Filter stocks below maximum price / wallet budget"),
    query: Optional[str] = Query(None, description="Search term for ticker, name, or sector")
):
    stocks = scan_all_stocks(max_price=max_price, search=query)
    return {
        "count": len(stocks),
        "wallet_balance": state.wallet_balance,
        "max_price_applied": max_price,
        "stocks": stocks
    }

@app.get("/api/stock/{ticker}")
def get_stock_detail(ticker: str):
    ticker = ticker.upper().strip()
    try:
        data = scan_single_stock(ticker)
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found: {str(e)}")

@app.get("/api/stock/{ticker}/candles")
def get_stock_candles(
    ticker: str,
    period: str = Query("6mo", description="yfinance period e.g. 1mo, 3mo, 6mo, 1y"),
    interval: str = Query("1d", description="yfinance interval e.g. 15m, 1h, 1d")
):
    ticker = ticker.upper().strip()
    try:
        candles = get_candlestick_data(ticker, period=period, interval=interval)
        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "count": len(candles),
            "candles": candles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating candles for {ticker}: {str(e)}")

@app.get("/api/portfolio")
def get_portfolio():
    # Fetch live prices for active positions
    current_prices = {}
    for t in state.active_positions.keys():
        try:
            current_prices[t] = scan_single_stock(t)["current_price"]
        except Exception:
            current_prices[t] = state.active_positions[t]["avg_price"]

    summary = get_portfolio_summary(current_prices)
    return summary

@app.post("/api/order/execute")
def place_order(order: OrderRequest):
    ticker = order.ticker.upper().strip()
    price = order.price
    if price is None or price <= 0:
        stock_info = scan_single_stock(ticker)
        price = stock_info["current_price"]
        consensus_score = stock_info["consensus_score"]
    else:
        consensus_score = 0

    result = execute_order(
        ticker=ticker,
        action=order.action,
        qty=order.qty,
        price=price,
        consensus_score=consensus_score
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Order failed"))

    return result

@app.post("/api/portfolio/reset")
def reset_portfolio_endpoint(req: ResetPortfolioRequest):
    state.reset_portfolio(initial_capital=req.initial_capital)
    return {
        "success": True,
        "message": f"Portfolio reset to ₹{req.initial_capital:,.2f}",
        "wallet_balance": state.wallet_balance
    }

@app.get("/api/logs")
def get_logs():
    return {
        "count": len(state.simulation_logs),
        "logs": state.simulation_logs
    }


# ==========================================
# WEBSOCKET REAL-TIME FEED
# ==========================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.disconnect(dc)

manager = ConnectionManager()

@app.websocket("/ws/feed")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send initial welcome & wallet payload
    await websocket.send_json({
        "type": "INIT",
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "wallet_balance": state.wallet_balance,
        "active_positions_count": len(state.active_positions),
        "message": "Connected to FinanceBro Real-time Feed"
    })

    try:
        while True:
            # Check for incoming client messages or pulse
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                action = payload.get("action")
                if action == "PING":
                    await websocket.send_json({"type": "PONG", "time": time.time()})
                elif action == "REFRESH":
                    # Instant broadcast
                    stocks = scan_all_stocks()
                    await websocket.send_json({
                        "type": "STOCKS_UPDATE",
                        "stocks": stocks[:15],
                        "wallet_balance": state.wallet_balance
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# Background task for periodic market updates and auto-exit evaluation
@app.on_event("startup")
async def start_background_broadcaster():
    asyncio.create_task(background_market_broadcaster())

async def background_market_broadcaster():
    while True:
        try:
            await asyncio.sleep(8)
            if manager.active_connections:
                # 1. Check auto exits
                current_prices = {}
                for t in list(state.active_positions.keys()):
                    try:
                        s = scan_single_stock(t)
                        current_prices[t] = s["current_price"]
                    except Exception:
                        pass
                
                exits_triggered = check_auto_exit_positions(current_prices)
                
                # 2. Broadcast periodic update
                await manager.broadcast({
                    "type": "PULSE",
                    "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                    "wallet_balance": state.wallet_balance,
                    "active_positions_count": len(state.active_positions),
                    "auto_exits": exits_triggered,
                    "latest_log": state.simulation_logs[-1] if state.simulation_logs else ""
                })
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Background broadcast loop error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
