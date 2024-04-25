import Image from "next/image";
import Link from "next/link";

import { BackgroundBeams } from "@/components/background-beams";
import { Spotlight } from "@/components/spotlight";
import logo from "@/assets/logo.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col gap-6 items-center justify-center">
      <Spotlight />
      <BackgroundBeams className="-z-10" />
      <Link href="/" className="flex flex-col items-center gap-2">
        <Image
          src={logo}
          alt="Logo"
          width={64}
          className="border border-neutral-600 rounded-full"
        />
        <span className="text-neutral-950 dark:text-white font-bold text-xl">
          INAHEF 2024
        </span>
      </Link>
      {children}
    </div>
  );
}
