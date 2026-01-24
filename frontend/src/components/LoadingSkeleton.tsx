interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', style }: SkeletonProps) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }}
  />
);

export const ChartSkeleton = () => (
  <div className="card" style={{ marginBottom: 16 }}>
    <Skeleton height="320px" borderRadius="8px" />
  </div>
);

export const FundCardSkeleton = () => (
  <div className="card fund-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <Skeleton width="80px" height="24px" borderRadius="5px" />
      <Skeleton width="60px" height="20px" borderRadius="4px" />
    </div>
    <Skeleton width="120px" height="24px" borderRadius="5px" style={{ marginBottom: 8 }} />
    <Skeleton width="100%" height="16px" />
    <Skeleton width="80%" height="16px" style={{ marginTop: 4 }} />
  </div>
);

export const FundSelectorSkeleton = () => (
  <div className="selector-panel">
    <div className="selector-dropdown" style={{ width: '100%' }}>
      <Skeleton height="44px" borderRadius="10px" />
    </div>
  </div>
);

// Add CSS animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
document.head.appendChild(style);

export default Skeleton;
