"use client";
import { useRouter } from "next/navigation";
import "../styles/globals.css";
import User from "../model/userModel";
import { debounce, Dialog, DialogTitle } from "@mui/material";
import { searchUser } from "../actions/serverActions";
import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { Types } from "mongoose";
const games = [
    { id: "ticTacToe", name: "Tic Tac Toe", gradient: "from-green-600 to-yellow-600", maxPlayer: 2 },
    { id: "chess", name: "Chess", gradient: "from-gray-600 to-gray-900", maxPlayer: 2 },
    { id: "football", name: "Football", gradient: "from-blue-500 to-gray-900", maxPlayer: 2 },
    { id: "snake", name: "Snake", gradient: "from-yellow-400 to-yellow-800", maxPlayer: 2 },

];

interface SUser {
    _id: string;
    username: string;
    name: string;
    image?: string;
}

const debouncedSearch = debounce(

    async (value: string, setSearchedUsers: React.Dispatch<React.SetStateAction<SUser[]>>) => {
        try {
            if (value !== '') {
                const users: SUser[] = await searchUser({ value });
                setSearchedUsers(users);
            }
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchedUsers([]);
        }
    },
    300
);

const GamePage: React.FC = () => {
    const router = useRouter();

    const [searchedUsers, setSearchedUsers] = useState<SUser[]>([]);
    const { data: session, status } = useSession();
    const [selectedPlayers, setSelectedPlayers] = useState<SUser[]>([]);
    const selectedPlayerIds: string[] = [];
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<{ id: string; maxPlayer: number } | null>(null);


    const handleSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            if (status === 'authenticated' && value.trim() !== '') {
                debouncedSearch(value, setSearchedUsers);
            } else {
                setSearchedUsers([]);
            }
        },
        [session?.user.id]
    );

    const handleSelectPlayer = (player: SUser) => {
        if (selectedPlayers.some((p) => p._id === player._id)) {
            return;
        }
        if (selectedPlayers.length < (selectedGame?.maxPlayer ?? 0) - 1) {
            setSelectedPlayers([...selectedPlayers, player]);
        }
    };

    const handlePlayWithBot = () => {
        console.log("Playing with bot");
        setModalIsOpen(false);
      };

    const handleRemovePlayer = (payerId: string) => {
        setSelectedPlayers(selectedPlayers.filter((p) => p._id !== payerId));
    }

    const handleOpenModal = (game:{id:string;maxPlayer:number})=>{
        setSelectedGame(game);
        setModalIsOpen(true);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-purple-600 to-white-600 p-6">
            <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
                🎮 Game Zone
            </h1>
            <p className="text-lg text-gray-200 mt-2">
                Select a game and start playing!
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                {games.map((game) => (
                    <div
                        key={game.id}
                        className={`rounded-xl shadow-xl p-6 text-center bg-gradient-to-br ${game.gradient} transform transition duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer`}
                        onClick={() => router.push(`/games/${game.id}`)}
                    >
                        <h2 className="text-3xl font-bold text-white drop-shadow-md">{game.name}</h2>
                        <button
                            type="button"
                            className="mt-4 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-md hover:from-indigo-600 hover:to-blue-500 transition duration-200"
                        >
                            Play 🎮
                        </button>
                    </div>
                ))}
            </div>

            <Dialog open={modalIsOpen} onClose={()=>setModalIsOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Selected Players or Play with Bot</DialogTitle>
            </Dialog>

        </div>
    );
};

export default GamePage;
