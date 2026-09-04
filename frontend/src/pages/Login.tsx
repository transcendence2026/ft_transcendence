import LoginLeftSide from "./Login/LoginLeftSide";
import LoginRightSide from "./Login/LoginRightSide";

export default function Login() {
  return (
    <main className="h-screen w-full overflow-hidden bg-[#141312] font-serif text-[#e6e1df] lg:grid lg:grid-cols-2">
      <LoginLeftSide />
      <LoginRightSide />
    </main>
  );
}
