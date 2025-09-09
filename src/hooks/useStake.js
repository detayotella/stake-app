import { useCallback, useEffect, useState } from "react";
import { createPublicClient, createWalletClient, custom, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { STAKE_CONTRACT_ABI, STAKE_TOKEN_ABI } from "../config/ABI";

function useStakeAmount() {
  const [balance, setBalance] = useState();
  const [address, setAddress] = useState();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });

  // Get connected wallet address
  useEffect(() => {
    async function getAddress() {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
    }
    getAddress();
  }, []);

  // Fetch ERC20 balance
  useEffect(() => {
    async function fetchBalance() {
      if (!address) return;
      try {
        const result = await publicClient.readContract({
          address: import.meta.env.VITE_STAKING_TOKEN,
          abi: STAKE_TOKEN_ABI,
          functionName: "balanceOf",
          args: [address],
        });
        setBalance(result);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    }
    fetchBalance();
  }, [address, publicClient]);

  // Check if wallet is on Sepolia
  const ensureSepolia = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet found");
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== "0xaa36a7") { // Sepolia chainId in hex
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (switchError) {
        throw new Error("Please switch to Sepolia network in your wallet");
      }
    }
  }, []);

  // Approve tokens for staking
  const approve = useCallback(
    async (amount) => {
      if (!address) throw new Error("Wallet not connected");

      await ensureSepolia();

      const bigAmount = parseEther(amount.toString());

      try {
        const txHash = await walletClient.writeContract({
          account: address,
          address: import.meta.env.VITE_STAKING_TOKEN,
          abi: STAKE_TOKEN_ABI,
          functionName: "approve",
          args: [import.meta.env.VITE_STAKING_CONTRACT, bigAmount],
        });
        console.log("Approval tx sent:", txHash);
        await walletClient.waitForTransactionReceipt({ hash: txHash });
        console.log("Approval mined ✅");
        return txHash;
      } catch (err) {
        console.error("Approval failed:", err);
        throw err;
      }
    },
    [address, walletClient, ensureSepolia]
  );

  // Stake tokens
  const stake = useCallback(
    async (amount) => {
      if (!address) throw new Error("Wallet not connected");

      await ensureSepolia();

      const bigAmount = parseEther(amount.toString());

      try {
        const txHash = await walletClient.writeContract({
          account: address,
          address: import.meta.env.VITE_STAKING_CONTRACT,
          abi: STAKE_CONTRACT_ABI,
          functionName: "stake",
          args: [bigAmount],
        });
        console.log("Stake tx sent:", txHash);
        await walletClient.waitForTransactionReceipt({ hash: txHash });
        console.log("Stake mined ✅");
        return txHash;
      } catch (err) {
        console.error("Staking failed:", err);
        throw err;
      }
    },
    [address, walletClient, ensureSepolia]
  );

  // Combined approve and stake
  const approveAndStake = useCallback(
    async (amount) => {
      await approve(amount);
      await stake(amount);
    },
    [approve, stake]
  );

  return { balance, address, approve, stake, approveAndStake };
}

export default useStakeAmount;
