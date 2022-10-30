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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identity = void 0;
const ethers_1 = require("ethers");
const safe_apps_provider_1 = require("@gnosis.pm/safe-apps-provider");
const safe_apps_sdk_1 = __importDefault(require("@gnosis.pm/safe-apps-sdk"));
const opts = {
    allowedDomains: [/gnosis-safe.io/],
    debug: false
};
let sdk, safe;
(() => __awaiter(void 0, void 0, void 0, function* () {
    sdk = new safe_apps_sdk_1.default(opts);
    safe = yield sdk.safe.getInfo();
}))();
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
    getClaimByIdentifier(claimIdentifier) {
        return this.contract.claims(claimIdentifier);
    }
    getOwner() {
        return this.contract.owner();
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
Identity.provider = new ethers_1.ethers.providers.Web3Provider(new safe_apps_provider_1.SafeAppProvider(safe, sdk));
