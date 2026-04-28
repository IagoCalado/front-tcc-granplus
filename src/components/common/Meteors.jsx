import { useEffect, useState } from 'react';
import '../../App.css';

export default function Meteors({ number = 30 }) {
  const [meteorStyles, setMeteorStyles] = useState([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const styles = Array.from({ length: number }).map(() => ({
        top: Math.floor(Math.random() * 100) + '%',
        left: Math.floor(Math.random() * 100) + '%',
        animationDelay: Math.random() * 1 + 0.2 + 's',
        animationDuration: Math.floor(Math.random() * 6 + 2) + 's',
      }));

      setMeteorStyles(styles);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [number]);

  return (
    <div className="meteors-container">
      {meteorStyles.map((style, idx) => (
        <span key={idx} className="meteor" style={style}></span>
      ))}
    </div>
  );
}