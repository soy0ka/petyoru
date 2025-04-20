import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  className?: string;
  isLoading?: boolean;
  duration?: number; // 애니메이션 지속 시간(초)
}

export default function AnimatedNumber({ 
  value, 
  className, 
  isLoading, 
  duration = 0.8 
}: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    if (isLoading) return;
    
    previousValue.current = displayValue;
    
    // 값이 변경되면 애니메이션 시작
    const startAnimation = async () => {
      const startTime = Date.now();
      const endTime = startTime + duration * 1000;
      
      const updateValue = () => {
        const now = Date.now();
        if (now >= endTime) {
          setDisplayValue(value);
          return;
        }
        
        const progress = (now - startTime) / (duration * 1000);
        const currentValue = Math.round(previousValue.current + (value - previousValue.current) * progress);
        setDisplayValue(currentValue);
        
        requestAnimationFrame(updateValue);
      };
      
      requestAnimationFrame(updateValue);
    };
    
    startAnimation();
  }, [value, isLoading, duration, displayValue]);

  if (isLoading) {
    return <span className={`${className} opacity-0`}>0</span>;
  }

  return (
    <span className={className}>
      {displayValue}
    </span>
  );
}
