'use client';
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Box, Popover } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import ChatHeader from '../chat/chatBoxHeader';
import styles from '../styles/appBar.module.css';
import UserAvatar from './Avatar';
import  '../styles/globals.css';

interface AppbarProps {
    setRenderOption: (option: string) => void;
}

const MyAppBar: React.FC<AppbarProps> = ({ setRenderOption }) => {
    const { data: session, status } = useSession();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'user-popover' : undefined;

    return (
        <AppBar position='static' className={styles.appBar}>
            <Toolbar>
                {status === "authenticated" && <Typography variant="h6" className={styles.chatHeader}>
                    <ChatHeader setRenderOption={setRenderOption} />
                </Typography>}

                {status === "authenticated" ? (
                    
                        <div className="flex items-center gap-4">
                          <div>
                            <Link href="/games" passHref>
                              <button type="button" className="text-lg p-2 hover:bg-blue-300 rounded-lg transition" title="Games">
                                🎮
                              </button>
                            </Link>
                          </div>
                          <button type='button' onClick={handleAvatarClick} className="flex items-center" title="User Avatar">
                            <UserAvatar
                              userId={session?.user?.id}
                              name={session?.user?.name}
                              imageUrl={session?.user?.image}
                              size={40}
                            />
                          </button>
                      
                          <Popover
                            id={id}
                            open={open}
                            anchorEl={anchorEl}
                            onClose={handleClose}
                            anchorOrigin={{
                              vertical: "bottom",
                              horizontal: "center",
                            }}
                            transformOrigin={{
                              vertical: "top",
                              horizontal: "center",
                            }}
                          >
                            <div className="p-4 bg-white rounded-lg shadow-lg min-w-[200px]">
                              <div className="text-center">
                                <h6 className="text-lg font-medium">{session?.user?.name}</h6>
                                <p className="text-sm text-gray-500">{session?.user?.email}</p>
                              </div>
                              <div className="mt-4 flex justify-center">
                                <UserAvatar
                                  userId={session?.user?.id}
                                  name={session?.user?.name}
                                  imageUrl={session?.user?.image}
                                  size={80}
                                />
                              </div>
                              <button
                                className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
                                onClick={() => signOut()}
                              >
                                Sign Out
                              </button>
                            </div>
                          </Popover>
                        </div>
                     
                      
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
