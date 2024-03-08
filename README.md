# coqpilot

*Authors:* Andrei Kozyrev, Gleb Solovev and Anton Podkopaev, [Programming Languages and Tools Lab](https://lp.jetbrains.com/research/plt_lab/) at JetBrains Research.

`Coqpilot` is a [Visual Studio Code](https://code.visualstudio.com/) extension that is designed to help automate writing of Coq proofs. It uses Large Language Models to generate multiple potential proofs and then uses [coq-lsp](https://github.com/ejgallego/coq-lsp) to typecheck them. It substitutes the proof in the editor only if a valid proof is found. 

Now `coqpilot` is in early beta and seeks for feedbacks. Please feel free to open an issue regarding any problem you encounter or any feature you want to see in the future. 

***Important:*** This version 2.0.0 is not yet tested very well. Please feel free to open an issue if you encounter any problem. Moreover, stay tuned for the soon release of the 2.0.1.

## Requirements

* `coq-lsp` version `0.1.8+8.19.0` is currently required to run the extension.

## Brief technical overview

`Coqpilot` fetches proofs from multiple completion services. Now we support: 
- a service that always returns a list of pre-defined in the settings tactics/coq sentances.
- an [open-ai](https://openai.com) gpt service.
- a service that fetches completions from the model, running locally in LM Studio.
- a service that uses Grazie platform (only for JetBrains employees for now).

For each service, an array of models could be defined through the settings. Each model will be used for generation independantly. This brings freedom to the user to experiment with different model parameters, e.g. temperature, prompt, etc.

When `CoqPilot` completion command is issued, it parses the currently opened file, extracts theorems that have complete proofs and processes them into a message history for the LLM. It helps LLM to keep the style and hallucinate less. 

For each `admit.` present in the file, an independent completion process is issued. If a valid proof is found, it is substituted in the editor. `CoqPilot` also allows a multi-round fixing procedure for the proofs from the LLM. I.e. if the proof was incorrect, compiler message could be automatically sent to the LLM with a request to repair it. It can now be configured in the settings. One can set the amount of attempts for the consequtive proof fixing with compiler feedback.

As soon as at least one valid proof is found, it is substituted in the editor and the process is finished.

**Notice:** By default, coqpilot sets only `predefinedProofs` and `open-ai` services. The first one tries `auto.` tactic and the second one has one model -- `gpt-3.5`. By default the `apiKey` for open-ai is not set, i.e. set to `None`. Do not forget to change that in the settings before using this service.

**Notice:** File `settings.json` declares not all the settings, but those that are overriden from the defaults. Keep that in mind, if you want, for example, to turn off the `open-ai` service. For that, you would need to override the corresponding setting with an empty array, but not delete this property from the file.

## Example usage

`Coqpilot` only runs on an opened `coq` file. User can:
- Run `coqpilot` with some chosen selection to try substitute all admits in this selection.

<img src="./etc/gif/solve-in-selection.gif"/>

- Run `coqpilot` to try substitute all admits in the file.
- Run `coqpilot` to substitute the proof for the admit if there is one under the cursor.

## Installation

### Coq-lsp installation

To make the extension running you will have to install `coq-lsp` server. You can install it using opam: 
```bash
opam pin add coq-lsp 0.1.8+8.19.0
opam install coq-lsp
```
For more information on how to install `coq-lsp` please refer to [coq-lsp](https://github.com/ejgallego/coq-lsp). 

With coq-lsp, extension should have everything it needs to run.

### Building locally

To build the extension locally, you will need to have `npm` installed. Then you can clone the repository and run the following commands:
```bash
npm install
npm run compile
```

To run the extension, you can press `F5` in the vscode. It will open a new window with the extension running.

To run tests you should go to the `src/test/resources/coqProj` directory and run make:
```bash
make 
```

Otherwise, if you do not want to build that small project, you cna run: 
```bash
npm run test-ci
```

## Architecture

The extension's architecture overview is stored in the [ARCHITECTURE.md](https://github.com/JetBrains-Research/coqpilot/blob/refactor/ARCHITECTURE.md) file. It will be extended and updated as the project evolves.

## Important 

Coqpilot generates aux files with `_cp_aux.v` suffix. Sometimes when generation fails with exception, it is possible that such file will not be deleted. When a project is open, extension shall show a window that asks if you want to add such files to the local project gitignore. 

Moreover, this repository contains a script for your convenience that adds the format of such files to the global gitignore file on your system.  
- Copy the [`set_gitignore.sh`](https://github.com/K-dizzled/coqpilot/blob/main/set_gitignore.sh) file to your computer. Then: 
```bash 
chmod +x set_gitignore.sh
./set_gitignore.sh
```
It will add the format of coqpilot aux files to your global gitignore file on the system, so that even if coqpilot forgets to clean files up, they will not be marked as new files in git.
Comment: Such files are not visible in the vscode explorer, because plugin adds them to the `files.exclude` setting on startup.

## Extension Settings

This extension contributes the following settings:

* `coqpilot.contextTheoremsRankerType` : The type of theorems ranker that will be used to select theorems for proof generation (when context is smaller than taking all of them). Either randomly or by distance from the theorem, with the currently generated admit. 
* `coqpilot.loggingVerbosity` : Verbosity of the logs. Could be `info`, `debug`.

* `coqpilot.openAiModelsParameters`, `coqpilot.predefinedProofsModelsParameters`, `coqpilot.grazieModelsParameters` and `coqpilot.lmStudioModelsParameters`:

Each of these settings are modified in `settings.json` and contain an array of models from this service. Each model will be used for generation independantly. Multiple models for a single service could be defined. For example, you can define parameters for two open-ai gpt models. One would be using `gpt-3.5` and the other one `gpt-4`. CoqPilot will first try to generate proofs using the first model, and if it fails, it will try the second one. This way coqpilot iterates over all services (currently 4 of them) and for each service it iterates over all models. 

## Contributed Commands

* `coqpilot.perform_completion_under_cursor`: Try to generate proof for the goal under the cursor.
* `coqpilot.perform_completion_for_all_admits`: Try to prove all holes (admitted goals) in the current file.
* `coqpilot.perform_completion_in_selection`: Try to prove holes (admitted goals) in selection.

## Planned Features

- Add benchmarking options for various models: soon. 

## Release Notes

Release notes could be found in the [CHANGELOG.md](https://github.com/JetBrains-Research/coqpilot/blob/refactor/CHANGELOG.md) file.
