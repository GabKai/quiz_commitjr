import { useState, useEffect, useRef } from 'react';
import '../styles/components.css';

export default function Timer({ duration, onTimeUp, isRunning = true }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef(null);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / duration) * circumference;

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeUp && onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, duration, onTimeUp]);

  const getColor = () => {
    const ratio = timeLeft / duration;
    if (ratio > 0.5) return 'var(--primary)';
    if (ratio > 0.25) return 'var(--answer-2)';
    return 'var(--error)';
  };

  return (
    <div className="timer-container">
      <svg className="timer-svg" viewBox="0 0 120 120">
        <circle
          className="timer-bg"
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="var(--surface-container-high)"
          strokeWidth="8"
        />
        <circle
          className="timer-progress"
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className="timer-text" style={{ color: getColor() }}>
        {timeLeft}
      </span>
    </div>
  );
}
