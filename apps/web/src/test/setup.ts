import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock wagmi
vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: () => ({ address: undefined, isConnected: false }),
    useConnect: () => ({ connect: vi.fn(), isPending: false }),
    useDisconnect: () => ({ disconnect: vi.fn() }),
    useReadContract: () => ({ data: undefined, isLoading: false }),
    useWriteContract: () => ({ writeContract: vi.fn(), data: undefined, isPending: false, error: null, reset: vi.fn() }),
    useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: false }),
  };
});

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_t, tag) => {
      const C = ({ children, ...props }: React.PropsWithChildren<object>) => {
        const React = require("react");
        return React.createElement(tag as string, props, children);
      };
      return C;
    },
  }),
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));
