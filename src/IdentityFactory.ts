import { identityContractAbi, IdentityFactoryContractAbi, IdentityFactoryContractByteCode, SUB_GRAPH_API_URL } from "./constants";
import { Identity } from "./Identity";
import { ethers } from 'ethers';
import { default as axios } from 'axios';
import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk';
import { SafeAppProvider } from '@gnosis.pm/safe-apps-provider';

interface CustomWindow extends Window {
  ethereum: any;
}
declare var window: CustomWindow;

const { sdk, safe } = useSafeAppsSDK();

export class IdentityFactory {
  private static provider = new ethers.providers.Web3Provider(new SafeAppProvider(safe, sdk));

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

    return identityAddresses.map(address => new Identity(new ethers.Contract(address, identityContractAbi, signer)));
  }

  public async getIdentities(): Promise<Identity[]> {
    let identityDeployedEvents = await this.contract.queryFilter('IdentityDeployed', 0);

    const signer = await IdentityFactory.getSigner();
    const signerAddress = await signer.getAddress();

    const identityDeployedEventsForSignerAddress = identityDeployedEvents.filter(event => event.args && event.args[1] === signerAddress);
    let identityAddresses = identityDeployedEventsForSignerAddress.length > 0 ? identityDeployedEventsForSignerAddress.map(event => event.args![0]) : [];

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