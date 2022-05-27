import {
  addMinutes,
  format,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import { Answer } from "../types/answer.type";
import ServiceContract from "../types/service.contract";
import Constants from "../utils/constants";
import createDayReportTemplate from "../utils/createDayReportTemplate";
import createReportTitleTemplate from "../utils/createReportTitleTemplate";
import parseRawToIso from "../utils/parseRawToIso";
import parseTime from "../utils/parseTime";

export default class CreateOneReportService extends ServiceContract {
  static getInstance() {
    return new CreateOneReportService();
  }

  private async makeQuestions(): Promise<Answer> {
    const today = new Date();

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
        default: () => format(today, "hh:mm"),
      },
      {
        type: "input",
        name: "end_time",
        message: "Selecione o horário final (hh:mm):",
        default: () => format(addMinutes(today, 30), "hh:mm"),
      },
      {
        type: "input",
        name: "report_title",
        message: "Informe o motivo",
        validate: (value) => {
          if (value.length) {
            return true;
          }

          return "Informe o motivo";
        },
      },
    ]);
  }

  async handle(): Promise<void> {
    const response = await this.makeQuestions();

    const currentDate = parseRawToIso(response.start_raw_date);

    const interval = intervalToDuration({
      start: parseTime(response.start_time),
      end: parseTime(response.end_time),
    });

    const report = `
    ${createReportTitleTemplate(currentDate)}
    ${createDayReportTemplate({
      date: response.start_raw_date,
      startTime: response.start_time,
      endTime: response.end_time,
      description: response.report_title,
      interval: formatDuration(
        {
          minutes: interval.minutes,
          hours: interval.hours,
        },
        {
          locale: ptBR,
          format: ["hours", "minutes"],
        }
      ),
    })}
    
    `;

    const currentPath = await this.shellCommander.pwd();

    const reportsPath = `${currentPath}/report.md`;

    await this.shellCommander.touch(reportsPath);

    await this.shellCommander.exec(`echo "${report}" >> report.md`);
  }
}
