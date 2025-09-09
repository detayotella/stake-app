import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";


export const config = getDefaultConfig({
    appName: "stake_app",
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    chains: [sepolia],
});

