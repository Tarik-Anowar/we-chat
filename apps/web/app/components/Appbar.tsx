'use client';
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import ChatHeader from '../chat/chatBoxHeader';
import styles from '../styles/appBar.module.css';

interface AppbarProps {
    setRenderOption: (option: string) => void;
}

const MyAppBar: React.FC<AppbarProps> = ({ setRenderOption }) => {
    const { data: session, status } = useSession();

    return (
        <AppBar position='static' className={styles.appBar}>
            <Toolbar>
                {status === "authenticated" && <Typography variant="h6" className={styles.chatHeader}>
                    <ChatHeader setRenderOption={setRenderOption} />
                </Typography>}

                {status === "authenticated" ? (
                    <Button color="inherit" onClick={() => signOut()}>
                        Sign Out
                    </Button>
                ) : (
                    <>
                        <Link href="/api/auth/signin" passHref>
                            <Button color="inherit" sx={{ marginRight: 1 }}>
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/api/auth/signup" passHref>
                            <Button color="inherit">Sign Up</Button>
                        </Link>
                    </>
                )}

                <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="menu"
                    className={styles.menuIcon}
                >
                    <MenuIcon />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
};

export default MyAppBar;
