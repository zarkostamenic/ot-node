pragma solidity ^0.4.24;

import './Hub.sol';

contract HoldingStorage {
    Hub public hub;

    constructor(address hubAddress) public{
        hub = Hub(hubAddress);
    }

    modifier onlyContracts() {
        require(hub.isContract(msg.sender),
        "Function can only be called by contracts!");
        _;
    }

    uint8 public difficultyOverride;
    function getDifficultyOverride()
    public view returns (uint8) {
        return difficultyOverride;
    }
    function setDifficultyOverride(uint8 new_difficulty)
    public onlyContracts {
        difficultyOverride = new_difficulty;
    }

    mapping(bytes32 => bytes32) public fingerprint;

    function setFingerprint(bytes32 dataSetId, bytes32 dataRootHash)
    public onlyContracts {
        fingerprint[dataSetId] = dataRootHash;
    }

    struct OfferDefinition {
        bytes1 task;
        uint8 difficulty;

        uint56 holdingTimeInMinutes;
        uint56 litigationIntervalInMinutes;

        uint128 tokenAmountPerHolder;
        bytes32 offerId;
        address creator;

        bytes32 redLitigationHash;
        bytes32 greenLitigationHash;
        bytes32 blueLitigationHash;
    }
    mapping(bytes32 => OfferDefinition) public offer; // offer[offerId];

    function getOfferCreator (bytes32 offerId)
    public view returns(address creator){
        return offer[offerId].creator;
    }
    function getOfferHoldingTimeInMinutes (bytes32 offerId)
    public view returns(uint56 holdingTimeInMinutes){
        return offer[offerId].holdingTimeInMinutes;
    }
    function getOfferTokenAmountPerHolder (bytes32 offerId)
    public view returns(uint128 tokenAmountPerHolder){
        return offer[offerId].tokenAmountPerHolder;
    }
    function getOfferLitigationIntervalInMinutes (bytes32 offerId)
    public view returns(uint56 litigationIntervalInMinutes){
        return offer[offerId].litigationIntervalInMinutes;
    }
    function getOfferTask (bytes32 offerId)
    public view returns(bytes1 task){
        return offer[offerId].task;
    }
    function getOfferDifficulty (bytes32 offerId)
    public view returns(uint8 difficulty){
        return offer[offerId].difficulty;
    }
    function getOfferRedLitigationHash (bytes32 offerId)
    public view returns(bytes32 redLitigationHash){
        return offer[offerId].redLitigationHash;
    }
    function getOfferGreenLitigationHash (bytes32 offerId)
    public view returns(bytes32 greenLitigationHash){
        return offer[offerId].greenLitigationHash;
    }
    function getOfferBlueLitigationHash (bytes32 offerId)
    public view returns(bytes32 blueLitigationHash){
        return offer[offerId].blueLitigationHash;
    }

    function setOfferCreator (bytes32 offerId, address creator)
    public onlyContracts {
        offer[offerId].creator = creator;
    }
    function setOfferHoldingTimeInMinutes (bytes32 offerId, uint56 holdingTimeInMinutes)
    public onlyContracts {
        offer[offerId].holdingTimeInMinutes = holdingTimeInMinutes;
    }
    function setOfferTokenAmountPerHolder (bytes32 offerId, uint128 tokenAmountPerHolder)
    public onlyContracts {
        offer[offerId].tokenAmountPerHolder = tokenAmountPerHolder;
    }
    function setOfferLitigationIntervalInMinutes (bytes32 offerId, uint56 litigationIntervalInMinutes)
    public onlyContracts {
        offer[offerId].litigationIntervalInMinutes = litigationIntervalInMinutes;
    }
    function setOfferTask (bytes32 offerId, bytes1 task)
    public onlyContracts {
        offer[offerId].task = task;
    }
    function setOfferDifficulty (bytes32 offerId, uint8 difficulty)
    public onlyContracts {
        offer[offerId].difficulty = difficulty;
    }
    function setOfferRedLitigationHash (bytes32 offerId, bytes32 redLitigationHash)
    public onlyContracts {
        offer[offerId].redLitigationHash = redLitigationHash;
    }
    function setOfferGreenLitigationHash (bytes32 offerId, bytes32 greenLitigationHash)
    public onlyContracts {
        offer[offerId].greenLitigationHash = greenLitigationHash;
    }
    function setOfferBlueLitigationHash (bytes32 offerId, bytes32 blueLitigationHash)
    public onlyContracts {
        offer[offerId].blueLitigationHash = blueLitigationHash;
    }

    function setOfferParameters (
        address creator,
        bytes32 offerId,
        bytes1 task,
        uint8 difficulty,
        uint56 holdingTimeInMinutes,
        uint56 litigationIntervalInMinutes,
        uint128 tokenAmountPerHolder
    )
    public onlyContracts {
        offer[offerId].task = task;
        offer[offerId].difficulty = difficulty;
        offer[offerId].holdingTimeInMinutes = holdingTimeInMinutes;
        offer[offerId].litigationIntervalInMinutes = litigationIntervalInMinutes;
        offer[offerId].tokenAmountPerHolder = tokenAmountPerHolder;
        offer[offerId].creator = creator;
    }

    function setOfferLitigationHashes (
        bytes32 offerId,
        bytes32 redLitigationHash,
        bytes32 greenLitigationHash,
        bytes32 blueLitigationHash)
    public onlyContracts {
        offer[offerId].redLitigationHash = redLitigationHash;
        offer[offerId].greenLitigationHash = greenLitigationHash;
        offer[offerId].blueLitigationHash = blueLitigationHash;
    }


    struct HolderDefinition {
        uint8 litigationEncryptionType;
        uint56 paymentTimestamp;

        uint128 stakedAmount;
        uint128 paidAmount;
    }
    mapping(bytes32 => mapping(address => HolderDefinition)) public holder; // holder[offerId][address];

    function setHolders(
        bytes32 offerId,
        address[] identities,
        uint24 encryptionTypes
    )
    public onlyContracts {
        uint128 tokenAmountPerHolder = offer[offerId].tokenAmountPerHolder;

        uint8 firstLitigationEncryptionType;
        uint8 secondLitigationEncryptionType;
        uint8 thirdLitigationEncryptionType;

        assembly {
            firstLitigationEncryptionType := byte(29, encryptionTypes)
            secondLitigationEncryptionType := byte(30, encryptionTypes)
            thirdLitigationEncryptionType := byte(31, encryptionTypes)
        }

        holder[offerId][identities[0]].litigationEncryptionType = firstLitigationEncryptionType;
        holder[offerId][identities[0]].paymentTimestamp = uint56(block.timestamp);
        holder[offerId][identities[0]].stakedAmount = tokenAmountPerHolder;

        holder[offerId][identities[1]].litigationEncryptionType = secondLitigationEncryptionType;
        holder[offerId][identities[1]].paymentTimestamp = uint56(block.timestamp);
        holder[offerId][identities[1]].stakedAmount = offer[offerId].tokenAmountPerHolder;

        holder[offerId][identities[2]].litigationEncryptionType = thirdLitigationEncryptionType;
        holder[offerId][identities[2]].paymentTimestamp = uint56(block.timestamp);
        holder[offerId][identities[2]].stakedAmount = offer[offerId].tokenAmountPerHolder;
    }
    function setHolderStakedAmount (bytes32 offerId, address identity, uint128 stakedAmount)
    public onlyContracts {
        require(identity!=address(0));
        holder[offerId][identity].stakedAmount = stakedAmount;
    }
    function setHolderPaidAmount (bytes32 offerId, address identity, uint128 paidAmount)
    public onlyContracts {
        require(identity!=address(0));
        holder[offerId][identity].paidAmount = paidAmount;
    }
    function setHolderLitigationEncryptionType(bytes32 offerId, address identity, uint8 litigationEncryptionType)
    public onlyContracts {
        require(identity!=address(0));
        holder[offerId][identity].litigationEncryptionType = litigationEncryptionType;
    }
    function setHolderPaymentTimestamp(bytes32 offerId, address identity, uint56 paymentTimestamp)
    public onlyContracts {
        holder[offerId][identity].paymentTimestamp = paymentTimestamp;
    }

    function getHolderStakedAmount (bytes32 offerId, address identity)
    public view returns(uint128 stakedAmount) {
        require(identity!=address(0));
        return holder[offerId][identity].stakedAmount;
    }
    function getHolderPaidAmount (bytes32 offerId, address identity)
    public view returns(uint128 paidAmount) {
        require(identity!=address(0));
        return holder[offerId][identity].paidAmount;
    }
    function getHolderLitigationEncryptionType(bytes32 offerId, address identity)
    public view returns(uint8 litigationEncryptionType) {
        require(identity!=address(0));
        return holder[offerId][identity].litigationEncryptionType;
    }
    function getHolderPaymentTimestamp(bytes32 offerId, address identity)
    public view returns(uint56 paymentTimestamp) {
        return holder[offerId][identity].paymentTimestamp;
    }
    function setHubAddress(address newHubAddress)
    public onlyContracts {
        require(newHubAddress!=address(0));
        hub = Hub(newHubAddress);
    }
}
