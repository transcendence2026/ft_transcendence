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
    <main className="auth-page">
      <AuthSide side="left" />
      <LoginRightSide />
    </main>
  );
}
