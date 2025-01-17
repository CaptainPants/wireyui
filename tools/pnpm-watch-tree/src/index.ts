import { program } from "commander";

import { filterProjects } from "./filterProjects.ts";
import { loadProjects } from "./loadProjects.ts";
import { runWatch } from "./runWatch.ts";
import { setMaxListeners } from "node:events";
import chalk from "chalk";

interface Options {
    successPattern: string;
}

const abortController = new AbortController();

// This is driven by however many processes we may have open
setMaxListeners(100, abortController.signal);

process.on('SIGINT', function () {
    abortController.abort('SIGINT');
});

program
    .version("1.0.0")
    .description("watch-tree");

program
    .command('run <target>')
    .requiredOption('--successPattern <successPattern>')
    .action(async (target: string, { successPattern }: Options) => {
        const projects = await loadProjects();
        const filtered = filterProjects(projects, target);

        await runWatch({
            projects: filtered,
            target: target,
            signal: abortController.signal,
            successPattern: successPattern
        });

        console.log(chalk.green('Finished'));
    });

await program.parseAsync();
