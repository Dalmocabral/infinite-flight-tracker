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
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            // Only reset if currently active (to prevent constant resets if already inactive? 
            // No, standard is reset on activity. 
            // EXCEPT: If we want to require manual reconnection, we should NOT reset on mousemove alone if ALREADY inactive.
            // The user requested a dialog to appear. Usually that implies manual action to dismiss.
            // If mousemove automatically reconnects, the dialog would flash disappear.
            // So: If isInactive is true, DO NOT reset automatically. Wait for manual function call.
            
            if (!isInactive) { 
                resetTimer(); // Debounce/Throttle could be added but simple reset is fine for now
            }
        };

        // Initialize timer
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
        resetTimer();
    };

    return { isInactive, handleReconnect };
};

export default useInactivity;
