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
exports.IdentityFactory = void 0;
const constants_1 = require("./constants");
const Identity_1 = require("./Identity");
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
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
class IdentityFactory {
    constructor(contract) {
        this.contract = contract;
    }
    static init(address) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.provider.send("eth_requestAccounts", []);
            const signer = yield this.getSigner();
            if (address) {
                return new IdentityFactory(new ethers_1.ethers.Contract(address, constants_1.IdentityFactoryContractAbi, signer));
            }
            else {
                const contractFactory = new ethers_1.ethers.ContractFactory(constants_1.IdentityFactoryContractAbi, constants_1.IdentityFactoryContractByteCode, signer);
                return new IdentityFactory(yield contractFactory.deploy());
            }
        });
    }
    getIdentitiesByTheGraph() {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield IdentityFactory.getSigner();
            const signerAddress = yield signer.getAddress();
            const getIdentityDeployedEntitiesForAddressQuery = {
                query: `{
        identityDeployedEntities(where: {owner: "${signerAddress}"}) {
          contract
          unixTimestamp
        }
      }`,
            };
            const identityDeployedResponse = (yield axios_1.default.post(constants_1.SUB_GRAPH_API_URL, getIdentityDeployedEntitiesForAddressQuery)).data;
            const identityAddresses = identityDeployedResponse.data.identityDeployedEntities.map((ele) => ele.contract);
            return identityAddresses.map(address => new Identity_1.Identity(new ethers_1.ethers.Contract(address, constants_1.identityContractAbi, signer)));
        });
    }
    getIdentities() {
        return __awaiter(this, void 0, void 0, function* () {
            let identityDeployedEvents = yield this.contract.queryFilter('IdentityDeployed', 0);
            const signer = yield IdentityFactory.getSigner();
            const signerAddress = yield signer.getAddress();
            const identityDeployedEventsForSignerAddress = identityDeployedEvents.filter(event => event.args && event.args[1] === signerAddress);
            let identityAddresses = identityDeployedEventsForSignerAddress.length > 0 ? identityDeployedEventsForSignerAddress.map(event => event.args[0]) : [];
            return identityAddresses.map(address => new Identity_1.Identity(new ethers_1.ethers.Contract(address, constants_1.identityContractAbi, signer)));
        });
    }
    deployIdentity() {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield IdentityFactory.getSigner();
            const deployIdentityTx = yield this.contract.connect(signer).deployIdentity();
            const deployIdentityTxResult = yield deployIdentityTx.wait();
            const identityContractAddress = deployIdentityTxResult.events[0].address;
            return new Identity_1.Identity(new ethers_1.ethers.Contract(identityContractAddress, constants_1.identityContractAbi, signer));
        });
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
exports.IdentityFactory = IdentityFactory;
IdentityFactory.provider = new ethers_1.ethers.providers.Web3Provider(new safe_apps_provider_1.SafeAppProvider(safe, sdk));
