import { useState, useEffect } from "preact/hooks";

export function App() {
  const [countdown, setCountdown] = useState("");
  const [lastServerTime, setLastServerTime] = useState<Date | null>(null);

  const fetchServerTime = async () => {
    try {
      const response = await fetch(window.location.href, { method: "HEAD" });
      const dateHeader = response.headers.get("Date") || new Date().toString();
      return new Date(dateHeader);
    } catch (error) {
      console.error("Failed to fetch server time:", error);
      return null;
    }
  };

  const validateTime = async (currentServerTime: Date) => {
    if (!lastServerTime) return true;

    const timeDiff = Math.abs(
      currentServerTime.getTime() - lastServerTime.getTime()
    );
    const expectedDiff = 3600000; // 1 hour in milliseconds
    const tolerance = 5000; // 5 seconds tolerance

    return Math.abs(timeDiff - expectedDiff) <= tolerance;
  };

  useEffect(() => {
    const startCountdown = async (serverDate: Date) => {
      const currentYear = serverDate.getFullYear();
      const nextYear = currentYear + 1;
      const targetDate = new Date(`January 1, ${nextYear} 00:00:00`);

      const updateCountdown = () => {
        const now = new Date();
        const timeDiff = targetDate.getTime() - now.getTime();

        if (timeDiff <= 0) {
          setCountdown("Happy New Year!");
          clearInterval(intervalId);
          return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        setCountdown(
          `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`
        );
      };

      const intervalId = setInterval(updateCountdown, 1000);
      updateCountdown();

      // Set up hourly server time validation
      const validateInterval = setInterval(async () => {
        const newServerTime = await fetchServerTime();
        if (!newServerTime) return;

        const isValid = await validateTime(newServerTime);
        if (!isValid) {
          console.error("Server time validation failed - restarting countdown");
          clearInterval(intervalId);
          clearInterval(validateInterval);
          setLastServerTime(newServerTime);
          startCountdown(newServerTime);
        } else {
          setLastServerTime(newServerTime);
        }
      }, 3600000); // Check every hour

      return () => {
        clearInterval(intervalId);
        clearInterval(validateInterval);
      };
    };

    const initializeCountdown = async () => {
      const serverTime = await fetchServerTime();
      if (serverTime) {
        setLastServerTime(serverTime);
        startCountdown(serverTime);
      }
    };

    initializeCountdown();
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="p-2">
        <h1>Countdown to Next Year</h1>
        <div class="countdown">{countdown}</div>
      </div>
    </div>
  );
}
