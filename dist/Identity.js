var _a;
import { ethers } from "ethers";
import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk";
const opts = {
    allowedDomains: [/gnosis-safe.io/],
    debug: false
};
export class Identity {
    constructor(contract) {
        this.contract = contract;
    }
    async addClaim(claim) {
        const signer = await Identity.getSigner();
        const addClaimTx = await this.contract.connect(signer).addClaim(claim);
        await addClaimTx.wait();
    }
    async removeClaim(claimIdentifier) {
        const signer = await Identity.getSigner();
        const addClaimTx = await this.contract.connect(signer).removeClaim(claimIdentifier);
        await addClaimTx.wait();
    }
    getClaims() {
        return this.contract.getClaimIdentifier();
    }
    getClaimByIdentifier(claimIdentifier) {
        return this.contract.claims(claimIdentifier);
    }
    getOwner() {
        return this.contract.owner();
    }
    async execute(functionSignature, targetAddress, amountInEtherString, gasLimit) {
        const signer = await Identity.getSigner();
        const functionSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);
        const executeTx = await this.contract.connect(signer).execute(0, targetAddress, ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });
        await executeTx.wait();
    }
    get address() {
        return this.contract.address;
    }
    static async getSigner() {
        return (await this.provider()).getSigner();
    }
    static async getSignerAddress() {
        const signer = await this.getSigner();
        return signer.getAddress();
    }
}
_a = Identity;
Identity.provider = async () => {
    const sdk = new SafeAppsSDK(opts);
    const safe = await sdk.safe.getInfo();
    if (!safe) {
        alert('Please use this dApp only via your Gnosis Safe');
    }
    return new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk));
};
