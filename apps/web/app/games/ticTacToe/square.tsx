import React from "react";
import "../../styles/globals.css"

interface SquareProps {
    value: string | null | undefined;
    onClick: () => void;
    isWinner?: boolean;
    resultColor?: string | null;
}

const Square: React.FC<SquareProps> = ({ value, onClick, isWinner = false, resultColor = null }) => {
    if(isWinner){
        
    }
    return (
        <div 
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => e.key === "Enter" && onClick()}
            className={`w-20 h-20 flex items-center justify-center border border-gray-400 
                       ${isWinner && resultColor ? `bg-${resultColor}-500` : 'bg-gray-800'} 
                       text-white text-3xl font-bold cursor-pointer 
                       hover:bg-gray-700 transition duration-200`}
        >
            {value !== null ? value : ""}
        </div>
    );
}

export default Square;
