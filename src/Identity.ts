import { ethers } from "ethers";
import { Claim } from "./Claim";
import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import SafeAppsSDK, {SafeInfo} from "@gnosis.pm/safe-apps-sdk";

interface CustomWindow extends Window {
  ethereum: any;
}
declare var window: CustomWindow;

const opts = {
  allowedDomains: [/gnosis-safe.io/],
  debug: false
};

export class Identity {
  private static provider = async () => {
    const sdk = new SafeAppsSDK(opts);
    const safe = await Promise.race([
      sdk.safe.getInfo(),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject('Timed out');
        }, 1000);
      })
    ]).catch(() => alert('Please use this dApp only via your Gnosis Safe'));

    if (safe) {
      return new ethers.providers.Web3Provider(new SafeAppProvider(safe as SafeInfo, sdk));
    }
  };

  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  public async addClaim(claim: Claim): Promise<void> {
    const signer = await Identity.getSigner();

    if (!signer) {
      return;
    }

    const addClaimTx = await this.contract.connect(signer).addClaim(claim);

    await addClaimTx.wait();
  }

  public async removeClaim(claimIdentifier: string): Promise<void> {
    const signer = await Identity.getSigner();

    if (!signer) {
      return;
    }

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

    if (!signer) {
      return;
    }

    const functionSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);

    const executeTx = await this.contract.connect(signer).execute(0, targetAddress, ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });

    await executeTx.wait();
  }

  get address(): string {
    return this.contract.address;
  }

  private static async getSigner(): Promise<ethers.providers.JsonRpcSigner | undefined> {
    return (await this.provider())?.getSigner();
  }

  private static async getSignerAddress(): Promise<string | undefined> {
    const signer = await this.getSigner();
    return signer?.getAddress();
  }
}