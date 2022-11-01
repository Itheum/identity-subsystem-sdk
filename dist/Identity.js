System.register(["ethers", "@gnosis.pm/safe-apps-provider", "@gnosis.pm/safe-apps-sdk"], function (exports_1, context_1) {
    "use strict";
    var ethers_1, safe_apps_provider_1, safe_apps_sdk_1, opts, sdk, safe, Identity;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (ethers_1_1) {
                ethers_1 = ethers_1_1;
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
            console.log('Identity');
            console.log('sdk', sdk);
            console.log('safe', safe);
            Identity = class Identity {
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
                    const functionSignatureHash = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(functionSignature)).substring(0, 10);
                    const executeTx = await this.contract.connect(signer).execute(0, targetAddress, ethers_1.ethers.utils.parseEther(amountInEtherString), functionSignatureHash, { gasLimit });
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
            };
            exports_1("Identity", Identity);
            Identity.provider = new ethers_1.ethers.providers.Web3Provider(new safe_apps_provider_1.SafeAppProvider(safe, sdk));
        }
    };
});
