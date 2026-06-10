import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Address,
  type Account,
  parseEther,
} from "viem";
import { celo, celoAlfajores } from "viem/chains";

import { VEILD_REGISTRY_ABI } from "./abis/registry.js";
import { VEILD_MESSAGES_ABI } from "./abis/messages.js";
import { getAddresses, type ChainAddresses } from "./addresses.js";
import type {
  Creator,
  Message,
  WallPost,
  InboxStats,
  RegisterCreatorParams,
  SendMessageParams,
  SendPriorityMessageParams,
  ReplyParams,
  WriteResult,
} from "./types.js";

// ─── Config ───────────────────────────────────────────────────────────────────

export interface VeildClientConfig {
  /**
   * A viem PublicClient for read calls.
   * If omitted, one is created using the default Celo RPC.
   */
  publicClient?: PublicClient;
  /**
   * A viem WalletClient for write calls.
   * Required for any transaction-sending method.
   */
  walletClient?: WalletClient;
  /**
   * Override the chain. Defaults to celo (mainnet).
   */
  chain?: Chain;
  /**
   * Override the RPC URL used when creating a default publicClient.
   */
  rpcUrl?: string;
}

// ─── VeildClient ──────────────────────────────────────────────────────────────

export class VeildClient {
  readonly publicClient: PublicClient;
  readonly walletClient?: WalletClient;
  private readonly addrs: ChainAddresses;
  private readonly chain: Chain;

  constructor(config: VeildClientConfig = {}) {
    this.chain = config.chain ?? celo;
    this.addrs = getAddresses(this.chain.id);

    this.publicClient =
      config.publicClient ??
      createPublicClient({
        chain: this.chain,
        transport: http(config.rpcUrl),
      });

    this.walletClient = config.walletClient;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private requireWallet(): WalletClient & { account: Account } {
    if (!this.walletClient?.account) {
      throw new Error(
        "VeildClient: a walletClient with a connected account is required for write operations."
      );
    }
    return this.walletClient as WalletClient & { account: Account };
  }

  private async submitTx(hash: `0x${string}`): Promise<WriteResult> {
    return {
      hash,
      wait: () => this.publicClient.waitForTransactionReceipt({ hash }),
    };
  }

  // ─── Registry reads ─────────────────────────────────────────────────────────

  async isRegistered(address: Address): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.addrs.registry,
      abi:     VEILD_REGISTRY_ABI,
      functionName: "isRegistered",
      args:    [address],
    }) as Promise<boolean>;
  }

  async getCreator(address: Address): Promise<Creator> {
    return this.publicClient.readContract({
      address: this.addrs.registry,
      abi:     VEILD_REGISTRY_ABI,
      functionName: "getCreator",
      args:    [address],
    }) as Promise<Creator>;
  }

  async getCreatorByUsername(
    username: string
  ): Promise<{ addr: Address; creator: Creator }> {
    const result = await this.publicClient.readContract({
      address: this.addrs.registry,
      abi:     VEILD_REGISTRY_ABI,
      functionName: "getCreatorByUsername",
      args:    [username],
    });
    const [addr, creator] = result as [Address, Creator];
    return { addr, creator };
  }

  async getTotalCreators(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.addrs.registry,
      abi:     VEILD_REGISTRY_ABI,
      functionName: "totalCreators",
      args:    [],
    }) as Promise<bigint>;
  }

  async getRegistrationFee(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.addrs.registry,
      abi:     VEILD_REGISTRY_ABI,
      functionName: "registrationFee",
      args:    [],
    }) as Promise<bigint>;
  }

  // ─── Registry writes ────────────────────────────────────────────────────────

  async registerCreator(params: RegisterCreatorParams): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const fee    = params.value ?? (await this.getRegistrationFee());

    const hash = await wallet.writeContract({
      address: this.addrs.registry,
      abi:     VEILD_REGISTRY_ABI,
      functionName: "register",
      args:    [params.username, params.name, params.bio, params.avatarCID, params.category],
      value:   fee,
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  async updateProfile(
    params: Pick<RegisterCreatorParams, "name" | "bio" | "avatarCID" | "category">
  ): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const hash   = await wallet.writeContract({
      address: this.addrs.registry,
      abi:     VEILD_REGISTRY_ABI,
      functionName: "updateProfile",
      args:    [params.name, params.bio, params.avatarCID, params.category],
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  // ─── Messages reads ─────────────────────────────────────────────────────────

  async getPriorityFee(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "priorityFee",
      args:    [],
    }) as Promise<bigint>;
  }

  async getInbox(creatorAddress: Address): Promise<Message[]> {
    return this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "getInbox",
      args:    [creatorAddress],
    }) as Promise<Message[]>;
  }

  async getMessage(creatorAddress: Address, index: bigint): Promise<Message> {
    return this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "getMessage",
      args:    [creatorAddress, index],
    }) as Promise<Message>;
  }

  async getWall(creatorAddress: Address): Promise<WallPost[]> {
    return this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "getWall",
      args:    [creatorAddress],
    }) as Promise<WallPost[]>;
  }

  async getInboxStats(creatorAddress: Address): Promise<InboxStats> {
    return this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "getInboxStats",
      args:    [creatorAddress],
    }) as Promise<InboxStats>;
  }

  async getEarnings(creatorAddress: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "getEarnings",
      args:    [creatorAddress],
    }) as Promise<bigint>;
  }

  async getLengths(
    creatorAddress: Address
  ): Promise<{ inboxLen: bigint; wallLen: bigint }> {
    const result = await this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "getLengths",
      args:    [creatorAddress],
    });
    const [inboxLen, wallLen] = result as [bigint, bigint];
    return { inboxLen, wallLen };
  }

  async hasLiked(
    creatorAddress: Address,
    wallIndex: bigint,
    userAddress: Address
  ): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "hasLiked",
      args:    [creatorAddress, wallIndex, userAddress],
    }) as Promise<boolean>;
  }

  // ─── Messages writes ────────────────────────────────────────────────────────

  async sendMessage(params: SendMessageParams): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const hash   = await wallet.writeContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "sendMessage",
      args:    [params.creatorAddress, params.content],
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  async sendPriorityMessage(
    params: SendPriorityMessageParams
  ): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const fee    = params.fee ?? (await this.getPriorityFee());
    const hash   = await wallet.writeContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "sendPriorityMessage",
      args:    [params.creatorAddress, params.content],
      value:   fee,
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  async replyToMessage(params: ReplyParams): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const hash   = await wallet.writeContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "replyToMessage",
      args:    [params.messageIndex, params.reply, params.publishToWall],
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  async publishToWall(messageIndex: bigint): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const hash   = await wallet.writeContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "publishToWall",
      args:    [messageIndex],
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  async archiveMessage(messageIndex: bigint): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const hash   = await wallet.writeContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "archiveMessage",
      args:    [messageIndex],
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  async likeWallPost(
    creatorAddress: Address,
    wallIndex: bigint
  ): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const hash   = await wallet.writeContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "likeWallPost",
      args:    [creatorAddress, wallIndex],
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }

  async claimEarnings(): Promise<WriteResult> {
    const wallet = this.requireWallet();
    const hash   = await wallet.writeContract({
      address: this.addrs.messages,
      abi:     VEILD_MESSAGES_ABI,
      functionName: "claimEarnings",
      args:    [],
      account: wallet.account,
      chain:   this.chain,
    });
    return this.submitTx(hash);
  }
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

/** Create a read-only client (no wallet needed). */
export function createReadonlyClient(rpcUrl?: string): VeildClient {
  return new VeildClient({ rpcUrl });
}

/** Create a read-only client for Alfajores testnet. */
export function createTestnetClient(rpcUrl?: string): VeildClient {
  return new VeildClient({
    chain:  celoAlfajores,
    rpcUrl: rpcUrl ?? "https://alfajores-forno.celo-testnet.org",
  });
}
