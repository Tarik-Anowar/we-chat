import React, { useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface UploadImageProps {
    uploadPreset: string;
    cloudName: string;
    onUpload: (url: string) => void;
}

const UploadImage: React.FC<UploadImageProps> = ({ uploadPreset, cloudName, onUpload }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const uploadImage = async (imageFile: File, uploadPreset: string, cloudName: string): Promise<string | null> => {
        if (!imageFile) {
            throw new Error("No image file provided");
        }

        if (imageFile.type !== "image/jpeg" && imageFile.type !== "image/png") {
            throw new Error("Unsupported image type. Please upload a JPEG or PNG image.");
        }

        const data = new FormData();
        data.append("file", imageFile);
        data.append("upload_preset", uploadPreset);
        data.append("cloud_name", cloudName);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: data
            });

            const result = await response.json();
            return result.url as string;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (files && files.length > 0) {
            const file = files[0]; 

            try {
                if (file === null || file === undefined) {
                    throw new Error("File is null or undefined");
                }
                const url = await uploadImage(file, uploadPreset, cloudName);
                if (url) {
                    onUpload(url);
                    setSnackbarMessage('Image uploaded successfully!');
                } else {
                    setSnackbarMessage('Failed to upload image.');
                }
            } catch (error) {
                setSnackbarMessage('Failed to upload image. Please try again.');
            } finally {
                setSnackbarOpen(true);
                setImageFile(null); // Clear the file input
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
