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
        if (!signer) {
            return;
        }
        const addClaimTx = await this.contract.connect(signer).addClaim(claim);
        await addClaimTx.wait();
    }
    async removeClaim(claimIdentifier) {
        const signer = await Identity.getSigner();
        if (!signer) {
            return;
        }
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
        if (!signer) {
            return;
        }
        const functionSignatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);
        const executeTx = await this.contract.connect(signer).execute(0, targetAddress, ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });
        await executeTx.wait();
    }
    get address() {
        return this.contract.address;
    }
    static async getSigner() {
        var _b;
        return (_b = (await this.provider())) === null || _b === void 0 ? void 0 : _b.getSigner();
    }
    static async getSignerAddress() {
        const signer = await this.getSigner();
        return signer === null || signer === void 0 ? void 0 : signer.getAddress();
    }
}
_a = Identity;
Identity.provider = async () => {
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
        return new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk));
    }
};
