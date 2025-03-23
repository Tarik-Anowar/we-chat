import React, { useState, useEffect, useCallback } from "react";
import "../styles/globals.css";
export type SnackbarType = "info" | "success" | "failure" | "warning" | "error";

 interface SnackbarProps {
    message: string;
    type?: SnackbarType;
    show: boolean;
    duration?: number;
    onClose: () => void;
}


const Snackbar: React.FC<SnackbarProps> = ({
    message,
    type = "info",
    show,
    duration = 3000,
    onClose,
}) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    const typeColors: Record<SnackbarType, string> = {
        info: "bg-blue-500",
        success: "bg-green-500",
        failure: "bg-red-500",
        warning: "bg-yellow-500",
        error: "bg-red-600",
    };

    return (
        <div
            className={`fixed bottom-10 right-10 px-6 py-3 text-white rounded-lg shadow-xl flex items-center justify-between 
                transition-all duration-300 transform ${typeColors[type]} 
                ${show ? "translate-y-0 opacity-100 scale-100" : "translate-y-5 opacity-0 scale-95"}`}
            style={{ minWidth: "250px", maxWidth: "400px" }}
        >
            <span className="flex-grow font-medium">{message}</span>
            <button
                className="ml-4 text-white text-lg font-bold opacity-80 hover:opacity-100 transition-opacity"
                onClick={onClose}
            >
                ✖
            </button>
        </div>
    );
};



const useSnackbar = () => {
    const [snackbar, setSnackbar] = useState<{
        message: string;
        type: SnackbarType;
        show: boolean;
        duration: number;
    }>({
        message: "",
        type: "info",
        show: false,
        duration: 3000,
    });

    const showSnackbar = useCallback((message: string, type: SnackbarType = "info", duration: number = 3000) => {
        setSnackbar({ message, type, show: true, duration });

        setTimeout(() => {
            setSnackbar((prev) => ({ ...prev, show: false }));
        }, duration);
    }, []);

    const hideSnackbar = useCallback(() => {
        setSnackbar((prev) => ({ ...prev, show: false }));
    }, []);

    const SnackbarComponent = useCallback(() => (
        <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            show={snackbar.show}
            duration={snackbar.duration}
            onClose={hideSnackbar}
        />
    ), [snackbar, hideSnackbar]);

    return { showSnackbar, SnackbarComponent };
};

export default useSnackbar;

