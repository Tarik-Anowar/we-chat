'use client';
import { useSession } from "next-auth/react";

const UserForm: React.FC = () => {
    const { data: session, status } = useSession();
    
    if (status === "authenticated") {
        return (
            <div>
                <h1>User Session</h1>
                {JSON.stringify(session?.user)}
            </div>
        );
    }

    return <p>Loading...</p>;
};

export default UserForm;
