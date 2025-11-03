/** @format */
"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function Navbar() {
  return (
    <nav>
      <div className="w-full flex justify-between items-center bg-white px-8 py-4 shadow-md dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Sol Roast Arena
        </h1>
        <WalletMultiButton />
      </div>
    </nav>
  );
}

export default Navbar;
