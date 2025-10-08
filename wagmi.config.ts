import { defineConfig } from "@wagmi/cli";
import { actions } from "@wagmi/cli/plugins";
import { Abi } from "viem";
import { abi as SafeModuleManagerABI } from "./out/SafeModuleManager.sol/SafeModuleManager.json";
import { abi as ManagedSafeModuleABI } from "./out/ManagedSafeModule.sol/ManagedSafeModule.json";
import { abi as SyncGroupRegistryABI } from "./out/SyncGroupRegistry.sol/SyncGroupRegistry.json";

export default defineConfig({
  out: "src/lib/generated.ts",
  contracts: [
    {
      name: "SafeModuleManager",
      abi: SafeModuleManagerABI as Abi,
    },
    {
      name: "ManagedSafeModule",
      abi: ManagedSafeModuleABI as Abi,
    },
    {
      name: "SyncGroupRegistry",
      abi: SyncGroupRegistryABI as Abi,
    },
  ],
  plugins: [
    actions({
      readContract: true,
      writeContract: true,
      prepareWriteContract: false,
      getContract: false,
      watchContractEvent: false,
    }),
  ],
});
