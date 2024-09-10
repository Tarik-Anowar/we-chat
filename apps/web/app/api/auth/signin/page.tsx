"use client";
import React, { useEffect, useState } from 'react';
import { Button, TextField, Container, Typography, Box, Paper } from '@mui/material';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SignInPage: React.FC = () => {
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        const result = await signIn('credentials', {
            redirect: false,
            username: username,
            password: password,
            callbackUrl: "/",
        });

        if (result?.error) {
            alert(result.error);
        } else if (result?.ok && result?.url) {
            router.push(result.url);
        }
    };

    const handleGoogleSignIn = async () => {
        const result = await signIn('google', {
            redirect: false,
            callbackUrl: "/",
        });

        if (result?.error) {
            alert(result.error);
        } else if (result?.ok && result?.url) {
            router.push(result.url);
        }
    };

    if (!hydrated) {
        return null;
    }

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ padding: 3 }}>
                <Typography variant="h5" align="center">
                    Sign In
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Email"
                            name="username"
                            type="email"
                            autoComplete="email"
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                        >
                            Sign In
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="secondary"
                            onClick={handleGoogleSignIn}
                            sx={{ mt: 2 }}
                        >
                            Sign in with Google
                        </Button>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/api/auth/signup">
                                <Button variant="text">Sign Up</Button>
                            </Link>
                        </Typography>

                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default SignInPage;
