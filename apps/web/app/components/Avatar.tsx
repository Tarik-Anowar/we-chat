import { Avatar } from "@mui/material";
import { styled } from "@mui/material/styles";

interface UserAvatarProps {
    userId: string;
    name: string;
    imageUrl?: string;
    size?: number; 
}

const StyledAvatar = styled(Avatar)(({ size }: { size?: number }) => ({
    width: size || 40,
    height: size || 40,
}));

const UserAvatar: React.FC<UserAvatarProps> = ({ userId, name, imageUrl, size }) => {
    console.log(imageUrl)
    return (
        <StyledAvatar size={size} src={imageUrl}>
            {!imageUrl ? name?.charAt(0).toUpperCase() : null}
        </StyledAvatar>
    );
}

export default UserAvatar;
