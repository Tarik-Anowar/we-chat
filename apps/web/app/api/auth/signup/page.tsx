'use client';
import { useState, FormEvent } from 'react';
import { TextField, Button, Box, Typography, Snackbar, Alert } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import signUpHandler from '../../../actions/sunbmitSignupData';
import UploadImage from '../../../components/uploadImage';
import styles from '../../../styles/signup.module.css'

const SignUp = () => {
  const router = useRouter(); 
  const [name, setName] = useState<string>('');
  const [username, setUserName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(''); 
  const [signUpSuccess, setSignUpSuccess] = useState<boolean | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setSnackbarMessage("Passwords don't match!");
      setSnackbarOpen(true);
      return;
    }
    
    const signUpData = {
      name,
      username,
      password,
      imageUrl, 
    };
    
    console.log('Sign-up data:', signUpData);
    
    try {
      const response = await signUpHandler(signUpData);
      console.log('Sign-up response:', response);

      if (response.ok) {
        setName('');
        setUserName('');
        setPassword('');
        setConfirmPassword('');
        setImageUrl('');
        setSnackbarMessage("Sign-up successful! Redirecting...");
        setSignUpSuccess(true);
        setSnackbarOpen(true);
        
        setTimeout(() => {
          router.push('/api/auth/signin');
        }, 2000); 
      } else {
        setSignUpSuccess(false);
        setSnackbarMessage("Sign-up failed. Please try again. "+response.error);
        console.error("Sign-up failed:", response.error);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      setSignUpSuccess(false);
      setSnackbarMessage("An error occurred during sign-up. Please try again.");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box className={styles.container}>
      <Typography variant="h5" component="h1" gutterBottom>
        Sign Up
      </Typography>
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextField
          label="Name"
          type="text"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Username"
          type="email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <UploadImage setUrl={setImageUrl}/>
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Sign Up
        </Button>
      </form>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Already have an account?{' '}
        <Link href="/api/auth/signin" passHref>
          <Button variant="text">Sign In</Button>
        </Link>
      </Typography>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={signUpSuccess ? 'success' : 'error'}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignUp;
