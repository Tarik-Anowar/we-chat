"use client";
import React, { createContext, useContext, useState,ReactNode } from "react";


export interface GameContextType{
    squares:(string|null)[];
    setSquares: React.Dispatch<React.SetStateAction<(string | null)[]>>;
    isXPlaying: boolean;
    setIsXPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    count: number;
    setCount: React.Dispatch<React.SetStateAction<number>>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);
interface ContextProviderProps {
    children: ReactNode;
}

const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
    const [squares, setSquares] = useState(Array(9).fill(null));
    const [isXPlaying, setIsXPlaying] = useState(true);
    const [count, setCount] = useState(0);
    return (
        <GameContext.Provider value={{ squares, setSquares,isXPlaying, setIsXPlaying,count, setCount }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameState = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGameState must be used within a ContextProvider");
    }
    return context;
};

export default ContextProvider;