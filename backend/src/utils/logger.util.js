// utils/logger.js
import chalk from "chalk";

export const log = {
  success: (msg, tag = "") => {
    console.log(
      `${chalk.green("✅ SUCCESS")} ${formatTag(tag)} ${chalk.green(msg)}`
    );
  },
  error: (msg, tag = "") => {
    console.error(
      `${chalk.red("❌ ERROR")} ${formatTag(tag)} ${chalk.red(msg)}`
    );
  },
  warn: (msg, tag = "") => {
    console.warn(
      `${chalk.yellow("⚠️ WARNING")} ${formatTag(tag)} ${chalk.yellow(msg)}`
    );
  },
  info: (msg, tag = "") => {
    console.log(
      `${chalk.blue("ℹ️ INFO")} ${formatTag(tag)} ${chalk.blue(msg)}`
    );
  },
};

function formatTag(tag) {
  return tag ? chalk.magenta(`[${tag}]\t`) : "";
}
