import AuthSide from "./Auth/AuthSide";
import LoginRightSide from "./Auth/Login/LoginRightSide";

export default function Login() {
  return (
    <main className="h-screen w-full overflow-hidden bg-[#141312] font-serif text-[#e6e1df] lg:grid lg:grid-cols-2">
      <AuthSide side="left" />
      <LoginRightSide />
    </main>
  );
}
