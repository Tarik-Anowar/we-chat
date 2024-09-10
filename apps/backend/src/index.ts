import http from 'http';
import SocketService from './services/socket';

const init = async (): Promise<void> => {
    const socketService = new SocketService();
    const httpServer = http.createServer();
    const PORT = process.env.PORT || 8000;

    socketService.io.attach(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`HTTP server is running on http://127.0.0.1:${PORT}`);
    });

    socketService.initListeners();
}

init();
