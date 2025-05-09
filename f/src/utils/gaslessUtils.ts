// src/utils/gaslessUtils.ts
import { ethers } from 'ethers';
import { createPublicClient, http, createWalletClient, PublicClient } from 'viem';
import { avalanche } from 'viem/chains';
import { createSmartAccountClient } from '@0xgasless/smart-account';

// Define types based on ZeroXgaslessSmartAccount
interface Transaction {
  to: string;
  value: string | number | bigint;
  data?: string;
}

interface UserOpResponse {
  waitForTxHash: () => Promise<any>; // Use any to avoid UserOpStatus mismatch
  wait: () => Promise<{ success: string; receipt: any }>;
}

export interface GaslessSmartAccount {
  getAccountAddress: () => Promise<string>;
  sendTransaction: (
    manyOrOneTransactions: Transaction | Transaction[],
    buildUseropDto?: any // BuildUserOpOptions is not exported, use any
  ) => Promise<UserOpResponse>;
}

// Avalanche C-Chain configuration
export const avalancheChain = {
  ...avalanche,
  id: 43114,
  name: 'Avalanche C-Chain',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Snowtrace', url: 'https://snowtrace.io' },
  },
};

export const publicClient: PublicClient = createPublicClient({
  chain: avalancheChain,
  transport: http(),
});

// Get MetaMask provider
export const getMetaMaskProvider = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  return provider;
};

// Create smart account
export const createSmartAccount = async (signer: ethers.Signer): Promise<{
  client: GaslessSmartAccount;
  address: string;
}> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_0XGASLESS_API_KEY;
    if (!apiKey) {
      throw new Error('0xGasless API key is not set');
    }

    // Create viem wallet client from ethers signer
    const provider = signer.provider as ethers.BrowserProvider;
    const signerAddress = await signer.getAddress();
    const viemClient = createWalletClient({
      account: signerAddress as `0x${string}`,
      chain: avalancheChain,
      transport: http(),
    });

    // Create smart account client with 0xGasless paymaster
    const smartAccount = await createSmartAccountClient({
      signer: viemClient,
      bundlerUrl: `https://bundler.0xgasless.com/43114`, // Verify with 0xGasless
      paymasterUrl: `https://paymaster.0xgasless.com/v1/43114/rpc/${apiKey}`, // Include API key in URL
    });

    const smartAccountAddress = await smartAccount.getAccountAddress();

    return { client: smartAccount, address: smartAccountAddress };
  } catch (error) {
    console.error('Error creating smart account:', error);
    throw error;
  }
};

// Get balance
export const getSmartAccountBalance = async (address: string): Promise<string> => {
  try {
    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return '0';
  }
};