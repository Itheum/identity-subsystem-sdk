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
            const getOwnerActionEntitiesForAddressQuery = {
                query: `{
        ownerActionEntities(where: {owner: "${signerAddress}"}) {
          contract
          actionType
          unixTimestamp
        }
      }`,
            };
            const ownerResponse = (yield axios_1.default.post(constants_1.SUB_GRAPH_API_URL, getOwnerActionEntitiesForAddressQuery)).data;
            const ownerActionEntities = ownerResponse.data.ownerActionEntities;
            ownerActionEntities.sort((a, b) => a.unixTimestamp < b.unixTimestamp ? -1 : 1);
            for (const entity of ownerActionEntities) {
                if (entity.actionType === 'added' && !identityAddresses.includes(entity.contract)) {
                    identityAddresses.push(entity.contract);
                }
                else if (entity.actionType === 'removed' && identityAddresses.includes(entity.contract)) {
                    const index = identityAddresses.findIndex(eleToFind => eleToFind === entity.contract);
                    if (index >= 0)
                        identityAddresses.splice(index, 1);
                }
            }
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
            const identityDeployedEventsForOwner = yield this.contract.queryFilter('OwnerAction', 0);
            const identityDeployedEventsForOwnerForSignerAddress = identityDeployedEventsForOwner.filter(event => event.args && event.args[1] === signerAddress);
            const ownerAddedEvent = identityDeployedEventsForOwnerForSignerAddress.filter(event => event.args[3] === "added");
            const ownerremovedEvents = identityDeployedEventsForOwnerForSignerAddress.filter(event => event.args[3] === "removed");
            identityAddresses.push(...ownerAddedEvent.map(event => event.args[0]));
            ownerremovedEvents.map(event => event.args[0]).forEach(ele => {
                const index = identityAddresses.findIndex(eleToFind => eleToFind === ele);
                if (index >= 0)
                    identityAddresses.splice(index, 1);
            });
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
exports.IdentityFactory = IdentityFactory;
IdentityFactory.provider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
