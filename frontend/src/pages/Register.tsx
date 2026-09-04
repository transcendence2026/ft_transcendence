import AuthSide from "./Auth/AuthSide";
import RegisterLeftSide from "./Auth/Register/RegisterLeftSide";

export default function Register() {
  return (
    <main className="h-screen w-full overflow-hidden bg-[#141312] font-serif text-[#e6e1df] lg:grid lg:grid-cols-2">
      <RegisterLeftSide />

      <AuthSide side="right" />
    </main>
  );
}
