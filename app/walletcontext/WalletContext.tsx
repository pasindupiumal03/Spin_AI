'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

type WalletContextType = {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  connecting: boolean;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (arg: any) => void) => void;
      off: (event: string, callback: (arg: any) => void) => void;
    };
  }
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({
  children,
}: WalletProviderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleConnect = () => {
      console.log('Connected to Phantom wallet');
    };

    const handleDisconnect = () => {
      console.log('Disconnected from Phantom wallet');
      setWalletAddress(null);
      localStorage.removeItem('walletAddress');
    };

    // Only set up event listeners if solana is available
    if (window.solana) {
      window.solana.on('connect', handleConnect);
      window.solana.on('disconnect', handleDisconnect);

      // Cleanup
      return () => {
        window.solana?.off('connect', handleConnect);
        window.solana?.off('disconnect', handleDisconnect);
      };
    }
    
    // Return empty cleanup function if solana is not available
    return () => {};
  }, []);

  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const shouldAutoConnect = localStorage.getItem('autoConnect') === 'true';

    if (savedAddress && shouldAutoConnect && window.solana?.isPhantom) {
      console.log('Attempting auto-connect to Phantom wallet');
      window.solana
        .connect({ onlyIfTrusted: true })
        .then((resp) => {
          const address = resp.publicKey.toString();
          if (address === savedAddress) {
            setWalletAddress(address);
          } else {
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('autoConnect');
          }
        })
        .catch((error) => {
          console.error('Auto-connect failed:', error);
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('autoConnect');
        });
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.solana) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setConnecting(true);
    
    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();
      
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('autoConnect', 'true');
      
      console.log('Connected to wallet:', address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    if (typeof window !== 'undefined' && window.solana) {
      window.solana.disconnect().catch(console.error);
    }
    setWalletAddress(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('autoConnect');
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        disconnectWallet,
        connecting,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}