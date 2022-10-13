"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identity = void 0;
const ethers_1 = require("ethers");
class Identity {
    constructor(contract) {
        this.contract = contract;
    }
    addClaim(claim) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield Identity.getSigner();
            const addClaimTx = yield this.contract.connect(signer).addClaim(claim);
            yield addClaimTx.wait();
        });
    }
    removeClaim(claimIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield Identity.getSigner();
            const addClaimTx = yield this.contract.connect(signer).removeClaim(claimIdentifier);
            yield addClaimTx.wait();
        });
    }
    getClaims() {
        return this.contract.getClaimIdentifier();
    }
    getOwners() {
        return this.contract.getOwners();
    }
    getOwnerRemovalConfirmations() {
        return __awaiter(this, void 0, void 0, function* () {
            const confirmations = [];
            const owners = yield this.getOwners();
            for (const owner of owners) {
                const count = yield this.contract.removeOwnerConfirmationCount(owner);
                confirmations.push(count);
            }
            return confirmations;
        });
    }
    addOwner(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield Identity.getSigner();
            const addOwnerTx = yield this.contract.connect(signer).addOwner(address);
            yield addOwnerTx.wait();
        });
    }
    proposeOwnerRemoval(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield Identity.getSigner();
            const proposeOwnerRemovalTx = yield this.contract.connect(signer).proposeOwnerRemoval(address);
            yield proposeOwnerRemovalTx.wait();
        });
    }
    removeOwner(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield Identity.getSigner();
            const removeOwnerTx = yield this.contract.connect(signer).removeOwner(address);
            yield removeOwnerTx.wait();
        });
    }
    execute(functionSignature, targetAddress, amountInEtherString, gasLimit) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield Identity.getSigner();
            const functionSignatureHash = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);
            const executeTx = yield this.contract.connect(signer).execute(0, targetAddress, ethers_1.ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });
            yield executeTx.wait();
        });
    }
    get address() {
        return this.contract.address;
    }
    static getSigner() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.provider.send("eth_requestAccounts", []);
            return this.provider.getSigner();
        });
    }
    static getSignerAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield this.getSigner();
            return signer.getAddress();
        });
    }
}
exports.Identity = Identity;
Identity.provider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
