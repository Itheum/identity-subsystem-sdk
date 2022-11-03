var _a;
import { identityContractAbi, IdentityFactoryContractAbi, IdentityFactoryContractByteCode, SUB_GRAPH_API_URL } from "./constants";
import { Identity } from "./Identity";
import { ethers } from 'ethers';
import { default as axios } from 'axios';
import { SafeAppProvider } from '@gnosis.pm/safe-apps-provider';
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk";
const opts = {
    allowedDomains: [/gnosis-safe.io/],
    debug: false
};
export class IdentityFactory {
    constructor(contract) {
        this.contract = contract;
    }
    static async init(address) {
        const signer = await this.getSigner();
        if (address) {
            return new IdentityFactory(new ethers.Contract(address, IdentityFactoryContractAbi, signer));
        }
        else {
            const contractFactory = new ethers.ContractFactory(IdentityFactoryContractAbi, IdentityFactoryContractByteCode, signer);
            return new IdentityFactory(await contractFactory.deploy());
        }
    }
    async getIdentitiesByTheGraph() {
        const signer = await IdentityFactory.getSigner();
        const signerAddress = await signer.getAddress();
        const getIdentityDeployedEntitiesForAddressQuery = {
            query: `{
        identityDeployedEntities(where: {owner: "${signerAddress}"}) {
          contract
          unixTimestamp
        }
      }`,
        };
        const identityDeployedResponse = (await axios.post(SUB_GRAPH_API_URL, getIdentityDeployedEntitiesForAddressQuery)).data;
        const identityAddresses = identityDeployedResponse.data.identityDeployedEntities.map((ele) => ele.contract);
        return identityAddresses.map(address => new Identity(new ethers.Contract(address, identityContractAbi, signer)));
    }
    async getIdentities() {
        let identityDeployedEvents = await this.contract.queryFilter('IdentityDeployed', 0);
        const signer = await IdentityFactory.getSigner();
        const signerAddress = await signer.getAddress();
        const identityDeployedEventsForSignerAddress = identityDeployedEvents.filter(event => event.args && event.args[1] === signerAddress);
        let identityAddresses = identityDeployedEventsForSignerAddress.length > 0 ? identityDeployedEventsForSignerAddress.map(event => event.args[0]) : [];
        return identityAddresses.map(address => new Identity(new ethers.Contract(address, identityContractAbi, signer)));
    }
    async deployIdentity() {
        const signer = await IdentityFactory.getSigner();
        const deployIdentityTx = await this.contract.connect(signer).deployIdentity();
        const deployIdentityTxResult = await deployIdentityTx.wait();
        const identityContractAddress = deployIdentityTxResult.events[0].address;
        return new Identity(new ethers.Contract(identityContractAddress, identityContractAbi, signer));
    }
    static async getSigner() {
        return (await this.provider()).getSigner();
    }
    static async getSignerAddress() {
        const signer = await this.getSigner();
        return signer.getAddress();
    }
}
_a = IdentityFactory;
IdentityFactory.provider = async () => {
    const sdk = new SafeAppsSDK(opts);
    const safe = await sdk.safe.getInfo();
    console.log(safe);
    if (!safe) {
        alert('Please use this dApp only via your Gnosis Safe');
    }
    return new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk));
};
