"""
state.py - Persistent in-memory state for FinanceBro Paper Trading & Config
"""

import os
import json
import datetime
from typing import Dict, Any, List, Optional
from modules import DEFAULT_RULES

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(DATA_DIR, "paper_state.json")
CONFIG_FILE = os.path.join(DATA_DIR, "config_state.json")

class SystemState:
    def __init__(self):
        self.wallet_balance: float = 1000.0
        self.initial_capital: float = 1000.0
        self.active_positions: Dict[str, Dict[str, Any]] = {}
        self.trade_history: List[Dict[str, Any]] = []
        self.simulation_logs: List[str] = [
            f"[{datetime.datetime.now().strftime('%H:%M:%S')}] FinanceBro Engine initialized (Wallet: ₹1,000)."
        ]
        self.rules: Dict[str, Any] = DEFAULT_RULES.copy()
        self.load_state()

    def add_log(self, message: str):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {message}"
        self.simulation_logs.append(entry)
        if len(self.simulation_logs) > 300:
            self.simulation_logs.pop(0)

    def load_state(self):
        try:
            if os.path.exists(STATE_FILE):
                with open(STATE_FILE, "r") as f:
                    data = json.load(f)
                    self.wallet_balance = float(data.get("wallet_balance", 1000.0))
                    self.initial_capital = float(data.get("initial_capital", 1000.0))
                    self.active_positions = data.get("active_positions", {})
                    self.trade_history = data.get("trade_history", [])
                    if "simulation_logs" in data:
                        self.simulation_logs = data["simulation_logs"][-150:]
        except Exception as e:
            print(f"Error loading state: {e}")

        try:
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, "r") as f:
                    self.rules = json.load(f)
            else:
                self.rules = DEFAULT_RULES.copy()
        except Exception as e:
            print(f"Error loading config: {e}")
            self.rules = DEFAULT_RULES.copy()

    def save_state(self):
        try:
            data = {
                "wallet_balance": self.wallet_balance,
                "initial_capital": self.initial_capital,
                "active_positions": self.active_positions,
                "trade_history": self.trade_history,
                "simulation_logs": self.simulation_logs[-150:],
            }
            with open(STATE_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving state: {e}")

    def save_config(self):
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(self.rules, f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")

    def reset_portfolio(self, initial_capital: float = 1000.0):
        self.initial_capital = initial_capital
        self.wallet_balance = initial_capital
        self.active_positions.clear()
        self.trade_history.clear()
        self.add_log(f"Portfolio reset to initial capital: ₹{initial_capital:,.2f}")
        self.save_state()

    def reset_rules(self):
        self.rules = DEFAULT_RULES.copy()
        self.save_config()
        self.add_log("Consensus rules reset to factory defaults.")

state = SystemState()
