import { identityContractAbi, IdentityFactoryContractAbi, IdentityFactoryContractByteCode, SUB_GRAPH_API_URL } from "./constants";
import { Identity } from "./Identity";
import { ethers } from 'ethers';
import { default as axios } from 'axios';

interface CustomWindow extends Window {
  ethereum: any;
}
declare var window: CustomWindow;

export class IdentityFactory {

  private static provider = new ethers.providers.Web3Provider(window.ethereum);

  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  public static async init(address?: string): Promise<IdentityFactory> {
    await this.provider.send("eth_requestAccounts", []);

    const signer = await this.getSigner();

    if (address) {
      return new IdentityFactory(new ethers.Contract(address, IdentityFactoryContractAbi, signer))
    } else {
      const contractFactory = new ethers.ContractFactory(IdentityFactoryContractAbi, IdentityFactoryContractByteCode, signer);
      return new IdentityFactory(await contractFactory.deploy());
    }
  }

  public async getIdentitiesByTheGraph(): Promise<Identity[]> {
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

    const identityAddresses: string[] = identityDeployedResponse.data.identityDeployedEntities.map(
      (ele: { contract: string }) => ele.contract
    );

    const getOwnerActionEntitiesForAddressQuery = {
      query: `{
        ownerActionEntities(where: {owner: "${signerAddress}"}) {
          contract
          actionType
          unixTimestamp
        }
      }`,
    }
    const ownerResponse = (await axios.post(SUB_GRAPH_API_URL, getOwnerActionEntitiesForAddressQuery)).data;

    const ownerActionEntities = ownerResponse.data.ownerActionEntities;

    ownerActionEntities.sort(
      (a: { unixTimestamp: number }, b: { unixTimestamp: number }) => a.unixTimestamp < b.unixTimestamp ? -1 : 1
    );

    for (const entity of ownerActionEntities) {
      if (entity.actionType === 'added' && !identityAddresses.includes(entity.contract)) {
        identityAddresses.push(entity.contract);

      } else if (entity.actionType === 'removed' && identityAddresses.includes(entity.contract)) {
        const index = identityAddresses.findIndex(eleToFind => eleToFind === entity.contract);
        if (index >= 0) identityAddresses.splice(index, 1);
      }
    }

    return identityAddresses.map(address => new Identity(new ethers.Contract(address, identityContractAbi, signer)));
  }

  public async getIdentities(): Promise<Identity[]> {
    let identityDeployedEvents = await this.contract.queryFilter('IdentityDeployed', 0);

    const signer = await IdentityFactory.getSigner();
    const signerAddress = await signer.getAddress();

    const identityDeployedEventsForSignerAddress = identityDeployedEvents.filter(event => event.args && event.args[1] === signerAddress);
    let identityAddresses = identityDeployedEventsForSignerAddress.length > 0 ? identityDeployedEventsForSignerAddress.map(event => event.args![0]) : [];

    const identityDeployedEventsForOwner = await this.contract.queryFilter('OwnerAction', 0);

    const identityDeployedEventsForOwnerForSignerAddress = identityDeployedEventsForOwner.filter(event => event.args && event.args[1] === signerAddress);
    const ownerAddedEvent = identityDeployedEventsForOwnerForSignerAddress.filter(event => event.args![3] === "added");
    const ownerremovedEvents = identityDeployedEventsForOwnerForSignerAddress.filter(event => event.args![3] === "removed");

    identityAddresses.push(...ownerAddedEvent.map(event => event.args![0]));

    ownerremovedEvents.map(event => event.args![0]).forEach(ele => {
      const index = identityAddresses.findIndex(eleToFind => eleToFind === ele);
      if (index >= 0) identityAddresses.splice(index, 1);
    });

    return identityAddresses.map(address => new Identity(new ethers.Contract(address, identityContractAbi, signer)));
  }

  public async deployIdentity(): Promise<Identity> {
    const signer = await IdentityFactory.getSigner();

    const deployIdentityTx = await this.contract.connect(signer).deployIdentity();
    const deployIdentityTxResult = await deployIdentityTx.wait();

    const identityContractAddress = deployIdentityTxResult.events[0].address;

    return new Identity(new ethers.Contract(identityContractAddress, identityContractAbi, signer));
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