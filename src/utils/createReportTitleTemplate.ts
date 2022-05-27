import { format } from "date-fns";

import Constants from "./constants";

export default (currentDate: Date) => {
  const formattedDate = format(currentDate, Constants.defaultDateFormat);

  const currentHour = new Date().getHours();

  const reportCompliment =
    currentHour < 12
      ? "Bom dia"
      : currentHour <= 18
      ? "Boa tarde"
      : "Boa noite";

  const subTitle = `Segue banco de horas: ${formattedDate}`;

  return `
   ${reportCompliment},
   ${subTitle}
  `;
};
