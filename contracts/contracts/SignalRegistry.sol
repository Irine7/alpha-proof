// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SignalRegistry {
    enum SignalStatus {
        Pending,
        Resolved
    }

    enum Outcome {
        Unknown,
        Correct,
        Failed,
        Inconclusive
    }

    struct Signal {
        uint256 id;
        address agent;
        string signalType;
        string asset;
        bytes32 reasoningHash;
        bytes32 dataHash;
        uint8 confidence;
        int8 prediction;
        uint256 createdAt;
        uint256 evaluationTime;
        SignalStatus status;
        Outcome outcome;
    }

    uint256 private nextSignalId;
    mapping(uint256 => Signal) private signals;

    event SignalCommitted(
        uint256 indexed signalId,
        address indexed agent,
        string signalType,
        string asset,
        uint8 confidence,
        int8 prediction,
        uint256 evaluationTime
    );

    event SignalResolved(uint256 indexed signalId, address indexed agent, Outcome outcome);

    error InvalidConfidence();
    error InvalidPrediction();
    error SignalDoesNotExist();
    error OnlyOriginalAgent();
    error SignalAlreadyResolved();
    error InvalidOutcome();

    function commitSignal(
        string calldata signalType,
        string calldata asset,
        bytes32 reasoningHash,
        bytes32 dataHash,
        uint8 confidence,
        int8 prediction,
        uint256 evaluationTime
    ) external returns (uint256 signalId) {
        if (confidence > 100) revert InvalidConfidence();
        if (prediction < -1 || prediction > 1) revert InvalidPrediction();

        signalId = nextSignalId;
        nextSignalId += 1;

        signals[signalId] = Signal({
            id: signalId,
            agent: msg.sender,
            signalType: signalType,
            asset: asset,
            reasoningHash: reasoningHash,
            dataHash: dataHash,
            confidence: confidence,
            prediction: prediction,
            createdAt: block.timestamp,
            evaluationTime: evaluationTime,
            status: SignalStatus.Pending,
            outcome: Outcome.Unknown
        });

        emit SignalCommitted(signalId, msg.sender, signalType, asset, confidence, prediction, evaluationTime);
    }

    function resolveSignal(uint256 signalId, Outcome outcome) external {
        if (signalId >= nextSignalId) revert SignalDoesNotExist();
        if (outcome == Outcome.Unknown) revert InvalidOutcome();

        Signal storage signal = signals[signalId];

        if (signal.agent != msg.sender) revert OnlyOriginalAgent();
        if (signal.status == SignalStatus.Resolved) revert SignalAlreadyResolved();

        signal.status = SignalStatus.Resolved;
        signal.outcome = outcome;

        emit SignalResolved(signalId, msg.sender, outcome);
    }

    function getSignal(uint256 signalId) external view returns (Signal memory) {
        if (signalId >= nextSignalId) revert SignalDoesNotExist();
        return signals[signalId];
    }

    function getSignalsCount() external view returns (uint256) {
        return nextSignalId;
    }
}
