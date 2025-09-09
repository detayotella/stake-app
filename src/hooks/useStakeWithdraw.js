import { useCallback } from "react";
import { createWalletClient, custom, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { STAKE_CONTRACT_ABI } from "../config/ABI";

function useStackWithdraw() {
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });

  const { address } = useAccount();

  const withdrawStake = useCallback(
    async (amount) => {
      if (!address) throw new Error("Wallet not connected");

      const bigAmount = parseEther(amount.toString());

      try {
        const txHash = await walletClient.writeContract({
          account: address,
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKE_CONTRACT_ABI,
          functionName: "withdraw",
          args: [bigAmount],
        });
        console.log("Transaction sent:", txHash);
        return txHash;
      } catch (err) {
        console.error("Withdraw failed:", err);
        throw err;
      }
    },
    [address, walletClient]
  );

  return { withdrawStake };
}

export default useStackWithdraw;
