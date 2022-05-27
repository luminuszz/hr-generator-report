import { addDays, format, eachDayOfInterval } from "date-fns";

import Constants from "../utils/constants";
import createDayReportTemplate from "../utils/createDayReportTemplate";
import createReportTitleTemplate from "../utils/createReportTitleTemplate";
import parseRawToIso from "../utils/parseRawToIso";
import ServiceContract from "./service.contract";

type Answer = {
  start_raw_date: string;
  report_title: string;
  start_time: string;
  end_time: string;
};

const defaultPeriod: Pick<Answer, "start_time" | "end_time"> = {
  start_time: "18:00",
  end_time: "21:00",
};

class CreateReportService extends ServiceContract {
  static getInstance(): CreateReportService {
    return new CreateReportService();
  }

  private async makeQuestions(): Promise<Answer> {
    return this.shellInputs.prompt([
      {
        type: "input",
        name: "start_raw_date",
        message: "Selecione a data inicial (dd/mm/yyyy):",
        default: () => format(new Date(), Constants.defaultDateFormat),
      },
      {
        type: "input",
        name: "start_time",
        message: "Selecione o horário inicial (hh:mm):",
        default: () => defaultPeriod.start_time,
      },
      {
        type: "input",
        name: "end_time",
        message: "Selecione o horário final (hh:mm):",
        default: () => defaultPeriod.end_time,
      },
      {
        type: "input",
        name: "report_title",
        message: "Informe o motivo",
      },
    ]);
  }

  async handle(): Promise<void> {
    const response = await this.makeQuestions();

    const startDate = parseRawToIso(response.start_raw_date);
    const endDate = addDays(
      parseRawToIso(response.start_raw_date),
      Constants.ONE_WEEK
    );

    const intervalDates = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const currentPath = await this.shellCommander.pwd();

    const reportPath = `${currentPath}/report.md`;

    await this.shellCommander.touch(reportPath);

    const reportBody = intervalDates.map((currentInterval) =>
      createDayReportTemplate({
        date: format(currentInterval, Constants.defaultDateFormat),
        startTime: response.start_time,
        endTime: response.end_time,
        description: response.report_title,
        interval: 3,
      })
    );

    const report = `
    ${createReportTitleTemplate(startDate)}
    ${reportBody.join("")}
    `;

    await this.shellCommander.exec(`echo "${report}" >> report.md`);

    await this.shellCommander.echo("Relatório gerado com sucesso!");

    await this.shellCommander.echo(`Relatório salvo em ${reportPath}`);
  }
}

export default CreateReportService;
