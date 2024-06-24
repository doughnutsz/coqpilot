import { stringifyAnyValue } from "../../../../utils/printers";
import {
    appendToFile,
    createFileWithParentDirectories,
} from "../utils/fsUtils";

import { LogColor, colorize } from "./colorLogging";

export enum SeverityLevel {
    ERROR = 0,
    INFO = 1,
    DEBUG = 2,
}

export abstract class BenchmarkingLogger {
    constructor(
        protected loggerSeverity: SeverityLevel,
        protected recordIdentifier: string = "",
        protected lineEnd: string = "\n"
    ) {}

    setLoggerSeverity(severity: SeverityLevel) {
        this.loggerSeverity = severity;
    }

    abstract createChildLoggerWithIdentifier(
        recordIdentifier: string
    ): BenchmarkingLogger;

    protected abstract log(
        severity: SeverityLevel,
        message: string,
        color: LogColor | undefined,
        lineEnd: string,
        recordIdentifier: string
    ): void;

    error(
        message: string,
        color: LogColor | undefined = "red",
        lineEnd: string = this.lineEnd,
        recordIdentifier: string = this.recordIdentifier
    ) {
        this.log(
            SeverityLevel.ERROR,
            message,
            color,
            recordIdentifier,
            lineEnd
        );
    }

    info(
        message: string,
        color: LogColor | undefined = undefined,
        lineEnd: string = this.lineEnd,
        recordIdentifier: string = this.recordIdentifier
    ) {
        this.log(SeverityLevel.INFO, message, color, recordIdentifier, lineEnd);
    }

    debug(
        message: string,
        color: LogColor | undefined = "gray",
        lineEnd: string = this.lineEnd,
        recordIdentifier: string = this.recordIdentifier
    ) {
        this.log(
            SeverityLevel.DEBUG,
            message,
            color,
            recordIdentifier,
            lineEnd
        );
    }

    separatorLine(
        suffix: string = "",
        severity: SeverityLevel = SeverityLevel.INFO,
        color: LogColor | undefined = undefined
    ) {
        this.log(severity, `----------------------------`, color, "", suffix);
    }

    asOneRecord(): AsOneRecordLogsBuilder {
        return new AsOneRecordLogsBuilder(this, this.lineEnd);
    }
}

export class AsOneRecordLogsBuilder {
    constructor(
        private readonly logger: BenchmarkingLogger,
        private readonly lineEnd: string
    ) {}

    private firstMessageLogged = false;

    private logImpl(
        callLogger: (
            message: string,
            color: LogColor | undefined,
            lineEnd: string,
            recordIdentifier?: string
        ) => void,
        message: string,
        color: LogColor | undefined,
        lineEnd: string
    ): AsOneRecordLogsBuilder {
        if (this.firstMessageLogged) {
            callLogger(message, color, lineEnd, "");
        } else {
            callLogger(message, color, lineEnd);
            this.firstMessageLogged = true;
        }
        return this;
    }

    error(
        message: string,
        color: LogColor | undefined = "red",
        lineEnd: string = this.lineEnd
    ): AsOneRecordLogsBuilder {
        return this.logImpl(
            this.logger.error.bind(this.logger),
            message,
            color,
            lineEnd
        );
    }

    info(
        message: string,
        color: LogColor | undefined = undefined,
        lineEnd: string = this.lineEnd
    ): AsOneRecordLogsBuilder {
        return this.logImpl(
            this.logger.info.bind(this.logger),
            message,
            color,
            lineEnd
        );
    }

    debug(
        message: string,
        color: LogColor | undefined = "gray",
        lineEnd: string = this.lineEnd
    ): AsOneRecordLogsBuilder {
        return this.logImpl(
            this.logger.debug.bind(this.logger),
            message,
            color,
            lineEnd
        );
    }
}

export class BenchmarkingLoggerImpl extends BenchmarkingLogger {
    constructor(
        loggerSeverity: SeverityLevel,
        readonly resolvedFilePath: string | undefined,
        recordIdentifier: string = "",
        lineEnd: string = "\n"
    ) {
        super(loggerSeverity, recordIdentifier, lineEnd);
        if (this.resolvedFilePath !== undefined) {
            createFileWithParentDirectories(false, this.resolvedFilePath);
        }
    }

    createChildLoggerWithIdentifier(
        recordIdentifier: string
    ): BenchmarkingLogger {
        return new BenchmarkingLoggerImpl(
            this.loggerSeverity,
            [this.recordIdentifier, recordIdentifier]
                .filter((identifier) => identifier !== "")
                .join(this.lineEnd)
        );
    }

    protected log(
        severity: SeverityLevel,
        message: string,
        color: LogColor | undefined,
        lineEnd: string,
        recordIdentifier: string
    ) {
        if (this.loggerSeverity < severity) {
            return;
        }
        this.print(recordIdentifier, lineEnd);
        if (color === undefined) {
            this.print(message, lineEnd);
        } else {
            this.print(colorize(message, color), lineEnd);
        }
    }

    private print(message: string, lineEnd: string) {
        const messageWithLineEnd = `${message}${lineEnd}`;
        if (this.resolvedFilePath === undefined) {
            // TODO: does not work in tests => will be fixed after moving out from tests
            // for now, `console.error` can be used (but `lineEnd`-s won't be supported then)
            console.error(message);
            // process.stderr.write(messageWithLineEnd);
        } else {
            appendToFile(messageWithLineEnd, this.resolvedFilePath, (e) =>
                console.error(
                    `Failed to append message to logs file "${this.resolvedFilePath}": "${message}"\nCause: ${stringifyAnyValue(e)}`
                )
            );
        }
    }
}
