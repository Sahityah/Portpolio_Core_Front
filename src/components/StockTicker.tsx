import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react"; // Import icons

type TickerProps = {
  indices: {
    symbol: string;
    price: number;
    change: number;
  }[];
};

export const StockTicker = ({ indices }: TickerProps) => {
  if (indices.length === 0) {
    return (
      <div
        className="w-full bg-black text-white text-center py-2 text-sm md:text-base"
        role="status" // Accessibility: Indicate live region status
        aria-live="polite" // Accessibility: Announces changes politely
      >
        Loading market data...
      </div>
    );
  }

  return (
    <div
      className="w-full bg-black text-white overflow-hidden whitespace-nowrap py-2 text-sm md:text-base"
      role="marquee" // ARIA role for a marquee (though generally discouraged if not controllable)
      aria-live="off" // Indicate content is not critically live, can be ignored by screen readers if too fast
    >
      <div className="animate-marquee flex items-center space-x-12 px-4">
        {indices.map((index, i) => (
          <div
            key={index.symbol || i} // Use symbol as key if unique, fallback to index
            className="flex items-center space-x-3 min-w-max font-medium"
            aria-label={`${index.symbol}: price ${index.price.toFixed(2)}, change ${index.change.toFixed(2)} percent`} // Detailed label
          >
            <span className="text-yellow-400">{index.symbol}</span>
            <span>₹{index.price.toFixed(2)}</span>
            <span className={index.change >= 0 ? "text-green-400" : "text-red-400"}>
              {index.change >= 0 ? (
                <TrendingUp className="inline h-4 w-4 mr-1 align-text-bottom" aria-hidden="true" />
              ) : (
                <TrendingDown className="inline h-4 w-4 mr-1 align-text-bottom" aria-hidden="true" />
              )}
              {Math.abs(index.change).toFixed(2)}%
            </span>
          </div>
        ))}
        {/* Optional: duplicate content for continuous loop */}
        {indices.map((index, i) => (
          <div
            key={`dup-${index.symbol || i}`} // Unique key for duplicated content
            className="flex items-center space-x-3 min-w-max font-medium"
            aria-hidden="true" // Hide duplicated content from screen readers
          >
            <span className="text-yellow-400">{index.symbol}</span>
            <span>₹{index.price.toFixed(2)}</span>
            <span className={index.change >= 0 ? "text-green-400" : "text-red-400"}>
              {index.change >= 0 ? (
                <TrendingUp className="inline h-4 w-4 mr-1 align-text-bottom" aria-hidden="true" />
              ) : (
                <TrendingDown className="inline h-4 w-4 mr-1 align-text-bottom" aria-hidden="true" />
              )}
              {Math.abs(index.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      {/* You would need to define `@keyframes marquee` in your global CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } /* Move half the width of content */
        }
        .animate-marquee {
          animation: marquee 30s linear infinite; /* Adjust speed as needed */
          display: flex; /* Ensure flex behavior */
          width: fit-content; /* Ensure content determines width */
        }
      `}</style>
    </div>
  );
};

// Remove default export if you plan to use named export in DashboardPage:
// export default StockTicker;