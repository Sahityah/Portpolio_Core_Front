import axios from "axios";

const API_KEY = "import.meta.env.VITE_FINNHUB_API_KEY";
const BASE_URL = "https://finnhub.io/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    token: API_KEY
  }
});

export const getQuote = (symbol: string) =>
  api.get(`/quote`, { params: { symbol } });

export const getCandles = (symbol: string, resolution: string, from: number, to: number) =>
  api.get(`/stock/candle`, { params: { symbol, resolution, from, to } });

export const getIndices = () =>
  Promise.all([
    getQuote("^NSEI"),      // NIFTY 50
    getQuote("^NSEBANK"),   // BANKNIFTY
    getQuote("RELIANCE.NS"),
    getQuote("INFY.NS")
  ]);
