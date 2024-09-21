import React, { useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { getObject, putFileObject } from '../lib/s3index';

interface UploadImageProps{
    setUrl:React.Dispatch<React.SetStateAction<string>>
}

const UploadImage:React.FC<UploadImageProps>= ({setUrl}) => {
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (files && files.length > 0) {
            const file = files[0];
            
            try {
                if (!file || file === undefined) {
                    throw new Error('File is null or undefined');
                }
                if (file.size > 10 * 1024 * 1024) { 
                    setSnackbarMessage('File size exceeds 10 MB. Please choose a smaller file.');
                    setSnackbarOpen(true);
                    return;
                }
                const url = await putFileObject(file.name,file.type);
                if (url) {
                    const response = await fetch(url,{
                        method:'PUT',
                        body: file,
                        headers: {
                            'Content-Type': file.type,
                        },
                    });
                    if (response.ok) {
                        const getUrl:string = await getObject(file.name);
                        setUrl(getUrl);
                        setSnackbarMessage('File uploaded successfully!');
                    } else {
                        setSnackbarMessage('Failed to upload file.');
                    }
                } else {
                    setSnackbarMessage('Failed to upload image.');
                }
            } catch (error) {
                setSnackbarMessage(`Failed to upload image. Please try again : ${error}`);
            } finally {
                setSnackbarOpen(true);
            }
        } else {
            setSnackbarMessage('No file selected.');
            setSnackbarOpen(true);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <div>
            <label htmlFor="file-upload">Upload Image</label>
            <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
            />
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarMessage.includes('success') ? 'success' : 'error'}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default UploadImage;
