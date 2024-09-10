'use client';
import './page.css'; 
import MyAppBar from "./components/Appbar";
import ChatBox from "./chat/chatPage";
import { useState } from "react";

const Home: React.FC = () => {
  const [renderOption, setRenderOption] = useState('all-chats');
  
  return (
    <div className="homePage">
      <MyAppBar setRenderOption={setRenderOption} />
      <div className="content">
        <ChatBox renderOption={renderOption} />
      </div>
    </div>
  );
};

export default Home;
