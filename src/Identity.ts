import { ethers } from "ethers";
import { Claim } from "./Claim";
import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import SafeAppsSDK, { SafeInfo } from "@gnosis.pm/safe-apps-sdk";

interface CustomWindow extends Window {
  ethereum: any;
}
declare var window: CustomWindow;

const opts = {
  allowedDomains: [/gnosis-safe.io/],
  debug: false
};

let sdk: SafeAppsSDK, safe: SafeInfo;

(async () => {
  sdk = new SafeAppsSDK(opts);
  safe = await sdk.safe.getInfo();
})();

export class Identity {
  private static provider = new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk));

  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  public async addClaim(claim: Claim): Promise<void> {
    const signer = await Identity.getSigner();

    const addClaimTx = await this.contract.connect(signer).addClaim(claim);

    await addClaimTx.wait();
  }

  public async removeClaim(claimIdentifier: string): Promise<void> {
    const signer = await Identity.getSigner();

    const addClaimTx = await this.contract.connect(signer).removeClaim(claimIdentifier);

    await addClaimTx.wait();
  }

  public getClaims(): Promise<string[]> {
    return this.contract.getClaimIdentifier();
  }

  public getClaimByIdentifier(claimIdentifier: string): Promise<Claim> {
    return this.contract.claims(claimIdentifier);
  }

  public getOwner(): Promise<string[]> {
    return this.contract.owner();
  }

  public async execute(functionSignature: string, targetAddress: string, amountInEtherString: string, gasLimit: number): Promise<void> {
    const signer = await Identity.getSigner();

    const functionSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);

    const executeTx = await this.contract.connect(signer).execute(0, targetAddress, ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });

    await executeTx.wait();
  }

  get address(): string {
    return this.contract.address;
  }

  private static async getSigner(): Promise<ethers.providers.JsonRpcSigner> {
    await this.provider.send("eth_requestAccounts", []);
    return this.provider.getSigner();
  }

  private static async getSignerAddress(): Promise<string> {
    const signer = await this.getSigner();
    return signer.getAddress();
  }
}