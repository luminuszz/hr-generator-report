import {
  addDays,
  addHours,
  addMinutes,
  eachDayOfInterval,
  format,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { resolve } from "node:path";

import ServiceContract from "../types/service.contract";
import Constants from "../utils/constants";
import createDayReportTemplate from "../utils/createDayReportTemplate";
import createReportTitleTemplate from "../utils/createReportTitleTemplate";
import parseRawToIso from "../utils/parseRawToIso";
import { splitTime } from "../utils/parseTime";

type Answer = {
  start_raw_date: string;
  report_title: string;
  start_time: string;
  end_time: string;
};
type CreateReportResponse = {
  report_path: string;
  report_name: string;
};

type WriteReportArgs = {
  path: string;
  content: string;
};

const defaultPeriod: Pick<Answer, "start_time" | "end_time"> = {
  start_time: "18:00",
  end_time: "21:00",
};

class CreateReportService extends ServiceContract {
  public static getInstance(): CreateReportService {
    return new CreateReportService();
  }

  private static formatDateTimeWeekDay(date: Date): string {
    return format(date, "dd/MM/yyyy '-' EEEE", { locale: ptBR });
  }

  private static getIntervalDates(startDate: Date, endDate: Date): Date[] {
    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }

  private async makeQuestionsForReportBody(): Promise<Answer> {
    return this.shellInputs.prompt<Answer>([
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

  private async makeQuestionForValidDatesForReportBody(
    dates: Date[]
  ): Promise<Date[]> {
    const { validDates } = await this.shellInputs.prompt<{
      validDates: Date[];
    }>([
      {
        type: "checkbox",
        name: "validDates",
        message: "Selecione as datas:",
        choices: dates.map((date) => ({
          checked: true,
          value: date,
          name: CreateReportService.formatDateTimeWeekDay(date),
        })),
      },
    ]);

    return validDates;
  }

  private async createBlankReport(
    directory?: string
  ): Promise<CreateReportResponse> {
    let reportDir;

    if (directory) {
      reportDir = resolve(directory);
    } else {
      reportDir = await this.shellCommander.pwd();
    }

    const reportPath = resolve(reportDir.toString(), Constants.reportFileName);

    await this.shellCommander.touch(reportPath, "report.md");

    return {
      report_name: Constants.reportFileName,
      report_path: reportPath,
    };
  }

  private async writeReport({ content, path }: WriteReportArgs): Promise<void> {
    await this.shellCommander.exec(`echo "${content}" >> ${path}`);
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

  async handle(): Promise<void> {
    const { end_time, start_time, report_title, start_raw_date } =
      await this.makeQuestionsForReportBody();

    const startDate = parseRawToIso(start_raw_date);
    const endDate = addDays(parseRawToIso(start_raw_date), Constants.ONE_WEEK);

    const intervalDateList = CreateReportService.getIntervalDates(
      startDate,
      endDate
    );

    const validDates = await this.makeQuestionForValidDatesForReportBody(
      intervalDateList
    );

    const reportBody = validDates.map((currentDate) =>
      createDayReportTemplate({
        date: format(currentDate, Constants.defaultDateFormat),
        startTime: start_time,
        endTime: end_time,
        description: report_title,
        interval: CreateReportService.getDuration(
          currentDate,
          start_time,
          end_time
        ),
      })
    );

    const report = `
    ${createReportTitleTemplate(startDate)}
    ${reportBody.join("")}
    `;

    const { report_path } = await this.createBlankReport();

    await this.writeReport({
      content: report,
      path: report_path,
    });

    await this.shellCommander.echo("Relatório gerado com sucesso!");

    await this.shellCommander.echo(`Relatório salvo em ${report_path}`);
  }
}

export default CreateReportService;
