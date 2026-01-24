import { FundOverview } from '../types';
import { calculateSharpeRatio, formatSharpeRatio } from '../utils/analytics';

interface Props {
  fund: FundOverview;
  onRemove: (code: string) => void;
  color?: string;
}

const FundCard = ({ fund, onRemove, color }: Props) => {
  // Get latest price from priceHistory
  const latestPrice = fund.priceHistory && fund.priceHistory.length > 0
    ? fund.priceHistory[fund.priceHistory.length - 1].value
    : null;

  // Calculate Sharpe ratio
  const sharpeRatio = fund.priceHistory && fund.priceHistory.length > 0
    ? calculateSharpeRatio(fund.priceHistory)
    : null;

  // Format price with up to 6 decimals, remove trailing zeros
  const formatPrice = (price: number) => {
    return price.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  return (
    <div className="card fund-card" style={color ? { borderLeftColor: color } : undefined}>
      <div className="fund-card-header">
        <div className="fund-card-header-left">
          <span className="fund-card-code">{fund.code}</span>
          {sharpeRatio !== null && (
            <span className="fund-card-sharpe" title="Sharpe Ratio">
              SR: {formatSharpeRatio(sharpeRatio)}
            </span>
          )}
        </div>
        <button className="remove-btn" onClick={() => onRemove(fund.code)}>×</button>
      </div>

      {latestPrice !== null && (
        <div className="fund-card-price">{formatPrice(latestPrice)} ₺</div>
      )}

      <div className="fund-card-title">{fund.title}</div>
    </div>
  );
};

export default FundCard;
