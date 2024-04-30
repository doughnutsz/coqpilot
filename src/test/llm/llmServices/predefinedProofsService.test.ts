import { expect } from "earl";
import * as tmp from "tmp";

import { InvalidRequestError } from "../../../llm/llmServiceErrors";
import { ErrorsHandlingMode } from "../../../llm/llmServices/llmService";
import { PredefinedProofsModelParams } from "../../../llm/llmServices/modelParams";
import { PredefinedProofsService } from "../../../llm/llmServices/predefinedProofs/predefinedProofsService";
import { ProofGenerationContext } from "../../../llm/proofGenerationContext";
import { PredefinedProofsUserModelParams } from "../../../llm/userModelParams";

import { EventLogger } from "../../../logging/eventLogger";
import {
    EventsTracker,
    subscribeToTrackEvents,
    testLLMServiceCompletesAdmitFromFile,
} from "../testUtils/commonTestFunctions";
import { expectLogs } from "../testUtils/testGenerateProofPipeline";

suite("[LLMService] Test `PredefinedProofsService`", function () {
    const simpleTactics = ["auto.", "intros.", "reflexivity."];
    const userParams: PredefinedProofsUserModelParams = {
        modelName: "predefine proofs",
        tactics: simpleTactics,
    };
    const proofGenerationContext: ProofGenerationContext = {
        completionTarget: "could be anything",
        contextTheorems: [],
    };

    async function withPredefinedProofsService(
        block: (
            predefinedProofsService: PredefinedProofsService,
            testEventLogger: EventLogger
        ) => Promise<void>
    ) {
        const testEventLogger = new EventLogger();
        const predefinedProofsService = new PredefinedProofsService(
            tmp.fileSync().name,
            testEventLogger,
            true
        );
        try {
            await block(predefinedProofsService, testEventLogger);
        } finally {
            predefinedProofsService.dispose();
        }
    }

    const choices = simpleTactics.length;
    const inputFile = ["small_document.v"];

    test("Simple generation: prove with `auto.`", async () => {
        const predefinedProofsService = new PredefinedProofsService(
            tmp.fileSync().name
        );
        await testLLMServiceCompletesAdmitFromFile(
            predefinedProofsService,
            userParams,
            inputFile,
            choices
        );
    });

    [
        ErrorsHandlingMode.LOG_EVENTS_AND_SWALLOW_ERRORS,
        ErrorsHandlingMode.RETHROW_ERRORS,
    ].forEach((errorsHandlingMode) => {
        test(`Test generation logging: ${errorsHandlingMode}`, async () => {
            await withPredefinedProofsService(
                async (predefinedProofsService, testEventLogger) => {
                    const eventsTracker = subscribeToTrackEvents(
                        testEventLogger,
                        predefinedProofsService
                    );
                    const resolvedParams =
                        predefinedProofsService.resolveParameters(
                            userParams
                        ) as PredefinedProofsModelParams;

                    // failed generation
                    try {
                        await predefinedProofsService.generateProof(
                            proofGenerationContext,
                            resolvedParams,
                            resolvedParams.tactics.length + 1,
                            errorsHandlingMode
                        );
                    } catch (e) {
                        expect(errorsHandlingMode).toEqual(
                            ErrorsHandlingMode.RETHROW_ERRORS
                        );
                        const error = e as InvalidRequestError;
                        expect(error).toBeTruthy();
                    }

                    const expectedEvents: EventsTracker = {
                        successfulGenerationEventsN: 0,
                        failedGenerationEventsN:
                            errorsHandlingMode ===
                            ErrorsHandlingMode.LOG_EVENTS_AND_SWALLOW_ERRORS
                                ? 1
                                : 0,
                    };
                    expect(eventsTracker).toEqual(expectedEvents);
                    expectLogs([{ status: "FAILED" }], predefinedProofsService);

                    // successful generation
                    const generatedProofs =
                        await predefinedProofsService.generateProof(
                            proofGenerationContext,
                            resolvedParams,
                            resolvedParams.tactics.length
                        );
                    expect(generatedProofs).toHaveLength(
                        resolvedParams.tactics.length
                    );

                    expectedEvents.successfulGenerationEventsN += 1;
                    expect(eventsTracker).toEqual(expectedEvents);
                    expectLogs(
                        [{ status: "FAILED" }, { status: "SUCCESS" }],
                        predefinedProofsService
                    );
                }
            );
        });
    });

    test("Test chat-related features throw", async () => {
        await withPredefinedProofsService(
            async (predefinedProofsService, _testEventLogger) => {
                const resolvedParams =
                    predefinedProofsService.resolveParameters(userParams);
                expect(async () => {
                    await predefinedProofsService.generateFromChat(
                        {
                            chat: [],
                            estimatedTokens: 0,
                        },
                        resolvedParams,
                        choices,
                        ErrorsHandlingMode.RETHROW_ERRORS
                    );
                }).toBeRejected();

                const [generatedProof] =
                    await predefinedProofsService.generateProof(
                        proofGenerationContext,
                        resolvedParams,
                        1
                    );
                expect(generatedProof.canBeFixed()).toBeFalsy();
                expect(
                    async () =>
                        await generatedProof.fixProof(
                            "pretend to be diagnostic",
                            3,
                            ErrorsHandlingMode.RETHROW_ERRORS
                        )
                ).toBeRejected();
            }
        );
    });
});
