#!/usr/bin/env node

import { Command } from "commander";

import CreateOneReportService from "./services/createOneReport.service";
import CreateReportService from "./services/createReport.service";

class ReportGenerator {
  private readonly shellCommander: Command;

  constructor() {
    this.shellCommander = new Command();
  }

  public async run() {
    this.shellCommander
      .version("0.0.1")
      .description("HR Report Generator")
      .command("init [name]")
      .alias("i")
      .description("Generate new Report")
      .action(async () => {
        const reportService = CreateReportService.getInstance();

        await reportService.handle();
      });

    this.shellCommander
      .command("generate [name]")
      .description("Generate one Report")
      .alias("g")
      .action(async () => {
        const reportService = CreateOneReportService.getInstance();

        await reportService.handle();
      });

    this.shellCommander.parse(process.argv);
  }
}

(async () => {
  const reportGenerator = new ReportGenerator();

  await reportGenerator.run();
})();
