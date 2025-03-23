'use client';
import React from "react";
import Square from "./square";
import useSnackbar from "../../components/snackbar"; 
import Board from "./board";
import ContextProvider from "./context";

const TicTacToe: React.FC = () => {
    

    return (
        <div className="flex items-center justify-center min-h-screen bg-blue-200 p-4">
            <div>
                <ContextProvider>
                    <Board/>
                </ContextProvider>
            </div>

        </div>
    );
};

export default TicTacToe;
