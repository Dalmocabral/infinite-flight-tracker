import { useCallback, useEffect, useRef, useState } from 'react';

const useInactivity = (timeoutDuration = 120000) => { // Default 2 minutes
    const [isInactive, setIsInactive] = useState(false);
    const timerRef = useRef(null);

    const resetTimer = useCallback(() => {
        setIsInactive(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setIsInactive(true);
        }, timeoutDuration);
    }, [timeoutDuration]);

    useEffect(() => {
        // If already inactive, do not set up listeners or timer
        if (isInactive) return;

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            // Because of the check at the start of useEffect, we know isInactive is false here
            // (or rather, this closure was created when isInactive was false)
            resetTimer(); 
        };

        // Initialize timer (start counting down)
        resetTimer();

        // Attach listeners
        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [resetTimer, isInactive]);

    const handleReconnect = () => {
        setIsInactive(false);
        // resetTimer(); // Not needed, useEffect will run when isInactive becomes false and call resetTimer
    };

    return { isInactive, handleReconnect };
};

export default useInactivity;
