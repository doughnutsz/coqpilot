import { Position as VSPosition, Range as VSRange } from "vscode";
import { Position, Range } from "vscode-languageclient";

export function toVSCodeRange(range: Range): VSRange {
    return new VSRange(
        toVSCodePosition(range.start),
        toVSCodePosition(range.end)
    );
}

export function toVSCodePosition(position: Position): VSPosition {
    return new VSPosition(position.line, position.character);
}

export function positionInRange(position: Position, range: Range): boolean {
    const vsPosition = toVSCodePosition(position);
    const vsRange = toVSCodeRange(range);

    return vsRange.contains(vsPosition);
}
