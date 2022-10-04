import { ethers } from "ethers";
import {Claim} from "./Claim";

interface CustomWindow extends Window {
  ethereum: any;
}
declare var window: CustomWindow;

export class Identity {
  private static provider = new ethers.providers.Web3Provider(window.ethereum);

  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  public async addClaim(claim: Claim): Promise<void> {
    const signer = await Identity.getSigner();

    const addClaimTx = await this.contract.connect(signer).addClaim(claim);

    await addClaimTx.wait();
  }

  public async getClaims(): Promise<string[]> {
    const claims: string[] = [];

    const claimAddedEvents = await this.contract.queryFilter('ClaimAdded', 0);
    const claimRemovedEvents = await this.contract.queryFilter('ClaimRemoved', 0);

    claims.push(...claimAddedEvents.map(ele => ele.args![0]));

    claimRemovedEvents
      .map(ele => ele.args![0])
      .forEach(ele => {
        const index = claims.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) claims.splice(index, 1);
      });
    return claims;
  }

  public async getOwners(): Promise<string[]> {
    const owners = [await this.contract.owner()];

    const additionalOwnerAddedEvents = await this.contract.queryFilter('AdditionalOwnerAdded', 0);
    const additionalOwnerRemovedEvents = await this.contract.queryFilter('AdditionalOwnerRemoved', 0);

    owners.push(...additionalOwnerAddedEvents.map(ele => ele.args![1]));

    additionalOwnerRemovedEvents
      .map(ele => ele.args![1])
      .forEach(ele => {
        const index = owners.findIndex(eleToFind => eleToFind === ele);
        if (index >= 0) owners.splice(index, 1);
      });
    return owners;
  }

  public async getOwnerRemovalConfirmations(): Promise<{ address: string, count: number }[]> {
    const confirmations = [];

    const owners = await this.getOwners();

    for (const owner of owners) {
      const count = await this.contract.removeAdditionalOwnerConfirmationCount(owner);
      confirmations.push(count);
    }
    return confirmations;
  }

  public async addAdditionalOwner(address: string): Promise<void> {
    const signer = await Identity.getSigner();

    const addAdditionalOwnerTx = await this.contract.connect(signer).addAdditionalOwner(address);

    await addAdditionalOwnerTx.wait();
  }

  public async proposeAdditionalOwnerRemoval(address: string): Promise<void> {
    const signer = await Identity.getSigner();

    const proposeAdditionalOwnerRemovalTx = await this.contract.connect(signer).proposeAdditionalOwnerRemoval(address);

    await proposeAdditionalOwnerRemovalTx.wait();
  }

  public async removeAdditionalOwner(address: string): Promise<void> {
    const signer = await Identity.getSigner();

    const removeAdditionalOwnerTx = await this.contract.connect(signer).removeAdditionalOwner(address);

    await removeAdditionalOwnerTx.wait();
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