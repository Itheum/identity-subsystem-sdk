System.register(["./constants", "./Identity", "ethers", "axios", "@gnosis.pm/safe-apps-provider", "@gnosis.pm/safe-apps-sdk"], function (exports_1, context_1) {
    "use strict";
    var constants_1, Identity_1, ethers_1, axios_1, safe_apps_provider_1, safe_apps_sdk_1, opts, sdk, safe, IdentityFactory;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (constants_1_1) {
                constants_1 = constants_1_1;
            },
            function (Identity_1_1) {
                Identity_1 = Identity_1_1;
            },
            function (ethers_1_1) {
                ethers_1 = ethers_1_1;
            },
            function (axios_1_1) {
                axios_1 = axios_1_1;
            },
            function (safe_apps_provider_1_1) {
                safe_apps_provider_1 = safe_apps_provider_1_1;
            },
            function (safe_apps_sdk_1_1) {
                safe_apps_sdk_1 = safe_apps_sdk_1_1;
            }
        ],
        execute: async function () {
            opts = {
                allowedDomains: [/gnosis-safe.io/],
                debug: false
            };
            sdk = new safe_apps_sdk_1.default(opts);
            safe = await sdk.safe.getInfo();
            console.log('IdentityFactory');
            console.log('sdk', sdk);
            console.log('safe', safe);
            IdentityFactory = class IdentityFactory {
                constructor(contract) {
                    this.contract = contract;
                }
                static async init(address) {
                    console.log('IdentityFactory', 'init');
                    const signer = await this.getSigner();
                    if (address) {
                        return new IdentityFactory(new ethers_1.ethers.Contract(address, constants_1.IdentityFactoryContractAbi, signer));
                    }
                    else {
                        const contractFactory = new ethers_1.ethers.ContractFactory(constants_1.IdentityFactoryContractAbi, constants_1.IdentityFactoryContractByteCode, signer);
                        return new IdentityFactory(await contractFactory.deploy());
                    }
                }
                async getIdentitiesByTheGraph() {
                    console.log('IdentityFactory', 'getIdentitiesByTheGraph');
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
                    const identityDeployedResponse = (await axios_1.default.post(constants_1.SUB_GRAPH_API_URL, getIdentityDeployedEntitiesForAddressQuery)).data;
                    const identityAddresses = identityDeployedResponse.data.identityDeployedEntities.map((ele) => ele.contract);
                    return identityAddresses.map(address => new Identity_1.Identity(new ethers_1.ethers.Contract(address, constants_1.identityContractAbi, signer)));
                }
                async getIdentities() {
                    console.log('IdentityFactory', 'getIdentities');
                    let identityDeployedEvents = await this.contract.queryFilter('IdentityDeployed', 0);
                    const signer = await IdentityFactory.getSigner();
                    const signerAddress = await signer.getAddress();
                    const identityDeployedEventsForSignerAddress = identityDeployedEvents.filter(event => event.args && event.args[1] === signerAddress);
                    let identityAddresses = identityDeployedEventsForSignerAddress.length > 0 ? identityDeployedEventsForSignerAddress.map(event => event.args[0]) : [];
                    return identityAddresses.map(address => new Identity_1.Identity(new ethers_1.ethers.Contract(address, constants_1.identityContractAbi, signer)));
                }
                async deployIdentity() {
                    console.log('IdentityFactory', 'deployIdentity');
                    const signer = await IdentityFactory.getSigner();
                    const deployIdentityTx = await this.contract.connect(signer).deployIdentity();
                    const deployIdentityTxResult = await deployIdentityTx.wait();
                    const identityContractAddress = deployIdentityTxResult.events[0].address;
                    return new Identity_1.Identity(new ethers_1.ethers.Contract(identityContractAddress, constants_1.identityContractAbi, signer));
                }
                static async getSigner() {
                    return this.provider.getSigner();
                }
                static async getSignerAddress() {
                    const signer = await this.getSigner();
                    return signer.getAddress();
                }
            };
            exports_1("IdentityFactory", IdentityFactory);
            IdentityFactory.provider = new ethers_1.ethers.providers.Web3Provider(new safe_apps_provider_1.SafeAppProvider(safe, sdk));
        }
    };
});
