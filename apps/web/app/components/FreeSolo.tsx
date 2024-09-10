import * as React from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';

interface FreeSoloProps {
    value: any;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FreeSolo: React.FC<FreeSoloProps> = ({ value, onChange }) => {
    return (
        <Stack 
            spacing={1} /* Reduced spacing between elements */
            sx={{ width: 200, height: 40 }} /* Smaller width and height */
        >
            <Autocomplete
                id="free-solo-demo"
                freeSolo
                options={value.map((option: any) => option.title)}
                renderInput={(params) => (
                    <TextField 
                        {...params}
                        label="Search"
                        onChange={onChange}
                        sx={{
                            '& .MuiInputBase-root': {
                                height: 35, /* Reduced height for input */
                                fontSize: '0.85rem', /* Smaller font size */
                            },
                            '& .MuiInputLabel-root': {
                                fontSize: '0.75rem', /* Smaller label font */
                            },
                        }}
                    />
                )}
            />
        </Stack>
    );
}

export default FreeSolo;
