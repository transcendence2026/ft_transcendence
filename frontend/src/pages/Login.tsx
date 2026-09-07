import { useWebSocket } from "@/context/WebSocketContext";
import AuthSide from "./Auth/AuthSide";
import LoginRightSide from "./Auth/Login/LoginRightSide";
import { useEffect } from "react";

export default function Login() {

  const { status, messages } = useWebSocket();

  useEffect(() => {
    console.log("Statut WebSocket :", status);
  }, [status]);

  useEffect(() => {
    console.log("Messages reçus :", messages);
  }, [messages]);

  return (
    <main className="h-screen w-full overflow-hidden bg-[#141312] font-serif text-[#e6e1df] lg:grid lg:grid-cols-2">
      <AuthSide side="left" />
      <LoginRightSide />
    </main>
  );
}
