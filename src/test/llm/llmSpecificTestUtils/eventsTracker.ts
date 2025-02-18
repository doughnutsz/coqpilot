import { expect } from "earl";

import { LLMServiceError } from "../../../llm/llmServiceErrors";
import {
    AnalyzedChatHistory,
    ChatHistory,
} from "../../../llm/llmServices/commonStructures/chat";
import {
    LLMServiceRequestFailed,
    LLMServiceRequestSucceeded,
    isLLMServiceRequestFailed,
    isLLMServiceRequestSucceeded,
} from "../../../llm/llmServices/commonStructures/llmServiceRequest";
import {
    LLMService,
    LLMServiceImpl,
} from "../../../llm/llmServices/llmService";

import { EventLogger } from "../../../logging/eventLogger";

import { MockLLMService } from "./mockLLMService";

export interface EventsTracker {
    successfulRequestEventsN: number;
    failedRequestEventsN: number;
}

export function subscribeToTrackEvents<
    LLMServiceType extends LLMService<any, any>,
>(
    testEventLogger: EventLogger,
    expectedService: LLMServiceType,
    expectedModelId: string,
    expectedError?: LLMServiceError
): EventsTracker {
    const eventsTracker: EventsTracker = {
        successfulRequestEventsN: 0,
        failedRequestEventsN: 0,
    };
    subscribeToLogicEvents(
        eventsTracker,
        testEventLogger,
        expectedService,
        expectedModelId,
        expectedError
    );
    return eventsTracker;
}

export interface MockEventsTracker extends EventsTracker {
    mockEventsN: number;
}

export function subscribeToTrackMockEvents(
    testEventLogger: EventLogger,
    expectedMockService: MockLLMService,
    expectedModelId: string,
    expectedMockChat?: AnalyzedChatHistory,
    expectedError?: LLMServiceError
): MockEventsTracker {
    const eventsTracker: MockEventsTracker = {
        mockEventsN: 0,
        successfulRequestEventsN: 0,
        failedRequestEventsN: 0,
    };
    testEventLogger.subscribeToLogicEvent(
        MockLLMService.generationFromChatEvent,
        (chatData) => {
            if (expectedMockChat === undefined) {
                expect(chatData).toBeTruthy();
            } else {
                expect(chatData as ChatHistory).toEqual(expectedMockChat.chat);
            }
            eventsTracker.mockEventsN += 1;
        }
    );
    subscribeToLogicEvents(
        eventsTracker,
        testEventLogger,
        expectedMockService,
        expectedModelId,
        expectedError
    );
    return eventsTracker;
}

function subscribeToLogicEvents<LLMServiceType extends LLMService<any, any>>(
    eventsTracker: EventsTracker,
    testEventLogger: EventLogger,
    expectedService: LLMServiceType,
    expectedModelId: string,
    expectedError?: LLMServiceError
) {
    testEventLogger.subscribeToLogicEvent(
        LLMServiceImpl.requestSucceededEvent,
        (data) => {
            expect(isLLMServiceRequestSucceeded(data)).toBeTruthy();
            const requestSucceeded = data as LLMServiceRequestSucceeded;

            expect(requestSucceeded.llmService).toEqual(expectedService);
            expect(requestSucceeded.params.modelId).toEqual(expectedModelId);
            eventsTracker.successfulRequestEventsN += 1;
        }
    );
    testEventLogger.subscribeToLogicEvent(
        LLMServiceImpl.requestFailedEvent,
        (data) => {
            expect(isLLMServiceRequestFailed(data)).toBeTruthy();
            const requestFailed = data as LLMServiceRequestFailed;

            expect(requestFailed.llmService).toEqual(expectedService);
            expect(requestFailed.params.modelId).toEqual(expectedModelId);
            if (expectedError !== undefined) {
                expect(requestFailed.llmServiceError).toEqual(expectedError);
            }
            eventsTracker.failedRequestEventsN += 1;
        }
    );
}
