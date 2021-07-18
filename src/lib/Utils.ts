"use strict";
import * as path from "path";
import FileSearch from "./fileSearch";
import sh from "shelljs";
import { Options } from "./Options";
const fileSearch = new FileSearch();

export function compileCSS(
  file: string,
  test?: boolean
): { command: string; outputFilePath: string } | undefined {
  const outputFilePath = resolveOutputPath(file);
  const Config = Options.getInstance();
  // As a rule, we don't compile hidden files for now. If we encounter one,
  // just return.
  const exec = require("child_process").exec;
  if (fileSearch.isHiddenFile(outputFilePath)) return undefined;

  const enableJsFlag = Config.enableJs ? " --js" : "",
    minifiedFlag = Config.minified ? " -x" : "",
    sourceMap = Config.sourceMap ? " --source-map" : "",
    lessArgs = Config.lessArgs ? getLessArgs(Config.lessArgs) : "",
    plugins = Config.plugins
      ? " --" + Config.plugins.split(",").join(" --")
      : "",
    command =
      "lessc" +
      lessArgs +
      sourceMap +
      enableJsFlag +
      minifiedFlag +
      plugins +
      " " +
      JSON.stringify(file) +
      " " +
      outputFilePath;
  // Run the command
  if (!test)
    exec(command, function (error: string, stdout: string) {
      if (error !== null) {
        console.log(error);
        if (Config.runOnce) process.exit(1);
      }
      if (stdout) console.error(stdout);
    });
  return {
    command: command,
    outputFilePath: outputFilePath,
  };
}

export function getDateTime(): string {
  const date = new Date();
  let displayDate: string = "",
    hour = date.getHours(),
    min = date.getMinutes(),
    sec = date.getSeconds(),
    year = date.getFullYear(),
    month = date.getMonth() + 1,
    day = date.getDate();

  displayDate += (hour < 10 ? "0" : "") + hour;
  displayDate += ":" + (min < 10 ? "0" : "") + min;
  displayDate += ":" + (sec < 10 ? "0" : "") + sec;
  displayDate += " on " + (day < 10 ? "0" : "") + day;
  displayDate += "/" + (month < 10 ? "0" : "") + month + "/" + year;
  return displayDate;
}

export function resolveOutputPath(filePath: string) {
  const cwd = sh.pwd().toString(),
    fullPath = path.resolve(filePath),
    parsedPath = path.parse(fullPath),
    Config = Options.getInstance();

  // Only empty when unit testing it seems
  let relativePath: string, dirname: string;
  if (Config.watchFolder) {
    relativePath = path.relative(Config.watchFolder, fullPath);
    dirname = path.dirname(relativePath);
  } else {
    dirname = path.dirname(filePath);
  }
  const filename = parsedPath.name;

  let formatted: string = path.format({
    dir: dirname,
    name: filename,
    ext: (Config.minified ? ".min" : "") + ".css",
  });

  // No matter the path of the main file, the output must always land in the output folder
  formatted = formatted.replace(/^(\.\.[\/\\])+/, "");

  const finalFullPath = path.resolve(Config.outputFolder, formatted);
  const shortPath = path.relative(cwd, finalFullPath);

  return JSON.stringify(shortPath);
}

export function getLessArgs(args: string) {
  const arr = args.split(",");
  return " --" + arr.join(" --");
}

export function filterFiles(f: string) {
  var filename = path.basename(f),
    extension = path.extname(f),
    Config = Options.getInstance(),
    allowedExtensions = Config.allowedExtensions;

  if (filename == "" || allowedExtensions.indexOf(extension) == -1) {
    return true;
  } else {
    // If we're including hidden files then don't ignore this file
    if (Config.includeHidden) return false;
    // Otherwise, do ignore this file if it's a hidden file
    else {
      return fileSearch.isHiddenFile(filename);
    }
  }
}
