import { DefinedError } from "ajv";
import { window } from "vscode";

import { Time } from "../llm/llmServices/utils/time";

import { ajvErrorsAsString } from "../utils/ajvErrorsHandling";
import { stringifyAnyValue } from "../utils/printers";

export namespace EditorMessages {
    export const timeoutExceeded =
        "The proof checking process timed out. Please try again.";

    export const noProofsForAdmit = (lineWithAdmitNumber: number) =>
        `Coqpilot failed to find a proof for the admit at line ${lineWithAdmitNumber}.`;

    export const errorOccurred = (errorMessage: string) =>
        `Coqpilot got an error: ${errorMessage}. Please make sure the environment is properly set and the plugin is configured correctly. For more information, see the README: https://github.com/JetBrains-Research/coqpilot/blob/main/README.md. If the error appears to be a bug, please report it by opening an issue in the Coqpilot GitHub repository.`;

    export const serviceBecameUnavailable = (
        serviceName: string,
        errorMessage: string,
        expectedTimeToBecomeAvailable: Time
    ) => {
        const formattedExpectedTime = formatTimeToUIString(
            expectedTimeToBecomeAvailable
        );
        const becameUnavailableMessage = `\`${serviceName}\` became unavailable for this generation.`;
        const tryAgainMessage = `If you want to use it, try again in ~ ${formattedExpectedTime}. Caused by error: "${errorMessage}".`;
        return `${becameUnavailableMessage} ${tryAgainMessage}`;
    };

    export const failedToReachRemoteService = (
        serviceName: string,
        message: string
    ) => {
        const serviceFailureMessage = `\`${serviceName}\` became unavailable for this generation: ${message}.`;
        const tryAgainMessage = `Check your internet connection and try again.`;
        return `${serviceFailureMessage} ${tryAgainMessage}`;
    };

    export const serviceIsAvailableAgain = (serviceName: string) =>
        `\`${serviceName}\` is available again!`;

    export const modelConfiguredIncorrectly = (
        modelId: string,
        errorMessage: string
    ) =>
        `Model "${modelId}" is configured incorrectly: ${errorMessage}. Thus, "${modelId}" will be skipped for this run. Please fix the model's configuration in the settings.`;

    export const unknownContextTheoremsRanker = `Please select one of the existing theorems-ranker types: "distance" or "random".`;

    export const unableToValidateUserSettings = (
        settingsName: string,
        validationErrors: DefinedError[],
        ignoreErrorsWithKeywords: string[]
    ) =>
        `Unable to validate settings for \`${settingsName}\`: ${ajvErrorsAsString(validationErrors, ignoreErrorsWithKeywords)}. Please fix the configuration in the settings.`;

    export const modelsIdsAreNotUnique = (modelId: string) =>
        `Please make identifiers of the models unique ("${modelId}" is not unique).`;

    export const apiKeyIsNotSet = (serviceName: string) =>
        `Please set your ${serviceName} API key in the settings.`;

    export const noValidModelsAreChosen =
        "No valid models are chosen. Please specify at least one in the settings.";

    export const userValueWasOverriden = (
        modelId: string,
        paramName: string,
        withValue: any,
        explanationMessage?: string
    ) => {
        const explanation =
            explanationMessage === undefined ? "" : `: ${explanationMessage}`;
        return `The \`${paramName}\` parameter of the "${modelId}" model was overriden with the value ${stringifyAnyValue(withValue)}${explanation}. Please configure it the same way in the settings.`;
    };
}

export type UIMessageSeverity = "error" | "info" | "warning";

export function showMessageToUser<T extends string>(
    message: string,
    severity: UIMessageSeverity = "info",
    ...items: T[]
): Thenable<T | undefined> {
    switch (severity) {
        case "error":
            return window.showErrorMessage(message, ...items);
        case "info":
            return window.showInformationMessage(message, ...items);
        case "warning":
            return window.showWarningMessage(message, ...items);
    }
}

function formatTimeToUIString(time: Time): string {
    const orderedTimeItems: [number, string][] = [
        [time.days, "day"],
        [time.hours, "hour"],
        [time.minutes, "minute"],
        [time.seconds, "second"],
    ].map(([value, name]) => [
        value as number,
        formatTimeItem(value as number, name as string),
    ]);
    const itemsN = orderedTimeItems.length;

    for (let i = 0; i < itemsN; i++) {
        const [value, formattedItem] = orderedTimeItems[i];
        if (value !== 0) {
            const nextFormattedItem =
                i === itemsN - 1 ? "" : `, ${orderedTimeItems[i + 1][1]}`;
            return `${formattedItem}${nextFormattedItem}`;
        }
    }
    const zeroSeconds = orderedTimeItems[3][1];
    return `${zeroSeconds}`;
}

function formatTimeItem(value: number, name: string): string {
    const suffix = value === 1 ? "" : "s";
    return `${value} ${name}${suffix}`;
}
