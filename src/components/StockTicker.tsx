import React from "react";

type TickerProps = {
  indices: {
    symbol: string;
    price: number;
    change: number;
  }[];
};

export const StockTicker = ({ indices }: TickerProps) => {
  return (
    <div className="w-full bg-black text-white overflow-hidden whitespace-nowrap py-2">
      <div className="animate-marquee flex items-center space-x-12 px-4">
        {indices.map((index, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 min-w-max font-medium"
          >
            <span className="text-yellow-400">{index.symbol}</span>
            <span>₹{index.price.toFixed(2)}</span>
            <span className={index.change >= 0 ? "text-green-400" : "text-red-400"}>
              {index.change >= 0 ? "▲" : "▼"} {Math.abs(index.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockTicker;
