const bytes = require('utf8-length');
const fs = require('fs');
const { sha3_256 } = require('js-sha3');
const Command = require('../command');
const Encryption = require('../../RSAEncryption');
const Utilities = require('../../Utilities');
const Models = require('../../../models/index');
const ImportUtilities = require('../../ImportUtilities');
const OtJsonUtilities = require('../../OtJsonUtilities');

/**
 * Imports data for replication
 */
class DhReplicationImportCommand extends Command {
    constructor(ctx) {
        super(ctx);
        this.config = ctx.config;
        this.importService = ctx.importService;
        this.permissionedDataService = ctx.permissionedDataService;
        this.web3 = ctx.web3;
        this.graphStorage = ctx.graphStorage;
        this.logger = ctx.logger;
        this.transport = ctx.transport;
        this.remoteControl = ctx.remoteControl;
        this.blockchain = ctx.blockchain;
        this.challengeService = ctx.challengeService;
        this.commandExecutor = ctx.commandExecutor;
    }

    /**
     * Executes command and produces one or more events
     * @param command
     */
    async execute(command) {
        const {
            offerId,
            dataSetId,
            documentPath,
            dcWallet,
            dcNodeId,
            litigationPublicKey,
            litigationRootHash,
            distributionPublicKey,
            distributionPrivateKey,
            distributionEpk,
            transactionHash,
            encColor,
            dcIdentity,
        } = command.data;
        const { otJson, permissionedData }
            = JSON.parse(fs.readFileSync(documentPath, { encoding: 'utf-8' }));

        let decryptedDataset;
        let encryptedMap;
        let decryptedGraphRootHash;

        this.decryptAndSortDataset(otJson, litigationPublicKey, offerId, encColor)
            .then((result) => {
                decryptedDataset = result.decDataset;
                encryptedMap = result.encMap;
            })
            .then(() => this.validateDatasetId(dataSetId, decryptedDataset))
            .then(() => this.validateRootHash(decryptedDataset, dataSetId, otJson))
            .then((result) => {
                decryptedGraphRootHash = result;
            })
            .then(() => this.validateLitigationRootHash(otJson, litigationRootHash))
            .then(() => this.updatePermissionedData(
                decryptedDataset,
                permissionedData,
                dataSetId,
                dcIdentity,
                dcNodeId,
            ))
            .then(() => this.updateHoldingData(
                offerId,
                dataSetId,
                encColor,
                dcWallet,
                litigationPublicKey,
                litigationRootHash,
                distributionPublicKey,
                distributionPrivateKey,
                distributionEpk,
                transactionHash,
            ))
            .then(() => this.importDataset(decryptedDataset, encryptedMap, documentPath))
            .then(() => this.updateDataInfo(
                dataSetId,
                decryptedDataset,
                otJson,
                decryptedGraphRootHash,
                dcWallet,
            ))
            .then(() => this.sendReplicationFinishedMessage(offerId, dcNodeId))
            .then(() => this.updateBidData(offerId))
            .then(() => this.commandExecutor.add({
                name: 'dhOfferFinalizedCommand',
                deadline_at: Date.now() + (60 * 60 * 1000), // One hour.
                period: 10 * 1000,
                data: {
                    offerId,
                },
            }));
        return Command.empty();
    }

    /**
     * Try to recover command
     * @param command
     * @param err
     * @return {Promise<{commands: *[]}>}
     */
    async recover(command, err) {
        const {
            offerId,
        } = command.data;

        const bid = await Models.bids.findOne({ where: { offer_id: offerId } });
        bid.status = 'FAILED';
        await bid.save({ fields: ['status'] });
        return Command.empty();
    }

    async decryptAndSortDataset(otJson, litigationPublicKey, offerId, encColor) {
        this.logger.trace('Decrypting received dataset.');
        const replication = ImportUtilities.decryptDataset(
            otJson,
            litigationPublicKey,
            offerId,
            encColor,
        );
        const tempSortedDataset = OtJsonUtilities
            .prepareDatasetForNewReplication(replication.decryptedDataset);
        if (tempSortedDataset) {
            replication.decryptedDataset = tempSortedDataset;
        }

        return {
            decDataset: replication.decryptedDataset,
            encMap: replication.encryptedMap,
        };
    }

    async validateDatasetId(dataSetId, decryptedDataset) {
        this.logger.trace('Validating received dataset ID.');
        const calculatedDataSetId = ImportUtilities.calculateGraphPublicHash(decryptedDataset);

        if (dataSetId !== calculatedDataSetId) {
            throw new Error(`Calculated data set ID ${calculatedDataSetId} differs from DC data set ID ${dataSetId}`);
        }
    }

    async validateRootHash(decryptedDataset, dataSetId, otJson) {
        this.logger.trace('Validating root hash.');
        const decryptedGraphRootHash = ImportUtilities.calculateDatasetRootHash(decryptedDataset);
        const blockchainRootHash = await this.blockchain.getRootHash(dataSetId);
        if (decryptedGraphRootHash !== blockchainRootHash) {
            throw Error(`Calculated root hash ${decryptedGraphRootHash} differs from Blockchain root hash ${blockchainRootHash}`);
        }
        const originalRootHash = otJson.datasetHeader.dataIntegrity.proofs[0].proofValue;
        if (decryptedGraphRootHash !== originalRootHash) {
            throw Error(`Calculated root hash ${decryptedGraphRootHash} differs from document root hash ${originalRootHash}`);
        }
        return decryptedGraphRootHash;
    }

    async validateLitigationRootHash(otJson, litigationRootHash) {
        this.logger.trace('Validating litigation hash.');
        let sortedDataset =
            OtJsonUtilities.prepareDatasetForGeneratingLitigationProof(otJson);
        if (!sortedDataset) {
            sortedDataset = otJson;
        }
        const encryptedGraphRootHash = this.challengeService.getLitigationRootHash(sortedDataset['@graph']);
        if (encryptedGraphRootHash !== litigationRootHash) {
            throw Error(`Calculated distribution hash ${encryptedGraphRootHash} differs from DC distribution hash ${litigationRootHash}`);
        }
    }

    async updatePermissionedData(
        decryptedDataset,
        permissionedData,
        dataSetId,
        dcIdentity,
        dcNodeId,
    ) {
        this.permissionedDataService.attachPermissionedDataToGraph(
            decryptedDataset['@graph'],
            permissionedData,
        );

        await this.permissionedDataService.addDataSellerForPermissionedData(
            dataSetId,
            dcIdentity,
            0,
            dcNodeId,
            decryptedDataset['@graph'],
        );
    }

    async updateHoldingData(
        offerId,
        dataSetId,
        encColor,
        dcWallet,
        litigationPublicKey,
        litigationRootHash,
        distributionPublicKey,
        distributionPrivateKey,
        distributionEpk,
        transactionHash,
    ) {
        const holdingData = await Models.holding_data.findOne({
            where: {
                offer_id: offerId,
                data_set_id: dataSetId,
                color: encColor,
                source_wallet: dcWallet,
            },
        });

        if (holdingData == null) {
            // Store holding information and generate keys for eventual data replication.
            const newHoldingEntry = {
                data_set_id: dataSetId,
                source_wallet: dcWallet,
                litigation_public_key: litigationPublicKey,
                litigation_root_hash: litigationRootHash,
                distribution_public_key: distributionPublicKey,
                distribution_private_key: distributionPrivateKey,
                distribution_epk: distributionEpk,
                transaction_hash: transactionHash,
                color: encColor,
                offer_id: offerId,
            };
            await Models.holding_data.create(newHoldingEntry);
        }
    }

    async importDataset(decryptedDataset, encryptedMap, documentPath) {
        const importResult = await this.importService.importFile({
            document: decryptedDataset,
            encryptedMap,
        });

        fs.unlinkSync(documentPath);

        if (importResult.error) {
            throw Error(importResult.error);
        }
    }

    async updateDataInfo(dataSetId, decryptedDataset, otJson, decryptedGraphRootHash, dcWallet) {
        const dataInfo = await Models.data_info.findOne({
            where: {
                data_set_id: dataSetId,
            },
        });

        if (dataInfo == null) {
            const dataSize = bytes(JSON.stringify(decryptedDataset));
            const dataHash = Utilities.normalizeHex(sha3_256(`${otJson}`));
            await Models.data_info.create({
                data_set_id: dataSetId,
                total_documents: decryptedDataset['@graph'].length,
                root_hash: decryptedGraphRootHash,
                data_provider_wallet: dcWallet,
                import_timestamp: new Date(),
                otjson_size_in_bytes: dataSize,
                data_hash: dataHash,
                origin: 'HOLDING',
            });
        }
    }

    async sendReplicationFinishedMessage(offerId, dcNodeId) {
        const toSign = [
            Utilities.denormalizeHex(offerId),
            Utilities.denormalizeHex(this.config.erc725Identity)];
        const messageSignature = Encryption
            .signMessage(this.web3, toSign, Utilities.normalizeHex(this.config.node_private_key));

        const replicationFinishedMessage = {
            offerId,
            dhIdentity: this.config.erc725Identity,
            messageSignature: messageSignature.signature,
            wallet: this.config.node_wallet,
        };

        await this.transport.replicationFinished(replicationFinishedMessage, dcNodeId);
    }

    async updateBidData(offerId) {
        const bid = await Models.bids.findOne({ where: { offer_id: offerId } });
        bid.status = 'REPLICATED';
        await bid.save({ fields: ['status'] });
    }

    /**
     * Builds default
     * @param map
     * @returns {{add, data: *, delay: *, deadline: *}}
     */
    default(map) {
        const command = {
            name: 'dhReplicationImportCommand',
            delay: 0,
            transactional: false,
        };
        Object.assign(command, map);
        return command;
    }
}

module.exports = DhReplicationImportCommand;
