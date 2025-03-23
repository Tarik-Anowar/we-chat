"use client";
import React, { useEffect, useState } from "react";
import useSnackbar, { SnackbarType } from "../../components/snackbar";
import Square from "./square";
import { useGameState } from "./context";
import { calculateWinner, findBestMove } from "./game";

const Board: React.FC = () => {
    const { showSnackbar, SnackbarComponent } = useSnackbar();
    const { squares, setSquares, isXPlaying, setIsXPlaying, count, setCount } = useGameState();
    const [gameOver, setGameOver] = useState(false);
    const [winnerSquares, setWinnerSquares] = useState<number[]>([]);
    const [gameResultColor, setGameResultColor] = useState<string | null>(null);

    useEffect(() => {
        if (!isXPlaying) {
            const winner = calculateWinner(squares);
            if (winner !== null) {
                handleWinner(winner);
                return;
            }
    
            if (count === 9) {
                handleDraw();
                return;
            }
    
            const bestMove = findBestMove(squares);
            if (bestMove === null || bestMove === -1) {
                showSnackbar("Error: Computer couldn't find a move.", "error", 5000);
                return;
            }
    
            const newSquares = [...squares];
            newSquares[bestMove] = 'O';
            setSquares(newSquares);
            setCount(count + 1);
    
            const newWinner = calculateWinner(newSquares);
            if (newWinner) {
                handleWinner(newWinner, newSquares);
                return;
            }
    
            setIsXPlaying(true);
        }
    }, [isXPlaying]);
    

    useEffect(() => {
        if (gameOver) {
            const timeoutId = setTimeout(() => {
                handleRestart();
            }, 5000);
            return () => clearTimeout(timeoutId);
        }
    }, [gameOver]);

    const handleWinner = (winner: string, newSquares?: (string | null)[]) => {
        setGameOver(true);
        const type = winner === 'X' ? "success" : "error";
        const message = winner === 'X' ? "Congratulations, you won the match!" : "Oops, the opponent won.";
        showSnackbar(message, type, 5000);
    
        const winningCombinations: number[][] = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
    
        if(newSquares===undefined) return;
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if(a===undefined || b===undefined || c===undefined) return;

            if (a < 9 && b < 9 && c < 9 && newSquares[a] && newSquares[a] === newSquares[b] && newSquares[a] === newSquares[c]) {
                setWinnerSquares(combination);
                setGameResultColor(winner === 'X' ? 'green' : 'red');
                break;
            }
        }
    };
    
    const handleDraw = () => {
        setGameOver(true);
        let newSquares: number[] = [];
        for (let i = 0; i < 9; i++) {
            newSquares.push(i);
        }
        setWinnerSquares(newSquares);
        setGameResultColor('yellow');
        showSnackbar("The match is a draw.", "info", 5000);
    };

    const handleRestart = () => {
        setSquares(Array(9).fill(null));
        setIsXPlaying(true);
        setCount(0);
        setGameOver(false);
        setWinnerSquares([]);
        setGameResultColor(null);
    };

    const handleClick = (index: number) => {
        if (squares[index] !== null || !isXPlaying || gameOver) return;
    
        const newSquares = [...squares];
        newSquares[index] = 'X';
        setSquares(newSquares);
        setIsXPlaying(false);
        setCount(count + 1);
    
        if (count + 1 >= 5) {
            const winner = calculateWinner(newSquares);
            if (winner) {
                handleWinner(winner, newSquares); 
                return;
            }
        }
    
        if (count + 1 === 9) {
            handleDraw();
        }
    };
    

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-900 vw-100 p-10">
            <div className="grid grid-cols-3 gap-2 bg-gray-800 p-4 rounded-lg shadow-md">
                {squares.map((value, index) => (
                    <Square
                        key={index}
                        value={value}
                        onClick={() => handleClick(index)}
                        isWinner={winnerSquares.includes(index)}
                        resultColor={gameResultColor}
                    />
                ))}
            </div>
            {gameOver && (
                <div className="text-white mt-4">
                    {gameResultColor === 'green' ? 'You won!' : gameResultColor === 'red' ? 'Opponent won!' : 'It\'s a draw!'}
                </div>
            )}
            <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleRestart}>
                Play Again
            </button>
            <SnackbarComponent />
        </div>
    );
};

export default Board;
