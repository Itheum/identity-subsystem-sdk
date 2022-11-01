import { ethers } from "ethers";
import { SafeAppProvider } from "@gnosis.pm/safe-apps-provider";
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk";
const opts = {
    allowedDomains: [/gnosis-safe.io/],
    debug: false
};
const sdk = new SafeAppsSDK(opts);
const safe = await sdk.safe.getInfo();
console.log('Identity');
console.log('sdk', sdk);
console.log('safe', safe);
export class Identity {
    constructor(contract) {
        this.contract = contract;
    }
    async addClaim(claim) {
        console.log('Identity', 'addClaim');
        const signer = await Identity.getSigner();
        const addClaimTx = await this.contract.connect(signer).addClaim(claim);
        await addClaimTx.wait();
    }
    async removeClaim(claimIdentifier) {
        console.log('Identity', 'removeClaim');
        const signer = await Identity.getSigner();
        const addClaimTx = await this.contract.connect(signer).removeClaim(claimIdentifier);
        await addClaimTx.wait();
    }
    getClaims() {
        console.log('Identity', 'getClaims');
        return this.contract.getClaimIdentifier();
    }
    getClaimByIdentifier(claimIdentifier) {
        console.log('Identity', 'getClaimByIdentifier');
        return this.contract.claims(claimIdentifier);
    }
    getOwner() {
        console.log('Identity', 'getOwner');
        return this.contract.owner();
    }
    async execute(functionSignature, targetAddress, amountInEtherString, gasLimit) {
        console.log('Identity', 'execute');
        const signer = await Identity.getSigner();
        const functionSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);
        const executeTx = await this.contract.connect(signer).execute(0, targetAddress, ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });
        await executeTx.wait();
    }
    get address() {
        return this.contract.address;
    }
    static async getSigner() {
        return this.provider.getSigner();
    }
    static async getSignerAddress() {
        const signer = await this.getSigner();
        return signer.getAddress();
    }
}
Identity.provider = new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk));
