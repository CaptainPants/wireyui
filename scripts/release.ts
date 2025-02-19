import { execSync, spawn } from "child_process";
import { exit } from "process";

const args = process.argv.slice(2);

if (args.length < 1) {
    throw new Error('Expected at least one argument');
}

const [ver, dryRun = true] = args;

function output(text: string) {
    console.log(text);
}

function runAndReturn(command: string, { writeOutput = true, logCommand = false } = {}): string {
    if (logCommand) {
        output('Running> ' + command);
    }

    const res = execSync(command, { encoding: 'utf-8' });
    if (writeOutput){
        output(res);
    }
    return res;
}

async function runAsyncWithStdoutPassthrough(command: string): Promise<void> {
    return new Promise<void>(
        (resolve, reject) => {
            const proc = spawn(command, { stdio: "overlapped", shell: true });

            proc.on('close', (code, signal) => code == 0 ? resolve(void 0) : reject(new Error(`Killed ${code} (${signal})`)));
        }
    )
}

const currentBranch = runAndReturn('git rev-parse --abbrev-ref HEAD', { writeOutput: false });
output(`Releasing based on branch ${currentBranch}.`);

const diff = runAndReturn('git diff --name-only --raw', { writeOutput: false })?.trim();
const changedFiles = diff === '' ? [] : diff.split('\n');
if (changedFiles.length > 0) {
    output(`Changes found, please commit or revert them to continue: \n- ${changedFiles.join('\n- ')}`);
    exit(1);
}

runAndReturn('git branch temp_release -c -f');
runAndReturn('git switch temp_release');

runAndReturn(`pnpm run set-versions ${ver}`);

runAndReturn('git add -A');
runAndReturn('git commit -m "Version numbers"');

if (dryRun) {
    output('PUBLISHING (DRY RUN)');
    await runAsyncWithStdoutPassthrough('pnpm run publish-all:dry-run');
}
else {
    output('PUBLISHING (REAL)');
    await runAsyncWithStdoutPassthrough('pnpm run publish-all:dry-run');
}

exit(0);