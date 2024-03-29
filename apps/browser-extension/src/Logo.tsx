import logoImg from "../public/logo-full.png";

export default function Logo() {
  return (
    <span className="flex items-center justify-center">
      <img src={logoImg} alt="hoarder logo" className="h-10" />
    </span>
  );
}
