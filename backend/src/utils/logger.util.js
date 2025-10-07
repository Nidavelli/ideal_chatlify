// logger.util.js
import chalk from "chalk";

const log = {
  success: (msg) => {
    console.log(`${chalk.green.bold("[SUCCESS✅]")} ${chalk.green(msg)}`);
  },
  error: (msg) => {
    console.error(`${chalk.red.bold("[ERROR❌]")} ${chalk.red(msg)}`);
  },
  info: (msg) => {
    console.log(`${chalk.blue.bold("[INFOℹ️]")} ${chalk.blue(msg)}`);
  },
  warn: (msg) => {
    console.warn(`${chalk.yellow.bold("[WARN⚠️]")} ${chalk.yellow(msg)}`);
  },
};

export default log;
