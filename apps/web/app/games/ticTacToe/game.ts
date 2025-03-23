export const calculateWinner = (squares: (string | null)[]): string | null => {
    const row: number[][] = [[0, 0], [0, 0], [0, 0]];
    const col: number[][] = [[0, 0], [0, 0], [0, 0]];
    const d1: number[] = [0, 0];
    const d2: number[] = [0, 0];

    for (let i = 0; i < squares.length; i++) {
        if (squares[i] === null) continue;

        const r = Math.floor(i / 3);
        const c = i % 3;
        const id = squares[i] === 'X' ? 0 : 1;

        if (!row[r]) row[r] = [0, 0];
        if (!col[c]) col[c] = [0, 0];

        row[r][id] = (row[r][id] || 0) + 1;
        col[c][id] = (col[c][id] || 0) + 1;

        if (r === c) d1[id] = (d1[id] || 0) + 1;
        if (r + c === 2) d2[id] = (d2[id] || 0) + 1;

        if (row[r][id] === 3 || col[c][id] === 3 || d1[id] === 3 || d2[id] === 3) {
            return id === 0 ? 'X' : 'O';
        }
    }

    return null;
};




export const findBestMove = (squares: (string | null)[]): number | null => {
    let bestVal = -1000;
    let bestMove = { row: -1, col: -1 };

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (squares[i * 3 + j] === null) {
                let newSquares = [...squares];
                newSquares[i * 3 + j] = 'O';
                let moveVal = minMax(newSquares, 0, false);
                newSquares[i * 3 + j] = null;
                if (moveVal > bestVal) {
                    bestMove.row = i;
                    bestMove.col = j;
                    bestVal = moveVal;
                }
            }
        }
    }
    return bestMove.row * 3 + bestMove.col;
};

const calculateScore = (squares: (string | null)[]): number => {
    const winner = calculateWinner(squares);
    if (winner === 'O') return +10;
    else if (winner === 'X') return -10;
    return 0;
};
const minMax = (squares: (string | null)[], depth: number, isMax: boolean): number => {
    let score = calculateScore(squares);
    if(depth>10) return 0;
    if (score === 10) return score - depth;  
    if (score === -10) return score + depth; 
    if (!isMoveLeft(squares)) return 0;

    if (isMax) {
        let best = -1000;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (squares[i * 3 + j] === null) {
                    let newSquares = [...squares];
                    newSquares[i * 3 + j] = 'O';
                    best = Math.max(best, minMax(newSquares, depth + 1, !isMax));
                    newSquares[i * 3 + j] = null;
                }
            }
        }
        return best;
    } else {
        let best = 1000;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (squares[i * 3 + j] === null) {
                    let newSquares = [...squares];
                    newSquares[i * 3 + j] = 'X';
                    best = Math.min(best, minMax(newSquares, depth + 1, !isMax)); // Corrected to Math.min
                    newSquares[i * 3 + j] = null;
                }
            }
        }
        return best;
    }
};
const isMoveLeft = (squares: (string | null)[]): boolean => {
    return squares.includes(null);
};
