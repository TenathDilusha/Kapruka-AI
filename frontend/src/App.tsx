import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ChatApp } from "@/components/chat/ChatApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatApp key="welcome" />} />
        <Route path="/chat" element={<ChatApp key="chat" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
