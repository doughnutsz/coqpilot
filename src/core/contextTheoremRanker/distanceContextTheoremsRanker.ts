import { Theorem } from "../../coqParser/parsedTypes";
import { CompletionContext } from "../completionGenerator";

import { ContextTheoremsRanker } from "./contextTheoremsRanker";

export class DistanceContextTheoremsRanker implements ContextTheoremsRanker {
    rankContextTheorems(
        theorems: Theorem[],
        completionContext: CompletionContext
    ): Theorem[] {
        const theoremsBeforeCompletionPosition = theorems.filter(
            (theorem) =>
                theorem.statement_range.start.line <
                completionContext.prefixEndPosition.line
        );
        // Sort theorems such that closer theorems are first
        theoremsBeforeCompletionPosition.sort((a, b) => {
            return b.statement_range.start.line - a.statement_range.start.line;
        });

        const theoremsAfterCompletionPosition = theorems.filter(
            (theorem) =>
                theorem.statement_range.start.line >
                completionContext.prefixEndPosition.line
        );

        theoremsAfterCompletionPosition.sort((a, b) => {
            return a.statement_range.start.line - b.statement_range.start.line;
        });

        return theoremsBeforeCompletionPosition.concat(
            theoremsAfterCompletionPosition
        );
    }
}
