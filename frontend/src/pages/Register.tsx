import AuthSide from "./Auth/AuthSide";
import RegisterLeftSide from "./Auth/Register/RegisterLeftSide";

export default function Register() {
  return (
    <main className="auth-page">
      <RegisterLeftSide />

      <AuthSide side="right" />
    </main>
  );
}
