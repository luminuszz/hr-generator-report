import {
  addDays,
  addHours,
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
import parseTime, { splitTime } from "../utils/parseTime";

export default class CreateOneReportService extends ServiceContract {
  static getInstance() {
    return new CreateOneReportService();
  }

  private static getDuration(
    currentDate: Date,
    startTime: string,
    endTime: string
  ) {
    const [startHour, startMinute] = splitTime(startTime);
    const [endHour, endMinute] = splitTime(endTime);

    const startDate = addMinutes(addHours(currentDate, startHour), startMinute);

    const isNextDay = endHour < startHour;

    const endDate = isNextDay
      ? addDays(addMinutes(addHours(currentDate, endHour), endMinute), 1)
      : addMinutes(addHours(currentDate, endHour), endMinute);

    const duration = intervalToDuration({
      start: startDate,
      end: endDate,
    });

    return formatDuration(duration, {
      locale: ptBR,
      format: ["hours", "minutes"],
    });
  }

  private async makeQuestions(): Promise<Answer> {
    const today = new Date();

    return this.shellInputs.prompt([
      {
        type: "input",
        name: "start_raw_date",
        message: "Selecione a data inicial (dd/mm/yyyy):",
        default: () => format(today, Constants.defaultDateFormat),
      },
      {
        type: "input",
        name: "start_time",
        message: "Selecione o horário inicial (hh:mm):",
        default: () => format(today, "HH:mm"),
      },
      {
        type: "input",
        name: "end_time",
        message: "Selecione o horário final (hh:mm):",
        default: () => format(today, "HH:mm"),
      },
      {
        type: "input",
        name: "report_title",
        message: "Informe o motivo",
        validate: (value: string) => {
          if (value.trim().length > 0) {
            return true;
          }

          return "O motivo é obrigatório";
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
      interval: CreateOneReportService.getDuration(
        currentDate,
        response.start_time,
        response.end_time
      ),
    })}
    
    `;

    const currentPath = await this.shellCommander.pwd();

    const reportsPath = `${currentPath}/report.md`;

    await this.shellCommander.touch(reportsPath);

    await this.shellCommander.exec(`echo "${report}" >> report.md`);

    await this.shellCommander.echo("Relatório gerado com sucesso!");

    await this.shellCommander.echo(`Relatório salvo em ${reportsPath}`);
  }
}
